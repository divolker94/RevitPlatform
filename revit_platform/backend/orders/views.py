from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import uuid

from .models import Order, OrderItem, OrderDocument, OrderPayment, BIMFamilyCategory, OrderFile, OrderFileComment
from .serializers import (
    OrderSerializer, OrderCreateSerializer, OrderItemSerializer,
    OrderDocumentSerializer, OrderPaymentSerializer, BIMFamilyCategorySerializer,
    AddToOrderSerializer, OrderCalculationSerializer, OrderFileSerializer, OrderFileCommentSerializer
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
        print(f"OrderViewSet - User: {user.username}, User type: {getattr(user, 'user_type', 'None')}")
        
        # Проверяем, является ли пользователь BIM-менеджером
        is_manager = False
        if hasattr(user, 'specialist_profile'):
            print(f"OrderViewSet - Specialist type: {user.specialist_profile.specialist_type}")
            is_manager = user.specialist_profile.specialist_type == 'manager'
        else:
            print(f"OrderViewSet - No specialist profile")
        
        if is_manager:
            # BIM-менеджер видит все заказы
            print(f"OrderViewSet - Manager view: showing all orders")
            return Order.objects.all()
        else:
            # Клиент видит только свои заказы
            print(f"OrderViewSet - Customer view: showing orders for {user.username}")
            return Order.objects.filter(customer=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer
    
    def perform_create(self, serializer):
        # Генерируем уникальный номер заказа
        order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        order = serializer.save(
            customer=self.request.user,
            order_number=order_number,
            work_type_multiplier=self._get_work_type_multiplier(serializer.validated_data.get('work_type', 'new_construction'))
        )
        
        # Рассчитываем аванс (50% от итоговой стоимости)
        if order.final_cost > 0:
            order.advance_paid = order.final_cost * Decimal('0.5')
            order.save()
    
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
                            'total_cost': (project.design_cost or 0) * quantity,
                            'notes': notes
                        }
                    )
                    if not created:
                        item.quantity += quantity
                        item.total_cost = item.unit_cost * item.quantity
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
                            'total_cost': (family.cost or 0) * quantity,
                            'notes': notes
                        }
                    )
                    if not created:
                        item.quantity += quantity
                        item.total_cost = item.unit_cost * item.quantity
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
    def take_in_work(self, request, pk=None):
        """Взять заказ в работу"""
        order = self.get_object()
        user = request.user
        
        # Добавляем отладочную информацию
        print(f"DEBUG take_in_work - User: {user.email}")
        print(f"DEBUG take_in_work - User type: {getattr(user, 'user_type', 'None')}")
        print(f"DEBUG take_in_work - User role: {getattr(user, 'user_role', 'None')}")
        print(f"DEBUG take_in_work - Has specialist_profile: {hasattr(user, 'specialist_profile')}")
        
        if hasattr(user, 'specialist_profile'):
            print(f"DEBUG take_in_work - Specialist type: {user.specialist_profile.specialist_type}")
            print(f"DEBUG take_in_work - Specialization: {user.specialist_profile.specialization}")
        else:
            print("DEBUG take_in_work - No specialist profile found!")
        
        # Проверяем, что пользователь является BIM-менеджером
        if not hasattr(request.user, 'specialist_profile') or request.user.specialist_profile.specialist_type != 'manager':
            print(f"DEBUG take_in_work - PERMISSION DENIED: User is not a BIM manager")
            return Response(
                {'detail': 'Только BIM-менеджеры могут брать заказы в работу'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем, что заказ в статусе "черновик"
        if order.order_status != 'draft':
            return Response(
                {'detail': 'Можно брать в работу только заказы в статусе "Черновик"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Назначаем BIM-менеджера и меняем статус
        order.assigned_manager = request.user
        order.order_status = 'in_progress'
        order.save()
        
        return Response({
            'detail': 'Заказ взят в работу',
            'order_status': order.order_status,
            'assigned_manager': request.user.get_full_name()
        })

    @action(detail=True, methods=['post'])
    def send_to_customer(self, request, pk=None):
        """Отправить файлы заказчику"""
        order = self.get_object()
        
        # Проверяем, что пользователь является назначенным BIM-менеджером
        if not hasattr(request.user, 'specialist_profile') or request.user.specialist_profile.specialist_type != 'manager':
            return Response(
                {'detail': 'Только BIM-менеджеры могут отправлять файлы'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if order.assigned_manager != request.user:
            return Response(
                {'detail': 'Только назначенный BIM-менеджер может отправлять файлы'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем, что заказ в статусе "в работе"
        if order.order_status != 'in_progress':
            return Response(
                {'detail': 'Можно отправлять файлы только для заказов в статусе "В работе"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Меняем статус на "на согласовании"
        order.order_status = 'review'
        order.save()
        
        # Здесь можно добавить логику для сохранения файлов
        # files = request.data.get('files', [])
        
        return Response({
            'detail': 'Файлы отправлены заказчику',
            'order_status': order.order_status
        })
    
    @action(detail=True, methods=['post'])
    def assign_manager(self, request, pk=None):
        """Назначить BIM-менеджера для заказа"""
        order = self.get_object()
        manager_id = request.data.get('manager_id')
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            manager = User.objects.get(id=manager_id)
            if hasattr(manager, 'specialist_profile') and manager.specialist_profile.specialist_type == 'manager':
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

    @action(detail=True, methods=['post'])
    def upload_file(self, request, pk=None):
        """Загрузить файл для заказа"""
        order = self.get_object()
        file_obj = request.FILES.get('file')
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        file_type = request.data.get('file_type', 'other')
        
        if not file_obj:
            return Response(
                {'detail': 'Файл не предоставлен'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not title:
            return Response(
                {'detail': 'Название файла обязательно'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, что пользователь является BIM-менеджером
        if not hasattr(request.user, 'specialist_profile') or request.user.specialist_profile.specialist_type != 'manager':
            return Response(
                {'detail': 'Только BIM-менеджеры могут загружать файлы'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем, что заказ назначен этому менеджеру
        if order.assigned_manager != request.user:
            return Response(
                {'detail': 'Только назначенный BIM-менеджер может загружать файлы'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Создаем файл заказа
        order_file = OrderFile.objects.create(
            order=order,
            file=file_obj,
            title=title,
            description=description,
            file_type=file_type,
            uploaded_by=request.user
        )
        
        # Обновляем статус заказа на "на согласовании"
        if order.order_status == 'in_progress':
            order.order_status = 'review'
            order.save()
        
        serializer = OrderFileSerializer(order_file)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Добавить комментарий к заказу"""
        order = self.get_object()
        comment_text = request.data.get('comment', '').strip()
        
        if not comment_text:
            return Response(
                {'detail': 'Комментарий не может быть пустым'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем права доступа
        user = request.user
        is_manager = False
        if hasattr(user, 'specialist_profile'):
            is_manager = user.specialist_profile.specialist_type == 'manager'
        
        # Только заказчик или BIM-менеджер могут добавлять комментарии
        if not is_manager and order.customer != user:
            return Response(
                {'detail': 'Нет прав для добавления комментариев к этому заказу'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Сохраняем комментарий в зависимости от роли пользователя
        if is_manager:
            order.manager_comment = comment_text
            order.manager_comment_date = timezone.now()
        else:
            order.customer_comment = comment_text
            order.comment_date = timezone.now()
        
        order.save()
        
        return Response({
            'detail': 'Комментарий добавлен',
            'comment': comment_text,
            'comment_date': order.comment_date if not is_manager else order.manager_comment_date
        })

    @action(detail=True, methods=['post'])
    def confirm_sketch(self, request, pk=None):
        """Подтвердить эскиз заказчиком"""
        order = self.get_object()
        
        # Проверяем, что пользователь является заказчиком
        if order.customer != request.user:
            return Response(
                {'detail': 'Только заказчик может подтверждать эскиз'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем, что заказ в статусе "на согласовании"
        if order.order_status != 'review':
            return Response(
                {'detail': 'Эскиз можно подтверждать только для заказов на согласовании'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Меняем статус на "в работе" (BIM-менеджер продолжает работу)
        order.order_status = 'in_progress'
        order.save()
        
        return Response({
            'detail': 'Эскиз подтвержден',
            'order_status': order.order_status
        })

    @action(detail=True, methods=['post'])
    def complete_order(self, request, pk=None):
        """Завершить заказ заказчиком"""
        order = self.get_object()
        
        # Проверяем, что пользователь является заказчиком
        if order.customer != request.user:
            return Response(
                {'detail': 'Только заказчик может завершать заказ'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем, что заказ в статусе "в работе"
        if order.order_status != 'in_progress':
            return Response(
                {'detail': 'Заказ можно завершать только в статусе "В работе"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Меняем статус на "завершен"
        order.order_status = 'completed'
        order.save()
        
        return Response({
            'detail': 'Заказ завершен',
            'order_status': order.order_status
        })

    @action(detail=True, methods=['get'])
    def files(self, request, pk=None):
        """Получить файлы заказа"""
        order = self.get_object()
        
        # Проверяем права доступа
        user = request.user
        is_manager = False
        if hasattr(user, 'specialist_profile'):
            is_manager = user.specialist_profile.specialist_type == 'manager'
        
        # Только заказчик или BIM-менеджер могут видеть файлы
        if not is_manager and order.customer != user:
            return Response(
                {'detail': 'Нет прав для просмотра файлов этого заказа'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Получаем файлы заказа
        files = OrderFile.objects.filter(order=order)
        serializer = OrderFileSerializer(files, many=True, context={'request': request})
        
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def process_payment(self, request, pk=None):
        """Обработка оплаты заказа"""
        order = self.get_object()
        
        # Проверяем, что пользователь является заказчиком
        if order.customer != request.user:
            return Response(
                {'detail': 'Только заказчик может оплачивать заказ'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем, что заказ в статусе "отправлен" или "в работе"
        if order.order_status not in ['submitted', 'in_progress']:
            return Response(
                {'detail': 'Заказ можно оплачивать только в статусе "Отправлен" или "В работе"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment_method = request.data.get('payment_method', 'card')
        
        # Здесь должна быть логика обработки платежа
        # Для демонстрации просто меняем статус оплаты
        order.payment_status = 'paid'
        order.save()
        
        return Response({
            'detail': 'Оплата прошла успешно',
            'payment_status': order.payment_status,
            'order_status': order.order_status
        })


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


class OrderFileViewSet(viewsets.ModelViewSet):
    """API для файлов заказов"""
    queryset = OrderFile.objects.all()
    serializer_class = OrderFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Проверяем, является ли пользователь BIM-менеджером
        is_manager = False
        if hasattr(user, 'specialist_profile'):
            is_manager = user.specialist_profile.specialist_type == 'manager'
        
        if is_manager:
            # BIM-менеджер видит все файлы
            return OrderFile.objects.all()
        else:
            # Клиент видит только файлы своих заказов
            return OrderFile.objects.filter(order__customer=user)
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def upload_file(self, request, pk=None):
        """Загрузить файл для заказа"""
        order = Order.objects.get(id=pk)
        
        # Проверяем права доступа
        user = request.user
        is_manager = False
        if hasattr(user, 'specialist_profile'):
            is_manager = user.specialist_profile.specialist_type == 'manager'
        
        if not is_manager and order.customer != user:
            return Response(
                {'detail': 'Нет прав для загрузки файлов в этот заказ'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Создаем файл
        file_data = request.data
        file_data['order'] = order.id
        file_data['uploaded_by'] = user.id
        
        serializer = self.get_serializer(data=file_data)
        if serializer.is_valid():
            serializer.save()
            
            # Если файл загружает BIM-менеджер, меняем статус заказа на "На согласовании"
            if is_manager and order.order_status == 'in_progress':
                order.order_status = 'review'
                order.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderFileCommentViewSet(viewsets.ModelViewSet):
    """API для комментариев к файлам заказов"""
    queryset = OrderFileComment.objects.all()
    serializer_class = OrderFileCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Проверяем, является ли пользователь BIM-менеджером
        is_manager = False
        if hasattr(user, 'specialist_profile'):
            is_manager = user.specialist_profile.specialist_type == 'manager'
        
        if is_manager:
            # BIM-менеджер видит все комментарии
            return OrderFileComment.objects.all()
        else:
            # Клиент видит только комментарии к файлам своих заказов
            return OrderFileComment.objects.filter(order_file__order__customer=user)
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)