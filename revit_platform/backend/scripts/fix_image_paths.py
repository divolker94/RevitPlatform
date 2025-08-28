#!/usr/bin/env python
"""
Скрипт для исправления путей изображений в базе данных BIM семейств
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

def fix_image_paths():
    print("🔧 ИСПРАВЛЕНИЕ ПУТЕЙ ИЗОБРАЖЕНИЙ В БАЗЕ ДАННЫХ")
    print("=" * 50)
    
    # Получаем все изображения
    images = FamilyImage.objects.all()
    print(f"📊 Найдено изображений: {images.count()}")
    
    fixed_count = 0
    error_count = 0
    
    for img in images:
        try:
            old_path = img.local_path
            family = img.family
            
            # Проверяем, есть ли у семейства правильный external_id
            if not family.external_id:
                print(f"   ⚠️  Семейство {family.id} не имеет external_id")
                continue
            
            # Создаем правильный путь
            # Извлекаем только имя файла из старого пути
            if '/' in old_path:
                filename = old_path.split('/')[-1]
            else:
                filename = old_path
            
            # Создаем новый путь в формате: images/bim_families/00001/filename.jpg
            new_path = f"images/bim_families/{family.external_id}/{filename}"
            
            if old_path != new_path:
                print(f"   🔄 ID {img.id}: {old_path[:50]}... → {new_path}")
                img.local_path = new_path
                img.save()
                fixed_count += 1
            else:
                print(f"   ✅ ID {img.id}: путь уже правильный")
                
        except Exception as e:
            print(f"   ❌ Ошибка при исправлении изображения {img.id}: {e}")
            error_count += 1
    
    print(f"\n🏁 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!")
    print(f"   ✅ Исправлено: {fixed_count}")
    print(f"   ❌ Ошибок: {error_count}")
    
    # Показываем несколько примеров исправленных путей
    print(f"\n📋 ПРИМЕРЫ ИСПРАВЛЕННЫХ ПУТЕЙ:")
    for img in FamilyImage.objects.all()[:10]:
        family = img.family
        print(f"   Семейство {family.external_id}: {img.local_path}")

if __name__ == "__main__":
    try:
        fix_image_paths()
    except Exception as e:
        print(f"❌ Ошибка при выполнении скрипта: {e}")
        import traceback
        traceback.print_exc()
