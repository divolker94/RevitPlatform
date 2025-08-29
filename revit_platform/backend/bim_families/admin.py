from django.contrib import admin
from .models import BimFamily, FamilyImage, FamilyView

@admin.register(FamilyImage)
class FamilyImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'family', 'image', 'uploaded_at']
    search_fields = ['family__name']
    list_filter = ['uploaded_at']

@admin.register(FamilyView)
class FamilyViewAdmin(admin.ModelAdmin):
    list_display = ['id', 'family', 'user', 'ip_address', 'viewed_at']
    list_filter = ['viewed_at', 'family']
    search_fields = ['family__name', 'ip_address']

@admin.register(BimFamily)
class BimFamilyAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'category', 'family_type', 'manufacturer', 'cost', 'views_count', 'downloads_count', 'rating', 'created_at']
    list_filter = ['category', 'family_type', 'manufacturer', 'created_at']
    search_fields = ['name', 'description', 'manufacturer']
    readonly_fields = ['views_count', 'downloads_count', 'rating', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'description', 'category', 'family_type', 'manufacturer')
        }),
        ('Стоимость и рейтинг', {
            'fields': ('cost', 'rating')
        }),
        ('Статистика', {
            'fields': ('views_count', 'downloads_count'),
            'classes': ('collapse',)
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
