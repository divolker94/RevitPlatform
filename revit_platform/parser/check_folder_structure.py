# revit_platform/parser/check_folder_structure.py
import os
from pathlib import Path

def check_folders():
    """Проверка структуры папок с изображениями"""
    
    print("🔍 Проверяем структуру папок...")
    
    # Проверяем текущую директорию
    current_dir = Path.cwd()
    print(f"�� Текущая директория: {current_dir}")
    
    # Ищем папку downloaded_images
    downloaded_dir = current_dir / "downloaded_images"
    if downloaded_dir.exists():
        print(f"✅ Найдена папка: {downloaded_dir}")
        
        # Показываем содержимое
        for item in downloaded_dir.iterdir():
            if item.is_dir():
                print(f"  📁 {item.name}")
                # Показываем первые несколько файлов в каждой папке
                files = list(item.glob("*"))[:3]
                for file in files:
                    print(f"    📄 {file.name}")
                if len(list(item.glob("*"))) > 3:
                    print(f"    ... и еще {len(list(item.glob('*'))) - 3} файлов")
            else:
                print(f"  📄 {item.name}")
    else:
        print(f"❌ Папка downloaded_images не найдена в {current_dir}")
        
        # Ищем в родительских папках
        parent = current_dir.parent
        while parent != parent.parent:
            downloaded_in_parent = parent / "downloaded_images"
            if downloaded_in_parent.exists():
                print(f"✅ Найдена папка в родительской директории: {downloaded_in_parent}")
                break
            parent = parent.parent
        else:
            print("❌ Папка downloaded_images не найдена нигде")

if __name__ == "__main__":
    check_folders()