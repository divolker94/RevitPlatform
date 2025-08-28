#!/usr/bin/env python
"""
Скрипт для диагностики проблемы с изображениями BIM семейств
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

def debug_images():
    print("🔍 ДИАГНОСТИКА ИЗОБРАЖЕНИЙ BIM СЕМЕЙСТВ")
    print("=" * 50)
    
    # Проверим количество семейств
    families_count = BimFamily.objects.count()
    print(f"📊 Всего семейств в базе: {families_count}")
    
    # Проверим количество изображений
    images_count = FamilyImage.objects.count()
    print(f"🖼️  Всего изображений в базе: {images_count}")
    
    if families_count == 0:
        print("❌ Нет семейств в базе данных!")
        return
    
    if images_count == 0:
        print("❌ Нет изображений в базе данных!")
        return
    
    print("\n📋 ПЕРВОЕ СЕМЕЙСТВО:")
    first_family = BimFamily.objects.first()
    print(f"   Название: {first_family.name}")
    print(f"   External ID: {first_family.external_id}")
    print(f"   Total images: {first_family.total_images}")
    print(f"   URL: {first_family.url}")
    
    # Проверим изображения для первого семейства
    images = first_family.images.all()
    print(f"   Изображений в базе: {images.count()}")
    
    if images.exists():
        first_image = images.first()
        print(f"\n   🖼️  Первое изображение:")
        print(f"      ID: {first_image.id}")
        print(f"      local_path: {first_image.local_path}")
        print(f"      local_filename: {first_image.local_filename}")
        print(f"      alt_text: {first_image.alt_text}")
        print(f"      title: {first_image.title}")
        print(f"      image_type: {first_image.image_type}")
        print(f"      dimensions: {first_image.width}x{first_image.height}")
        print(f"      file_size: {first_image.file_size} bytes")
    
    print("\n🔍 ПЕРВЫЕ 10 ИЗОБРАЖЕНИЙ:")
    for i, img in enumerate(FamilyImage.objects.all()[:10]):
        print(f"   {i+1}. ID: {img.id}")
        print(f"      Семейство: {img.family.name}")
        print(f"      local_path: {img.local_path}")
        print(f"      local_filename: {img.local_filename}")
        print(f"      ---")
    
    # Проверим существование папок
    print("\n📁 ПРОВЕРКА ПАПОК:")
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend')
    images_path = os.path.join(frontend_path, 'public', 'images')
    bim_families_path = os.path.join(images_path, 'bim_families')
    
    print(f"   Путь к frontend: {frontend_path}")
    print(f"   Путь к images: {images_path}")
    print(f"   Путь к bim_families: {bim_families_path}")
    
    if os.path.exists(frontend_path):
        print(f"   ✅ Frontend папка существует")
    else:
        print(f"   ❌ Frontend папка НЕ существует")
    
    if os.path.exists(images_path):
        print(f"   ✅ Images папка существует")
    else:
        print(f"   ❌ Images папка НЕ существует")
    
    if os.path.exists(bim_families_path):
        print(f"   ✅ BIM families папка существует")
        
        # Посмотрим содержимое папки
        try:
            contents = os.listdir(bim_families_path)
            print(f"   📂 Содержимое папки ({len(contents)} элементов):")
            for item in contents[:10]:  # Показываем первые 10
                item_path = os.path.join(bim_families_path, item)
                if os.path.isdir(item_path):
                    sub_contents = os.listdir(item_path)
                    print(f"      📁 {item}/ ({len(sub_contents)} файлов)")
                    for sub_item in sub_contents[:5]:  # Показываем первые 5 файлов
                        print(f"         📄 {sub_item}")
                else:
                    print(f"      📄 {item}")
        except Exception as e:
            print(f"   ❌ Ошибка при чтении папки: {e}")
    else:
        print(f"   ❌ BIM families папка НЕ существует")
    
    # Проверим несколько конкретных путей
    print("\n🔍 ПРОВЕРКА КОНКРЕТНЫХ ПУТЕЙ:")
    if images.exists():
        first_image = images.first()
        family_folder = first_family.external_id or first_family.name.replace(' ', '_').replace('/', '_')
        expected_path = os.path.join(bim_families_path, family_folder, first_image.local_filename)
        
        print(f"   Ожидаемый путь: {expected_path}")
        if os.path.exists(expected_path):
            print(f"   ✅ Файл существует!")
            file_size = os.path.getsize(expected_path)
            print(f"   📏 Размер файла: {file_size} bytes")
        else:
            print(f"   ❌ Файл НЕ существует!")
            
            # Проверим папку семейства
            family_folder_path = os.path.join(bim_families_path, family_folder)
            if os.path.exists(family_folder_path):
                print(f"   📁 Папка семейства существует: {family_folder_path}")
                try:
                    folder_contents = os.listdir(family_folder_path)
                    print(f"   📂 Содержимое папки ({len(folder_contents)} элементов):")
                    for item in folder_contents[:10]:
                        print(f"      📄 {item}")
                except Exception as e:
                    print(f"   ❌ Ошибка при чтении папки семейства: {e}")
            else:
                print(f"   ❌ Папка семейства НЕ существует: {family_folder_path}")
    
    print("\n" + "=" * 50)
    print("🏁 ДИАГНОСТИКА ЗАВЕРШЕНА")

if __name__ == "__main__":
    try:
        debug_images()
    except Exception as e:
        print(f"❌ Ошибка при выполнении скрипта: {e}")
        import traceback
        traceback.print_exc()
