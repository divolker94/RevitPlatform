from django.contrib import admin
from .models import Order, OrderItem, OrderDocument, OrderPayment, BIMFamilyCategory, OrderFile

@admin.register(BIMFamilyCategory)
class BIMFamilyCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'description']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'title', 'customer', 'order_status', 'payment_status', 'work_type', 'final_cost', 'created_at']
    list_filter = ['order_status', 'payment_status', 'work_type', 'created_at']
    search_fields = ['order_number', 'title', 'customer__email', 'customer__first_name', 'customer__last_name']
    readonly_fields = ['order_number', 'created_at', 'updated_at', 'submitted_at', 'completed_at']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('order_number', 'title', 'description', 'requirements')
        }),
        ('Заказчик и менеджер', {
            'fields': ('customer', 'assigned_manager')
        }),
        ('Тип работ и площадь', {
            'fields': ('work_type', 'customer_area')
        }),
        ('Статусы', {
            'fields': ('order_status', 'payment_status')
        }),
        ('Стоимость', {
            'fields': ('base_cost', 'work_type_multiplier', 'area_adjustment', 'final_cost')
        }),
        ('Платежи', {
            'fields': ('advance_paid', 'final_payment_paid')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at', 'submitted_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'name', 'category', 'quantity', 'unit_cost', 'total_cost']
    list_filter = ['category', 'order__order_status']
    search_fields = ['name', 'order__order_number']

@admin.register(OrderDocument)
class OrderDocumentAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'title', 'document_type', 'uploaded_at']
    list_filter = ['document_type', 'uploaded_at']
    search_fields = ['title', 'order__order_number']

@admin.register(OrderPayment)
class OrderPaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'amount', 'payment_type', 'status', 'created_at']
    list_filter = ['payment_type', 'status', 'created_at']
    search_fields = ['order__order_number', 'transaction_id']

@admin.register(OrderFile)
class OrderFileAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'title', 'file_type', 'uploaded_by', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']
    search_fields = ['title', 'order__order_number', 'uploaded_by__email']
    readonly_fields = ['uploaded_at']
