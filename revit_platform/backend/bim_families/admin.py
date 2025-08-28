from django.contrib import admin
from .models import BimFamily, FamilyImage, FamilyView

@admin.register(FamilyImage)
class FamilyImageAdmin(admin.ModelAdmin):
    list_display = ['family', 'local_path', 'image_type', 'created_at']
    list_filter = ['image_type', 'created_at']
    search_fields = ['family__name', 'local_path']
    readonly_fields = ['created_at']

@admin.register(FamilyView)
class FamilyViewAdmin(admin.ModelAdmin):
    list_display = ['family', 'user', 'ip_address', 'viewed_at']
    list_filter = ['viewed_at']
    search_fields = ['family__name', 'user__email', 'ip_address']
    readonly_fields = ['viewed_at']
    date_hierarchy = 'viewed_at'

@admin.register(BimFamily)
class BimFamilyAdmin(admin.ModelAdmin):
    list_display = ['name', 'external_id', 'parsing_method', 'total_images', 'created_at']
    list_filter = ['parsing_method', 'created_at']
    search_fields = ['name', 'description', 'external_id']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'external_id', 'url', 'description')
        }),
        ('Технические характеристики', {
            'fields': ('technical_specs', 'basic_specs', 'catalog_items')
        }),
        ('Дополнительная информация', {
            'fields': ('company_info', 'download_info', 'parsing_method', 'total_images', 'parsed_at')
        }),
        ('Системные поля', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
