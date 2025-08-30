#!/usr/bin/env python
import os
import sys
import django

# Добавляем путь к проекту
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revit_platform.settings')
django.setup()

from specialists.models import SpecialistProfile

def fix_specializations():
    """Исправляем специализации для существующих профилей"""
    
    # Находим профили с невалидной специализацией
    invalid_profiles = SpecialistProfile.objects.filter(specialization='Не указано')
    
    print(f"Найдено {invalid_profiles.count()} профилей с невалидной специализацией")
    
    for profile in invalid_profiles:
        # Устанавливаем специализацию в зависимости от типа специалиста
        if profile.specialist_type == 'manager':
            profile.specialization = 'BIM management'
        else:
            profile.specialization = 'architectural design'
        
        profile.save()
        print(f"Исправлен профиль {profile.id}: {profile.user.email} -> {profile.specialization}")
    
    print("Исправление завершено!")

if __name__ == '__main__':
    fix_specializations()
