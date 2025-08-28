from django.contrib import admin
from .models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['project_name', 'user', 'reference_project', 'budget', 'calculated_budget', 'percentage_change', 'deadline', 'status', 'created_at']
    list_filter = ['status', 'created_at', 'deadline', 'reference_project']
    search_fields = ['project_name', 'user__username', 'description', 'reference_project__name']
    readonly_fields = ['created_at', 'updated_at', 'calculated_budget']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'reference_project', 'project_name', 'description')
        }),
        ('Финансы и сроки', {
            'fields': ('budget', 'percentage_change', 'calculated_budget', 'deadline')
        }),
        ('Статус', {
            'fields': ('status',)
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
