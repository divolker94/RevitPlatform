from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

User = get_user_model()

class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('submitted', 'Отправлен'),
        ('in_progress', 'В работе'),
        ('review', 'На согласовании'),
        ('completed', 'Завершен'),
        ('cancelled', 'Отменен'),
    ]
    
    WORK_TYPE_CHOICES = [
        ('new_construction', 'Новое строительство'),
        ('reconstruction', 'Реконструкция'),
        ('capital_repair', 'Капитальный ремонт'),
        ('cramped_conditions', 'Стесненные условия'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Ожидает оплаты'),
        ('partial', 'Частично оплачен'),
        ('paid', 'Оплачен'),
        ('refunded', 'Возвращен'),
    ]
    
    # Основная информация
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_orders', null=True, blank=True)
    order_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    title = models.CharField(max_length=200, default='Без названия')
    description = models.TextField(blank=True)
    requirements = models.TextField(blank=True)
    
    # Статусы
    order_status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='draft')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # Тип работ и условия
    work_type = models.CharField(max_length=20, choices=WORK_TYPE_CHOICES, default='new_construction')
    customer_area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Стоимость
    base_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    work_type_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)
    area_adjustment = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)
    final_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Платежи
    advance_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    final_payment_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Временные метки
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # BIM-менеджер
    assigned_manager = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='managed_orders'
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Заказ {self.order_number}: {self.title}"
    
    def calculate_final_cost(self):
        """Расчет финальной стоимости с учетом всех коэффициентов"""
        # Базовый расчет
        cost = self.base_cost
        
        # Применяем коэффициент типа работ
        cost *= self.work_type_multiplier
        
        # Применяем корректировку по площади
        cost *= self.area_adjustment
        
        # Добавляем стоимость выбранных BIM-семейств
        family_cost = sum(item.total_cost for item in self.order_families.all())
        cost += family_cost
        
        self.final_cost = cost
        return cost
    
    def get_advance_amount(self):
        """Сумма аванса (50%)"""
        return self.final_cost * Decimal('0.5')
    
    def get_remaining_amount(self):
        """Оставшаяся сумма к оплате"""
        return self.final_cost - self.advance_paid

class OrderItem(models.Model):
    """Элементы заказа - архитектурные проекты или BIM-семейства"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items')
    
    # Ссылка на проект или семейство
    architectural_project = models.ForeignKey(
        'architectural_projects.ArchitecturalProject', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    bim_family = models.ForeignKey(
        'bim_families.BimFamily', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    
    # Информация об аналоге
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    base_cost = models.DecimalField(max_digits=12, decimal_places=2)
    sections_count = models.IntegerField(default=0)
    functional_class = models.CharField(max_length=100, blank=True)
    
    # Корректировки
    quantity = models.IntegerField(default=1)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Дополнительные параметры
    notes = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['order', 'architectural_project', 'bim_family']
    
    def __str__(self):
        if self.architectural_project:
            return f"Проект: {self.name}"
        return f"Семейство: {self.name}"
    
    def save(self, *args, **kwargs):
        if not self.total_cost:
            self.total_cost = self.unit_cost * self.quantity
        super().save(*args, **kwargs)

class OrderDocument(models.Model):
    """Документы заказа"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='orders/documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    document_type = models.CharField(max_length=50, default='source')
    
    def __str__(self):
        return f"{self.title} - {self.order.order_number}"

class OrderPayment(models.Model):
    """История платежей по заказу"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_type = models.CharField(max_length=20, choices=[
        ('advance', 'Аванс'),
        ('final', 'Финальная оплата'),
        ('refund', 'Возврат'),
    ])
    transaction_id = models.CharField(max_length=100, blank=True)
    payment_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Ожидает'),
        ('completed', 'Завершен'),
        ('failed', 'Неудачен'),
    ], default='pending')
    
    def __str__(self):
        return f"Платеж {self.amount} для заказа {self.order.order_number}"

class BIMFamilyCategory(models.Model):
    """Категории для BIM-семейств"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # Иконка для UI
    
    class Meta:
        verbose_name_plural = "BIM Family Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name