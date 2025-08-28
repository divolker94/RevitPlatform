# revit_platform/parser/json_to_csv_converter.py
import json
import csv
import logging
from pathlib import Path

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def convert_json_to_csv():
    """Конвертация JSON в CSV файлы для PostgreSQL"""
    
    # Читаем JSON файл
    json_file = Path('bim_families_complete.json')
    if not json_file.exists():
        logger.error("❌ Файл bim_families_complete.json не найден!")
        return
    
    with open(json_file, 'r', encoding='utf-8') as f:
        families = json.load(f)
    
    logger.info(f"📁 Загружено {len(families)} семейств из JSON")
    
    # Создаем CSV для семейств
    families_csv = 'families_bimfamily.csv'
    families_fields = [
        'name', 'external_id', 'url', 'description', 'technical_specs', 
        'basic_specs', 'catalog_items', 'company_info', 'download_info',
        'parsing_method', 'selenium_used', 'total_images', 
        'downloaded_images', 'parsed_at'
    ]
    
    with open(families_csv, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=families_fields)
        writer.writeheader()
        
        for family in families:
            # Подготавливаем данные для CSV
            row = {
                'name': family.get('name', ''),
                'external_id': family.get('external_id', ''),
                'url': family.get('url', ''),
                'description': family.get('description', ''),
                'technical_specs': json.dumps(family.get('technical_specs', {}), ensure_ascii=False),
                'basic_specs': json.dumps(family.get('basic_specs', {}), ensure_ascii=False),
                'catalog_items': ';'.join(family.get('catalog_items', [])),  # Массив в строку
                'company_info': json.dumps(family.get('company', {}), ensure_ascii=False),
                'download_info': json.dumps(family.get('download_info', {}), ensure_ascii=False),
                'parsing_method': family.get('parsing_method', ''),
                'selenium_used': 'true' if family.get('selenium_used') else 'false',
                'total_images': family.get('total_images', 0),
                'downloaded_images': family.get('downloaded_images', 0),
                'parsed_at': family.get('parsed_at', '')
            }
            writer.writerow(row)
    
    logger.info(f"✅ Создан файл {families_csv}")
    
    # Создаем CSV для изображений
    images_csv = 'family_images.csv'
    images_fields = [
        'family_external_id', 'url', 'local_path', 'alt_text', 'title', 
        'image_type', 'width', 'height', 'file_size', 'downloaded', 'local_filename'
    ]
    
    with open(images_csv, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=images_fields)
        writer.writeheader()
        
        for family in families:
            family_id = family.get('external_id', '')
            
            for img in family.get('images', []):
                row = {
                    'family_external_id': family_id,
                    'url': img.get('url', ''),
                    'local_path': img.get('local_path', ''),
                    'alt_text': img.get('alt', ''),
                    'title': img.get('title', ''),
                    'image_type': img.get('type', ''),
                    'width': img.get('width', ''),
                    'height': img.get('height', ''),
                    'file_size': img.get('file_size', ''),
                    'downloaded': 'true' if img.get('downloaded') else 'false',
                    'local_filename': img.get('local_filename', '')
                }
                writer.writerow(row)
    
    logger.info(f"✅ Создан файл {images_csv}")
    
    # Создаем SQL скрипт для загрузки CSV
    create_load_sql()
    
    logger.info("�� Конвертация завершена!")

def create_load_sql():
    """Создание SQL скрипта для загрузки CSV"""
    
    sql_content = """-- SQL скрипт для загрузки CSV файлов в PostgreSQL
-- Выполните эти команды в psql или pgAdmin

-- 1. Загружаем семейства
\\copy families_bimfamily (
    name, external_id, url, description, technical_specs, 
    basic_specs, catalog_items, company_info, download_info,
    parsing_method, selenium_used, total_images, 
    downloaded_images, parsed_at
) FROM 'families_bimfamily.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- 2. Загружаем изображения (сначала нужно получить family_id)
-- Создаем временную таблицу для связи
CREATE TEMP TABLE temp_images (
    family_external_id VARCHAR(100),
    url TEXT,
    local_path TEXT,
    alt_text TEXT,
    title TEXT,
    image_type VARCHAR(50),
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    downloaded BOOLEAN,
    local_filename VARCHAR(255)
);

-- Загружаем изображения во временную таблицу
\\copy temp_images FROM 'family_images.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- Вставляем изображения с правильными family_id
INSERT INTO family_images (
    family_id, url, local_path, alt_text, title, image_type,
    width, height, file_size, downloaded, local_filename
)
SELECT 
    f.id as family_id,
    ti.url, ti.local_path, ti.alt_text, ti.title, ti.image_type,
    ti.width, ti.height, ti.file_size, ti.downloaded, ti.local_filename
FROM temp_images ti
JOIN families_bimfamily f ON f.external_id = ti.family_external_id;

-- Удаляем временную таблицу
DROP TABLE temp_images;

-- 3. Проверяем результат
SELECT COUNT(*) as total_families FROM families_bimfamily;
SELECT COUNT(*) as total_images FROM family_images;

-- 4. Примеры данных
SELECT name, external_id, total_images FROM families_bimfamily LIMIT 5;
"""
    
    with open('load_csv_to_postgres.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    logger.info("✅ Создан SQL скрипт: load_csv_to_postgres.sql")

if __name__ == "__main__":
    convert_json_to_csv()