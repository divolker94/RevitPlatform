from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import uuid

from .models import Order, OrderItem, OrderDocument, OrderPayment, BIMFamilyCategory
from .serializers import (
    OrderSerializer, OrderCreateSerializer, OrderItemSerializer,
    OrderDocumentSerializer, OrderPaymentSerializer, BIMFamilyCategorySerializer,
    AddToOrderSerializer, OrderCalculationSerializer
)
from architectural_projects.models import ArchitecturalProject
from bim_families.models import BimFamily

class BIMFamilyCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """API для категорий BIM-семейств"""
    queryset = BIMFamilyCategory.objects.all()
    serializer_class = BIMFamilyCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class OrderViewSet(viewsets.ModelViewSet):
    """API для управления заказами"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'specialistprofile') and user.specialistprofile.specialist_type == 'manager':
            # BIM-менеджер видит все заказы
            return Order.objects.all()
        else:
            # Клиент видит только свои заказы
            return Order.objects.filter(customer=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer
    
    def perform_create(self, serializer):
        # Генерируем уникальный номер заказа
        order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        serializer.save(
            customer=self.request.user,
            order_number=order_number,
            work_type_multiplier=self._get_work_type_multiplier(serializer.validated_data.get('work_type', 'new_construction'))
        )
    
    def _get_work_type_multiplier(self, work_type):
        """Получаем коэффициент типа работ"""
        multipliers = {
            'new_construction': Decimal('1.0'),
            'reconstruction': Decimal('1.15'),
            'capital_repair': Decimal('1.25'),
            'cramped_conditions': Decimal('1.2'),
        }
        return multipliers.get(work_type, Decimal('1.0'))
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Добавить элемент в заказ"""
        order = self.get_object()
        serializer = AddToOrderSerializer(data=request.data)
        
        if serializer.is_valid():
            item_type = serializer.validated_data['item_type']
            item_id = serializer.validated_data['item_id']
            quantity = serializer.validated_data['quantity']
            notes = serializer.validated_data.get('notes', '')
            
            try:
                if item_type == 'architectural_project':
                    project = ArchitecturalProject.objects.get(id=item_id)
                    item, created = OrderItem.objects.get_or_create(
                        order=order,
                        architectural_project=project,
                        defaults={
                            'name': project.name,
                            'category': project.category,
                            'area': project.total_area,
                            'base_cost': project.design_cost or 0,
                            'sections_count': project.sections_count or 0,
                            'functional_class': project.functional_class or '',
                            'quantity': quantity,
                            'unit_cost': project.design_cost or 0,
                            'notes': notes
                        }
                    )
                    if not created:
                        item.quantity += quantity
                        item.save()
                
                elif item_type == 'bim_family':
                    family = BimFamily.objects.get(id=item_id)
                    item, created = OrderItem.objects.get_or_create(
                        order=order,
                        bim_family=family,
                        defaults={
                            'name': family.name,
                            'category': family.category.name if family.category else 'Не указано',
                            'base_cost': family.cost or 0,
                            'quantity': quantity,
                            'unit_cost': family.cost or 0,
                            'notes': notes
                        }
                    )
                    if not created:
                        item.quantity += quantity
                        item.save()
                
                # Пересчитываем стоимость заказа
                order.calculate_final_cost()
                order.save()
                
                return Response({'message': 'Элемент добавлен в заказ'}, status=status.HTTP_200_OK)
                
            except (ArchitecturalProject.DoesNotExist, BimFamily.DoesNotExist):
                return Response({'error': 'Элемент не найден'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def remove_item(self, request, pk=None):
        """Убрать элемент из заказа"""
        order = self.get_object()
        item_id = request.data.get('item_id')
        
        try:
            item = OrderItem.objects.get(id=item_id, order=order)
            item.delete()
            
            # Пересчитываем стоимость заказа
            order.calculate_final_cost()
            order.save()
            
            return Response({'message': 'Элемент удален из заказа'}, status=status.HTTP_200_OK)
        except OrderItem.DoesNotExist:
            return Response({'error': 'Элемент не найден'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def calculate_cost(self, request, pk=None):
        """Рассчитать стоимость заказа"""
        order = self.get_object()
        
        # Получаем площадь заказчика
        customer_area = request.data.get('customer_area')
        if customer_area:
            order.customer_area = Decimal(customer_area)
            
            # Рассчитываем корректировку по площади
            if order.base_cost > 0:
                # Простая логика: если площадь отличается более чем на 20%, применяем коэффициент
                base_area = sum(item.area or 0 for item in order.order_items.all() if item.area)
                if base_area > 0:
                    area_ratio = Decimal(customer_area) / base_area
                    if area_ratio < Decimal('0.8') or area_ratio > Decimal('1.2'):
                        order.area_adjustment = Decimal('1.3') # Увеличение на 30%
                    else:
                        order.area_adjustment = Decimal('1.0')
        
        # Рассчитываем финальную стоимость
        final_cost = order.calculate_final_cost()
        
        # Формируем ответ
        calculation_data = {
            'base_cost': order.base_cost,
            'work_type_multiplier': order.work_type_multiplier,
            'area_adjustment': order.area_adjustment,
            'family_items_cost': sum(item.total_cost for item in order.order_items.filter(bim_family__isnull=False)),
            'final_cost': final_cost,
            'advance_amount': order.get_advance_amount(),
            'remaining_amount': order.get_remaining_amount()
        }
        
        serializer = OrderCalculationSerializer(calculation_data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def submit_order(self, request, pk=None):
        """Отправить заказ на рассмотрение"""
        order = self.get_object()
        
        if order.order_status != 'draft':
            return Response({'error': 'Заказ уже отправлен'}, status=status.HTTP_400_BAD_REQUEST)
        
        order.order_status = 'submitted'
        order.submitted_at = timezone.now()
        order.save()
        
        return Response({'message': 'Заказ отправлен на рассмотрение'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def assign_manager(self, request, pk=None):
        """Назначить BIM-менеджера для заказа"""
        order = self.get_object()
        manager_id = request.data.get('manager_id')
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            manager = User.objects.get(id=manager_id)
            if hasattr(manager, 'specialistprofile') and manager.specialistprofile.specialist_type == 'manager':
                order.assigned_manager = manager
                order.order_status = 'in_progress'
                order.save()
                return Response({'message': 'BIM-менеджер назначен'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Пользователь не является BIM-менеджером'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def upload_document(self, request, pk=None):
        """Загрузить документ для заказа"""
        order = self.get_object()
        title = request.data.get('title')
        document_type = request.data.get('document_type', 'source')
        file = request.FILES.get('file')
        
        if not all([title, file]):
            return Response({'error': 'Необходимо указать название и файл'}, status=status.HTTP_400_BAD_REQUEST)
        
        document = OrderDocument.objects.create(
            order=order,
            title=title,
            file=file,
            document_type=document_type
        )
        
        serializer = OrderDocumentSerializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class OrderItemViewSet(viewsets.ModelViewSet):
    """API для элементов заказа"""
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [permissions.IsAuthenticated]

class OrderDocumentViewSet(viewsets.ModelViewSet):
    """API для документов заказа"""
    queryset = OrderDocument.objects.all()
    serializer_class = OrderDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

class OrderPaymentViewSet(viewsets.ModelViewSet):
    """API для платежей по заказам"""
    queryset = OrderPayment.objects.all()
    serializer_class = OrderPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def process_payment(self, request, pk=None):
        """Обработать платеж"""
        payment = self.get_object()
        transaction_id = request.data.get('transaction_id')
        
        if transaction_id:
            payment.transaction_id = transaction_id
            payment.status = 'completed'
            payment.save()
            
            # Обновляем статус заказа
            order = payment.order
            if payment.payment_type == 'advance':
                order.advance_paid += payment.amount
                order.payment_status = 'partial'
            elif payment.payment_type == 'final':
                order.final_payment_paid += payment.amount
                if order.final_payment_paid >= order.final_cost:
                    order.payment_status = 'paid'
            
            order.save()
            
            return Response({'message': 'Платеж обработан'}, status=status.HTTP_200_OK)
        
        return Response({'error': 'Необходим ID транзакции'}, status=status.HTTP_400_BAD_REQUEST)