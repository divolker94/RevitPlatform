# revit_platform/parser/create_images_csv_final.py
import csv
import json
from pathlib import Path

def create_images_csv():
    """Создание CSV файла для family_images_2 с правильными путями"""
    
    # Читаем JSON
    json_file = Path('bim_families_complete.json')
    if not json_file.exists():
        print("❌ Файл bim_families_complete.json не найден!")
        return
    
    with open(json_file, 'r', encoding='utf-8') as f:
        families = json.load(f)
    
    print(f"📁 Загружено {len(families)} семейств из JSON")
    
    # Путь к папке с изображениями
    downloaded_dir = Path('downloaded_images')
    
    # CSV для изображений
    images_csv = 'family_images_simple.csv'
    fields = [
        'family_external_id', 'local_path', 'alt_text', 'title', 
        'image_type', 'width', 'height', 'file_size', 'local_filename'
    ]
    
    total_images = 0
    
    with open(images_csv, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fields)
        writer.writeheader()
        
        for family in families:
            family_id = family.get('external_id', '')
            family_name = family.get('name', 'unknown')
            
            print(f"Обрабатываем семейство: {family_name}")
            
            # Ищем папку семейства
            family_folder_name = f"{family_id}_{sanitize_filename(family_name)}"
            family_folder = downloaded_dir / family_folder_name
            
            if family_folder.exists():
                print(f"  ✅ Найдена папка: {family_folder}")
                
                # Ищем изображения в папке
                image_files = list(family_folder.glob("*"))
                print(f"    📄 Найдено файлов: {len(image_files)}")
                
                for img_file in image_files:
                    if img_file.is_file() and img_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                        # Путь для frontend
                        frontend_path = f"/images/downloaded_images/{family_folder_name}/{img_file.name}"
                        
                        row = {
                            'family_external_id': family_id,
                            'local_path': frontend_path,
                            'alt_text': f"Изображение {img_file.name}",
                            'title': f"Изображение {img_file.name}",
                            'image_type': 'downloaded',
                            'width': '',
                            'height': '',
                            'file_size': img_file.stat().st_size if img_file.exists() else '',
                            'local_filename': img_file.name
                        }
                        writer.writerow(row)
                        total_images += 1
                        print(f"    ✅ Добавлено: {img_file.name}")
            else:
                print(f"  ❌ Папка не найдена: {family_folder}")
    
    print(f"\n✅ Создан файл {images_csv}")
    print(f" Всего изображений: {total_images}")

def sanitize_filename(filename):
    """Очистка имени файла"""
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    if len(filename) > 100:
        filename = filename[:100]
    return filename

if __name__ == "__main__":
    create_images_csv()