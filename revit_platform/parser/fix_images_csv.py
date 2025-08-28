# revit_platform/parser/fix_images_csv.py
import csv
import json
from pathlib import Path

def create_images_csv():
    """Создание CSV файла для family_images_2 с данными"""
    
    # Читаем JSON
    json_file = Path('bim_families_complete.json')
    if not json_file.exists():
        print("❌ Файл bim_families_complete.json не найден!")
        return
    
    with open(json_file, 'r', encoding='utf-8') as f:
        families = json.load(f)
    
    print(f"📁 Загружено {len(families)} семейств из JSON")
    
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
            
            for img in family.get('images', []):
                if img.get('local_path') and Path(img['local_path']).exists():
                    # Путь для frontend (относительно public/images)
                    frontend_path = f"/images/downloaded_images/{family_id}_{sanitize_filename(family_name)}/{Path(img['local_path']).name}"
                    
                    row = {
                        'family_external_id': family_id,
                        'local_path': frontend_path,
                        'alt_text': img.get('alt', ''),
                        'title': img.get('title', ''),
                        'image_type': img.get('type', ''),
                        'width': img.get('width', ''),
                        'height': img.get('height', ''),
                        'file_size': img.get('file_size', ''),
                        'local_filename': Path(img['local_path']).name
                    }
                    writer.writerow(row)
                    total_images += 1
                    print(f"  ✅ Добавлено изображение: {Path(img['local_path']).name}")
                else:
                    print(f"  ⚠️ Пропущено изображение: {img.get('local_path', 'no_path')}")
    
    print(f"\n✅ Создан файл {images_csv}")
    print(f"�� Всего изображений: {total_images}")

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