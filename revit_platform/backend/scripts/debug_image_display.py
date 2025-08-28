#!/usr/bin/env python
"""
Скрипт для диагностики проблемы отображения изображений BIM семейств
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

def debug_image_display():
    print("🔍 ДИАГНОСТИКА ОТОБРАЖЕНИЯ ИЗОБРАЖЕНИЙ")
    print("=" * 50)
    
    # Получаем все семейства
    families = BimFamily.objects.all()
    print(f"📊 Всего семейств: {families.count()}")
    
    # Проверяем каждое семейство
    for i, family in enumerate(families[:10], 1):  # Первые 10 для примера
        print(f"\n🔍 СЕМЕЙСТВО {i}: {family.name[:50]}...")
        print(f"   ID: {family.id}")
        print(f"   External ID: {family.external_id}")
        print(f"   Total images: {family.total_images}")
        
        # Проверяем изображения
        images = family.images.all()
        print(f"   Изображений в базе: {images.count()}")
        
        if images.exists():
            first_image = images.first()
            print(f"   🖼️  Первое изображение:")
            print(f"      ID: {first_image.id}")
            print(f"      local_path: {first_image.local_path}")
            print(f"      local_filename: {first_image.local_filename}")
            
            # Проверяем, существует ли файл
            if first_image.local_path:
                # Создаем полный путь к файлу
                frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend')
                full_image_path = os.path.join(frontend_path, 'public', first_image.local_path)
                
                print(f"      Полный путь: {full_image_path}")
                
                if os.path.exists(full_image_path):
                    file_size = os.path.getsize(full_image_path)
                    print(f"      ✅ Файл существует, размер: {file_size} bytes")
                else:
                    print(f"      ❌ Файл НЕ существует!")
                    
                    # Проверим папку
                    folder_path = os.path.dirname(full_image_path)
                    if os.path.exists(folder_path):
                        print(f"      📁 Папка существует: {folder_path}")
                        try:
                            folder_contents = os.listdir(folder_path)
                            print(f"      📂 Содержимое папки ({len(folder_contents)} элементов):")
                            for item in folder_contents[:5]:
                                print(f"         📄 {item}")
                        except Exception as e:
                            print(f"      ❌ Ошибка при чтении папки: {e}")
                    else:
                        print(f"      ❌ Папка НЕ существует: {folder_path}")
        else:
            print(f"   ❌ Нет изображений в базе данных")
        
        print(f"   {'-' * 50}")
    
    # Проверим общую статистику
    print(f"\n📊 ОБЩАЯ СТАТИСТИКА:")
    total_images = FamilyImage.objects.count()
    print(f"   Всего изображений в базе: {total_images}")
    
    # Проверим изображения с пустыми путями
    empty_paths = FamilyImage.objects.filter(local_path__isnull=True).count()
    print(f"   Изображений с пустыми путями: {empty_paths}")
    
    # Проверим изображения с неправильными путями
    wrong_paths = FamilyImage.objects.filter(local_path__startswith='images/bim_families/').count()
    print(f"   Изображений с правильными путями: {wrong_paths}")
    
    # Проверим несколько примеров путей
    print(f"\n🔍 ПРИМЕРЫ ПУТЕЙ:")
    sample_images = FamilyImage.objects.all()[:5]
    for img in sample_images:
        print(f"   ID {img.id}: {img.local_path}")

if __name__ == "__main__":
    try:
        debug_image_display()
    except Exception as e:
        print(f"❌ Ошибка при выполнении скрипта: {e}")
        import traceback
        traceback.print_exc()
