# revit_platform/parser/fix_csv_for_postgres.py
import csv
import json
import re

def clean_text(text):
    """Очистка текста от HTML-кодировки и специальных символов"""
    if not text:
        return ""
    
    # Декодируем HTML-сущности
    text = text.replace('&quot;', '"')
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    
    # Убираем лишние пробелы и переносы
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    # Ограничиваем длину
    if len(text) > 1000:
        text = text[:997] + "..."
    
    return text

def fix_json_field(json_str):
    """Исправление JSON полей"""
    if not json_str:
        return "{}"
    
    try:
        # Пытаемся распарсить как JSON
        parsed = json.loads(json_str)
        return json.dumps(parsed, ensure_ascii=False)
    except:
        # Если не парсится, создаем простой объект
        return "{}"

def fix_catalog_items(catalog_items_str):
    """Исправление поля catalog_items для PostgreSQL массива"""
    if not catalog_items_str:
        return []
    
    # Убираем лишние символы
    items = catalog_items_str.replace('"', '').replace('[', '').replace(']', '')
    
    # Разбиваем по ;
    if ';' in items:
        items_list = [item.strip() for item in items.split(';') if item.strip()]
    else:
        items_list = [items.strip()] if items.strip() else []
    
    # Ограничиваем количество элементов
    return items_list[:20]  # Максимум 20 элементов

def create_clean_csv():
    """Создание очищенного CSV для PostgreSQL"""
    
    # Читаем исходный CSV
    input_file = 'families_bimfamily_simple.csv'
    output_file = 'families_bimfamily_clean.csv'
    
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        
        reader = csv.DictReader(infile)
        
        # Определяем поля для новой таблицы
        fieldnames = [
            'name', 'external_id', 'url', 'description', 
            'technical_specs', 'basic_specs', 'catalog_items',
            'company_info', 'download_info', 'parsing_method',
            'total_images', 'parsed_at'
        ]
        
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for row in reader:
            # Очищаем и исправляем каждое поле
            clean_row = {}
            
            # name - ограничиваем длину
            clean_row['name'] = clean_text(row.get('name', ''))[:200]
            
            # external_id - оставляем как есть
            clean_row['external_id'] = row.get('external_id', '')
            
            # url - оставляем как есть
            clean_row['url'] = row.get('url', '')
            
            # description - очищаем и ограничиваем
            clean_row['description'] = clean_text(row.get('description', ''))[:500]
            
            # technical_specs - исправляем JSON
            clean_row['technical_specs'] = fix_json_field(row.get('technical_specs', ''))
            
            # basic_specs - исправляем JSON
            clean_row['basic_specs'] = fix_json_field(row.get('basic_specs', ''))
            
            # catalog_items - исправляем для массива
            catalog_items = fix_catalog_items(row.get('catalog_items', ''))
            clean_row['catalog_items'] = catalog_items
            
            # company_info - исправляем JSON
            clean_row['company_info'] = fix_json_field(row.get('company_info', ''))
            
            # download_info - исправляем JSON
            clean_row['download_info'] = fix_json_field(row.get('download_info', ''))
            
            # parsing_method - оставляем как есть
            clean_row['parsing_method'] = row.get('parsing_method', '')
            
            # total_images - конвертируем в число
            try:
                clean_row['total_images'] = int(row.get('total_images', 0))
            except:
                clean_row['total_images'] = 0
            
            # parsed_at - оставляем как есть
            clean_row['parsed_at'] = row.get('parsed_at', '')
            
            # Записываем очищенную строку
            writer.writerow(clean_row)
    
    print(f"✅ Создан очищенный CSV файл: {output_file}")

def create_images_csv():
    """Создание CSV для изображений"""
    
    # Читаем JSON для получения информации об изображениях
    try:
        with open('bim_families_complete.json', 'r', encoding='utf-8') as f:
            families = json.load(f)
    except:
        print("❌ Файл bim_families_complete.json не найден")
        return
    
    # Создаем CSV для изображений
    images_file = 'family_images_clean.csv'
    
    with open(images_file, 'w', encoding='utf-8', newline='') as outfile:
        fieldnames = [
            'family_external_id', 'local_path', 'alt_text', 'title',
            'image_type', 'width', 'height', 'file_size', 'local_filename'
        ]
        
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for family in families:
            external_id = family.get('external_id', '')
            images = family.get('images', [])
            
            for img in images:
                # Создаем путь к изображению в папке public/images
                image_path = f"images/bim_families/{img.get('local_filename', '')}"
                
                row = {
                    'family_external_id': external_id,
                    'local_path': image_path,
                    'alt_text': clean_text(img.get('alt', ''))[:200],
                    'title': clean_text(img.get('title', ''))[:200],
                    'image_type': img.get('type', '')[:50],
                    'width': img.get('width') or None,
                    'height': img.get('height') or None,
                    'file_size': img.get('file_size') or None,
                    'local_filename': img.get('local_filename', '')
                }
                
                writer.writerow(row)
    
    print(f"✅ Создан CSV файл для изображений: {images_file}")

if __name__ == "__main__":
    print("🧹 Создаем очищенные CSV файлы для PostgreSQL...")
    
    create_clean_csv()
    create_images_csv()
    
    print("\n✅ Готово! Теперь можно импортировать данные в PostgreSQL.")
    print("\n�� Следующие шаги:")
    print("1. Запустите исправленный скрипт загрузки")
    print("2. Переместите папку downloaded_images в frontend/public/images/bim_families")
    print("3. Проверьте данные в базе")