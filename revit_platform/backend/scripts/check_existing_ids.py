#!/usr/bin/env python
"""
Скрипт для проверки существующих ID в базе данных BIM семейств
"""

import os
import sys
import django

# Добавляем путь к проекту
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from bim_families.models import BimFamily, FamilyImage

def check_existing_ids():
    print("🔍 ПРОВЕРКА СУЩЕСТВУЮЩИХ ID В БАЗЕ ДАННЫХ")
    print("=" * 50)
    
    # Получаем все семейства из базы
    families = BimFamily.objects.all().order_by('id')
    print(f"📊 Найдено семейств в базе: {families.count()}")
    
    print("\n📋 СУЩЕСТВУЮЩИЕ ID:")
    for family in families:
        print(f"   ID: {family.id:2d} | External ID: {family.external_id} | Название: {family.name[:50]}...")
    
    # Проверим, есть ли изображения
    print(f"\n🖼️  ИЗОБРАЖЕНИЯ:")
    total_images = FamilyImage.objects.count()
    print(f"   Всего изображений: {total_images}")
    
    if total_images > 0:
        print(f"   Первые 5 изображений:")
        for img in FamilyImage.objects.all()[:5]:
            print(f"      ID: {img.id} | Family ID: {img.family_id} | Path: {img.local_path[:50]}...")

if __name__ == "__main__":
    try:
        check_existing_ids()
    except Exception as e:
        print(f"❌ Ошибка при выполнении скрипта: {e}")
        import traceback
        traceback.print_exc()
