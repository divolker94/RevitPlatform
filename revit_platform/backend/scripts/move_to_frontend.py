import os
import shutil
from pathlib import Path

# Пути к папкам
BACKEND_STATIC = r'D:\Cursor\1\revit_platform\backend\static\images'
FRONTEND_PUBLIC = r'D:\Cursor\1\revit_platform\frontend\public\images\catalog'

def move_images():
    # Создаем папку в public если её нет
    os.makedirs(FRONTEND_PUBLIC, exist_ok=True)
    print(f"Папка назначения: {FRONTEND_PUBLIC}")

    # Получаем список файлов
    if not os.path.exists(BACKEND_STATIC):
        print(f"Исходная папка {BACKEND_STATIC} не существует")
        return

    files = [f for f in os.listdir(BACKEND_STATIC) if f.startswith('3d_view_')]
    print(f"Найдено {len(files)} файлов для перемещения")

    # Перемещаем файлы
    for file in files:
        src = os.path.join(BACKEND_STATIC, file)
        dst = os.path.join(FRONTEND_PUBLIC, file)
        try:
            shutil.copy2(src, dst)  # copy2 сохраняет метаданные файла
            print(f"Скопирован: {file}")
        except Exception as e:
            print(f"Ошибка при копировании {file}: {str(e)}")

if __name__ == '__main__':
    print("Начинаем копирование изображений в frontend/public...")
    move_images()
    print("Копирование завершено!") 