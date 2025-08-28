from django.contrib import admin
from .models import SpecialistProfile, ManagerProfile

@admin.register(SpecialistProfile)
class SpecialistProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialization', 'experience', 'hourly_rate', 'is_profile_complete', 'created_at')
    list_filter = ('is_profile_complete', 'created_at', 'updated_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'specialization')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Пользователь', {'fields': ('user',)}),
        ('Профессиональная информация', {'fields': ('specialization', 'experience')}),
        ('Условия работы', {'fields': ('availability', 'hourly_rate')}),
        ('Дополнительная информация', {'fields': ('about', 'portfolio', 'certificates')}),
        ('Статус', {'fields': ('is_profile_complete',)}),
        ('Метаданные', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

@admin.register(ManagerProfile)
class ManagerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'position', 'is_profile_complete', 'created_at')
    list_filter = ('is_profile_complete', 'created_at', 'updated_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'department', 'position')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Пользователь', {'fields': ('user',)}),
        ('Информация о менеджере', {'fields': ('department', 'position', 'responsibilities')}),
        ('Статус', {'fields': ('is_profile_complete',)}),
        ('Метаданные', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
