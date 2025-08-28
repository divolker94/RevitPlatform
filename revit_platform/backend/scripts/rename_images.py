import os
from pathlib import Path
import shutil

# Абсолютный путь к папке static
STATIC_ROOT = r'D:\Cursor\1\revit_platform\backend\static'

def setup_image_directory(source_dir=STATIC_ROOT, target_dir=os.path.join(STATIC_ROOT, 'images')):
    # Создаем папку images, если её нет
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
        print(f"Создана директория {target_dir}")

    # Получаем список всех файлов в исходной директории
    files = [f for f in os.listdir(source_dir) if os.path.isfile(os.path.join(source_dir, f))]
    
    # Фильтруем только изображения
    image_extensions = ('.png', '.jpg', '.jpeg', '.gif')
    image_files = [f for f in files if f.lower().endswith(image_extensions)]
    
    print(f"Найдено {len(image_files)} изображений в {source_dir}")
    
    # Перемещаем изображения в новую папку
    moved_files = []
    for file in image_files:
        source_path = os.path.join(source_dir, file)
        target_path = os.path.join(target_dir, file)
        try:
            shutil.move(source_path, target_path)
            moved_files.append(file)
            print(f'Перемещен файл: {file} в папку images/')
        except Exception as e:
            print(f'Ошибка при перемещении {file}: {str(e)}')
    
    return len(moved_files) > 0

def rename_images(directory=os.path.join(STATIC_ROOT, 'images')):
    # Убедимся, что директория существует
    if not os.path.exists(directory):
        print(f"Директория {directory} не существует")
        return

    # Получаем список всех файлов в директории
    files = [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))]
    
    # Фильтруем только изображения
    image_extensions = ('.png', '.jpg', '.jpeg', '.gif')
    image_files = [f for f in files if f.lower().endswith(image_extensions)]
    
    print(f"Найдено {len(image_files)} изображений для переименования")
    
    # Сортируем файлы
    image_files.sort()
    
    # Переименовываем файлы
    for index, old_name in enumerate(image_files, 1):
        # Получаем расширение файла
        extension = os.path.splitext(old_name)[1]
        # Создаем новое имя
        new_name = f'3d_view_{index}{extension}'
        
        # Полные пути к файлам
        old_path = os.path.join(directory, old_name)
        new_path = os.path.join(directory, new_name)
        
        try:
            os.rename(old_path, new_path)
            print(f'Переименован: {old_name} -> {new_name}')
        except Exception as e:
            print(f'Ошибка при переименовании {old_name}: {str(e)}')

if __name__ == '__main__':
    print(f'Используем папку static: {STATIC_ROOT}')
    print('Начинаем перемещение файлов...')
    
    if setup_image_directory():
        print('\nНачинаем переименование файлов...')
        rename_images()
        print('Переименование завершено!')
    else:
        print('Нет изображений для переименования') 