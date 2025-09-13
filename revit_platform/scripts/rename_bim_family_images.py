#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для переименования изображений в папках BIM-семейств
Переименовывает изображения в формат: image_1_0, image_2_1, image_3_2 и т.д.
"""

import os
import shutil
from pathlib import Path
import re

def rename_images_in_bim_families():
    """
    Переименовывает изображения в папках BIM-семейств
    """
    # Путь к папке с изображениями BIM-семейств
    base_path = r"D:\Cursor\4\revit_platform\frontend\public\images\bim_families"
    
    # Поддерживаемые форматы изображений
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp'}
    
    print(f"🔍 Начинаю обработку папки: {base_path}")
    
    if not os.path.exists(base_path):
        print(f"❌ Ошибка: Папка {base_path} не существует!")
        return
    
    # Получаем список папок (00001, 00002, etc.)
    try:
        folders = [f for f in os.listdir(base_path) 
                  if os.path.isdir(os.path.join(base_path, f)) 
                  and re.match(r'^\d{5}$', f)]
        folders.sort()
    except Exception as e:
        print(f"❌ Ошибка при чтении папки: {e}")
        return
    
    print(f"📁 Найдено папок: {len(folders)}")
    
    total_renamed = 0
    total_errors = 0
    
    for folder in folders:
        folder_path = os.path.join(base_path, folder)
        print(f"\n📂 Обрабатываю папку: {folder}")
        
        try:
            # Получаем список файлов изображений в папке
            image_files = []
            for file in os.listdir(folder_path):
                file_path = os.path.join(folder_path, file)
                if os.path.isfile(file_path):
                    file_ext = Path(file).suffix.lower()
                    if file_ext in image_extensions:
                        image_files.append(file)
            
            if not image_files:
                print(f"   ⚠️  В папке {folder} нет изображений")
                continue
            
            print(f"   🖼️  Найдено изображений: {len(image_files)}")
            
            # Сначала определяем существующие файлы с правильным форматом image_X_Y
            existing_formatted_files = []
            files_to_rename = []
            
            for file in image_files:
                if re.match(r'^image_\d+_\d+\.[a-zA-Z]+$', file):
                    existing_formatted_files.append(file)
                else:
                    files_to_rename.append(file)
            
            # Сортируем существующие файлы по номеру для определения следующего доступного номера
            existing_formatted_files.sort(key=lambda x: int(re.match(r'^image_(\d+)_\d+\.[a-zA-Z]+$', x).group(1)))
            
            print(f"   ✅ Файлы с правильным форматом: {len(existing_formatted_files)}")
            print(f"   📝 Файлы для переименования: {len(files_to_rename)}")
            
            # Определяем следующий доступный номер
            next_number = 1
            if existing_formatted_files:
                last_number = int(re.match(r'^image_(\d+)_\d+\.[a-zA-Z]+$', existing_formatted_files[-1]).group(1))
                next_number = last_number + 1
            
            # Переименовываем файлы, которые не имеют правильного формата
            for old_name in files_to_rename:
                old_path = os.path.join(folder_path, old_name)
                
                # Получаем расширение файла
                file_ext = Path(old_name).suffix.lower()
                
                # Новое имя в формате image_X_Y
                new_name = f"image_{next_number}_{next_number-1}{file_ext}"
                new_path = os.path.join(folder_path, new_name)
                
                # Проверяем, не существует ли уже файл с таким именем
                if os.path.exists(new_path) and old_path != new_path:
                    print(f"   ⚠️  Файл {new_name} уже существует, пропускаю {old_name}")
                    continue
                
                try:
                    # Переименовываем файл
                    os.rename(old_path, new_path)
                    print(f"   ✅ {old_name} → {new_name}")
                    total_renamed += 1
                    next_number += 1
                    
                except Exception as e:
                    print(f"   ❌ Ошибка при переименовании {old_name}: {e}")
                    total_errors += 1
                    
        except Exception as e:
            print(f"   ❌ Ошибка при обработке папки {folder}: {e}")
            total_errors += 1
    
    print(f"\n🎯 Обработка завершена!")
    print(f"✅ Успешно переименовано: {total_renamed} файлов")
    print(f"❌ Ошибок: {total_errors}")
    
    if total_renamed > 0:
        print(f"\n📋 Формат переименования:")
        print(f"   image_1_0.{', '.join(image_extensions)}")
        print(f"   image_2_1.{', '.join(image_extensions)}")
        print(f"   image_3_2.{', '.join(image_extensions)}")
        print(f"   ...")

def preview_rename():
    """
    Предварительный просмотр изменений без их выполнения
    """
    base_path = r"D:\Cursor\4\revit_platform\frontend\public\images\bim_families"
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp'}
    
    print(f"🔍 Предварительный просмотр изменений в: {base_path}")
    
    if not os.path.exists(base_path):
        print(f"❌ Ошибка: Папка {base_path} не существует!")
        return
    
    try:
        folders = [f for f in os.listdir(base_path) 
                  if os.path.isdir(os.path.join(base_path, f)) 
                  and re.match(r'^\d{5}$', f)]
        folders.sort()
    except Exception as e:
        print(f"❌ Ошибка при чтении папки: {e}")
        return
    
    print(f"📁 Найдено папок: {len(folders)}")
    
    total_files = 0
    
    for folder in folders[:5]:  # Показываем только первые 5 папок для примера
        folder_path = os.path.join(base_path, folder)
        print(f"\n📂 Папка: {folder}")
        
        try:
            image_files = []
            for file in os.listdir(folder_path):
                file_path = os.path.join(folder_path, file)
                if os.path.isfile(file_path):
                    file_ext = Path(file).suffix.lower()
                    if file_ext in image_extensions:
                        image_files.append(file)
            
            if not image_files:
                print(f"   ⚠️  Нет изображений")
                continue
            
            image_files.sort()
            print(f"   🖼️  Изображений: {len(image_files)}")
            
            # Показываем первые 3 файла как пример
            for index, old_name in enumerate(image_files[:3], 1):
                file_ext = Path(old_name).suffix.lower()
                # Проверяем, имеет ли файл уже правильный формат
                if re.match(r'^image_\d+_\d+\.[a-zA-Z]+$', old_name):
                    print(f"   ✅ {old_name} - уже правильный формат")
                else:
                    new_name = f"image_{index}_{index-1}{file_ext}"
                    print(f"   📝 {old_name} → {new_name}")
            
            if len(image_files) > 3:
                print(f"   ... и еще {len(image_files) - 3} файлов")
            
            total_files += len(image_files)
            
        except Exception as e:
            print(f"   ❌ Ошибка: {e}")
    
    if len(folders) > 5:
        print(f"\n... и еще {len(folders) - 5} папок")
    
    print(f"\n📊 Всего изображений для переименования: {total_files}")

if __name__ == "__main__":
    print("🚀 Скрипт переименования изображений BIM-семейств")
    print("=" * 60)
    
    while True:
        print("\nВыберите действие:")
        print("1. Предварительный просмотр изменений")
        print("2. Выполнить переименование")
        print("3. Выход")
        
        choice = input("\nВведите номер (1-3): ").strip()
        
        if choice == "1":
            preview_rename()
        elif choice == "2":
            confirm = input("\n⚠️  Вы уверены, что хотите выполнить переименование? (да/нет): ").strip().lower()
            if confirm in ['да', 'yes', 'y', 'д']:
                rename_images_in_bim_families()
            else:
                print("❌ Переименование отменено")
        elif choice == "3":
            print("👋 До свидания!")
            break
        else:
            print("❌ Неверный выбор. Попробуйте снова.")
