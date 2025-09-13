from rest_framework import serializers
from .models import Order, OrderItem, OrderDocument, OrderPayment, BIMFamilyCategory, OrderFile, OrderFileComment
from architectural_projects.models import ArchitecturalProject
from bim_families.models import BimFamily

class BIMFamilyCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BIMFamilyCategory
        fields = '__all__'

class OrderFileCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    
    class Meta:
        model = OrderFileComment
        fields = '__all__'
        read_only_fields = ('author', 'created_at')

class OrderFileSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    filename = serializers.CharField(read_only=True)
    comments = OrderFileCommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = OrderFile
        fields = '__all__'
        read_only_fields = ('uploaded_by', 'uploaded_at')

class OrderItemSerializer(serializers.ModelSerializer):
    architectural_project_name = serializers.CharField(source='architectural_project.name', read_only=True)
    bim_family_name = serializers.CharField(source='bim_family.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = '__all__'
        read_only_fields = ('total_cost',)

class OrderDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderDocument
        fields = '__all__'

class OrderPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderPayment
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True, source='order_items')
    documents = OrderDocumentSerializer(many=True, read_only=True)
    payments = OrderPaymentSerializer(many=True, read_only=True)
    files = OrderFileSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    manager_name = serializers.CharField(source='assigned_manager.get_full_name', read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('order_number', 'final_cost', 'advance_paid', 'final_payment_paid')
    
    def to_representation(self, instance):
        """Автоматически рассчитываем стоимость при сериализации"""
        # Рассчитываем стоимость, если она не установлена
        if not instance.final_cost:
            instance.calculate_final_cost()
            instance.save()
        
        return super().to_representation(instance)

class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False)
    
    class Meta:
        model = Order
        fields = ['id', 'title', 'description', 'requirements', 'work_type', 'customer_area', 'items']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)
        
        # Создаем элементы заказа
        for item_data in items_data:
            # Если это архитектурный проект, получаем его стоимость
            if item_data.get('architectural_project'):
                project = ArchitecturalProject.objects.get(id=item_data['architectural_project'])
                item_data['base_cost'] = project.design_cost
                item_data['unit_cost'] = project.design_cost
                item_data['total_cost'] = project.design_cost * item_data.get('quantity', 1)
            # Если это BIM-семейство, получаем его стоимость
            elif item_data.get('bim_family'):
                family = BimFamily.objects.get(id=item_data['bim_family'])
                item_data['base_cost'] = family.base_cost
                item_data['unit_cost'] = family.base_cost
                item_data['total_cost'] = family.base_cost * item_data.get('quantity', 1)
            
            OrderItem.objects.create(order=order, **item_data)
        
        # Рассчитываем стоимость
        order.calculate_final_cost()
        order.save()
        
        return order

class AddToOrderSerializer(serializers.Serializer):
    item_type = serializers.ChoiceField(choices=['architectural_project', 'bim_family'])
    item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(default=1)
    notes = serializers.CharField(required=False, allow_blank=True)

class OrderCalculationSerializer(serializers.Serializer):
    """Сериализатор для расчета стоимости заказа"""
    base_cost = serializers.DecimalField(max_digits=12, decimal_places=2)
    work_type_multiplier = serializers.DecimalField(max_digits=4, decimal_places=2)
    area_adjustment = serializers.DecimalField(max_digits=4, decimal_places=2)
    family_items_cost = serializers.DecimalField(max_digits=12, decimal_places=2)
    final_cost = serializers.DecimalField(max_digits=12, decimal_places=2)
    advance_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    remaining_amount = serializers.DecimalField(max_digits=12, decimal_places=2)