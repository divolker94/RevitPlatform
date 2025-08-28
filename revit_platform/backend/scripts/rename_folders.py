#!/usr/bin/env python
"""
Скрипт для переименования папок BIM семейств в простые 5-значные названия
"""

import os
import sys
import django
import shutil

# Добавляем путь к проекту
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from bim_families.models import BimFamily, FamilyImage

def rename_folders():
    print("🔄 ПЕРЕИМЕНОВАНИЕ ПАПОК BIM СЕМЕЙСТВ")
    print("=" * 50)
    
    # Путь к папке с изображениями
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend')
    images_path = os.path.join(frontend_path, 'public', 'images')
    bim_families_path = os.path.join(images_path, 'bim_families')
    
    print(f"📁 Путь к BIM families: {bim_families_path}")
    
    if not os.path.exists(bim_families_path):
        print("❌ Папка BIM families не существует!")
        return
    
    # Получаем все семейства из базы
    families = BimFamily.objects.all()
    print(f"📊 Найдено семейств в базе: {families.count()}")
    
    # Создаем словарь для сопоставления старых и новых названий
    folder_mapping = {}
    
    for i, family in enumerate(families, 1):
        # Создаем новое название папки: 5 цифр с ведущими нулями
        new_folder_name = f"{i:05d}"  # 00001, 00002, 00003, ...
        
        # Старое название папки (external_id или name)
        old_folder_name = family.external_id or family.name.replace(' ', '_').replace('/', '_').replace('\\', '_')
        
        folder_mapping[old_folder_name] = {
            'new_name': new_folder_name,
            'family': family,
            'old_path': os.path.join(bim_families_path, old_folder_name),
            'new_path': os.path.join(bim_families_path, new_folder_name)
        }
        
        print(f"   {i:2d}. {old_folder_name} → {new_folder_name}")
    
    print(f"\n🔄 Начинаем переименование...")
    
    # Переименовываем папки
    for old_name, info in folder_mapping.items():
        old_path = info['old_path']
        new_path = info['new_path']
        
        if os.path.exists(old_path):
            try:
                # Переименовываем папку
                shutil.move(old_path, new_path)
                print(f"   ✅ {old_name} → {info['new_name']}")
                
                # Обновляем записи в базе данных
                family = info['family']
                family.external_id = info['new_name']
                family.save()
                
                # Обновляем изображения
                images = family.images.all()
                for img in images:
                    # Обновляем local_path на новое название папки
                    if img.local_path and not img.local_path.startswith('http'):
                        # Если путь содержит старое название папки, заменяем его
                        if old_name in img.local_path:
                            new_local_path = img.local_path.replace(old_name, info['new_name'])
                            img.local_path = new_local_path
                            img.save()
                            print(f"      📄 Обновлен путь: {img.local_filename}")
                
            except Exception as e:
                print(f"   ❌ Ошибка при переименовании {old_name}: {e}")
        else:
            print(f"   ⚠️  Папка не существует: {old_name}")
    
    print(f"\n🏁 Переименование завершено!")
    print(f"📁 Новые папки:")
    
    # Показываем новые папки
    try:
        contents = os.listdir(bim_families_path)
        for item in sorted(contents):
            item_path = os.path.join(bim_families_path, item)
            if os.path.isdir(item_path):
                sub_contents = os.listdir(item_path)
                print(f"   📁 {item}/ ({len(sub_contents)} файлов)")
                for sub_item in sub_contents[:3]:  # Показываем первые 3 файла
                    print(f"      📄 {sub_item}")
                if len(sub_contents) > 3:
                    print(f"      ... и еще {len(sub_contents) - 3} файлов")
    except Exception as e:
        print(f"   ❌ Ошибка при чтении папок: {e}")

if __name__ == "__main__":
    try:
        rename_folders()
    except Exception as e:
        print(f"❌ Ошибка при выполнении скрипта: {e}")
        import traceback
        traceback.print_exc()
