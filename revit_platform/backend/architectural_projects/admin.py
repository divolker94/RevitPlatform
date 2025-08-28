from django.contrib import admin
from django.utils.html import format_html
from .models import ArchitecturalProject, ProjectRating, ProjectView

@admin.register(ProjectView)
class ProjectViewAdmin(admin.ModelAdmin):
    list_display = ['project', 'user', 'ip_address', 'viewed_at']
    list_filter = ['viewed_at']
    search_fields = ['project__name', 'user__email', 'ip_address']
    readonly_fields = ['viewed_at']
    date_hierarchy = 'viewed_at'

@admin.register(ArchitecturalProject)
class ArchitecturalProjectAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'total_area', 'design_cost', 
        'views_count', 'rating_average', 'rating_count', 'downloads'
    ]
    list_filter = ['category', 'functional_class', 'construction_system']
    search_fields = ['name', 'description']
    readonly_fields = ['views_count', 'rating_average', 'rating_count']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'category', 'description')
        }),
        ('Технические характеристики', {
            'fields': ('functional_class', 'construction_system', 'total_area', 
                      'building_volume', 'footprint_area', 'documentation', 
                      'design_duration', 'design_cost')
        }),
        ('Изображения', {
            'fields': ('image_main', 'image_plan', 'image_interior1', 'image_interior2'),
            'classes': ('collapse',)
        }),
        ('Статистика', {
            'fields': ('views_count', 'rating_average', 'rating_count', 
                      'downloads', 'user_comments'),
            'classes': ('collapse',)
        }),
    )

@admin.register(ProjectRating)
class ProjectRatingAdmin(admin.ModelAdmin):
    list_display = ['project', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['project__name', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Оценка', {
            'fields': ('project', 'user', 'rating')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
