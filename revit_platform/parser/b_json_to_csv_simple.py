# revit_platform/parser/json_to_csv_simple.py
import json
import csv
import logging
from pathlib import Path
import shutil

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def convert_and_move_images():
    """Конвертация JSON в CSV и перемещение изображений"""
    
    # Пути
    source_images = Path('downloaded_images')
    frontend_images = Path('../../frontend/public/images/downloaded_images')
    
    # Создаем папку в frontend если её нет
    frontend_images.mkdir(parents=True, exist_ok=True)
    
    # Читаем JSON
    with open('bim_families_complete.json', 'r', encoding='utf-8') as f:
        families = json.load(f)
    
    logger.info(f"📁 Загружено {len(families)} семейств")
    
    # CSV для семейств (упрощенный)
    families_csv = 'families_bimfamily_simple.csv'
    families_fields = [
        'name', 'external_id', 'url', 'description', 'technical_specs', 
        'basic_specs', 'catalog_items', 'company_info', 'download_info',
        'parsing_method', 'total_images', 'parsed_at'
    ]
    
    with open(families_csv, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=families_fields)
        writer.writeheader()
        
        for family in families:
            row = {
                'name': family.get('name', ''),
                'external_id': family.get('external_id', ''),
                'url': family.get('url', ''),
                'description': family.get('description', ''),
                'technical_specs': json.dumps(family.get('technical_specs', {}), ensure_ascii=False),
                'basic_specs': json.dumps(family.get('basic_specs', {}), ensure_ascii=False),
                'catalog_items': ';'.join(family.get('catalog_items', [])),
                'company_info': json.dumps(family.get('company', {}), ensure_ascii=False),
                'download_info': json.dumps(family.get('download_info', {}), ensure_ascii=False),
                'parsing_method': family.get('parsing_method', ''),
                'total_images': family.get('total_images', 0),
                'parsed_at': family.get('parsed_at', '')
            }
            writer.writerow(row)
    
    logger.info(f"✅ Создан файл {families_csv}")
    
    # CSV для изображений (только локальные пути)
    images_csv = 'family_images_simple.csv'
    images_fields = [
        'family_external_id', 'local_path', 'alt_text', 'title', 
        'image_type', 'width', 'height', 'file_size', 'local_filename'
    ]
    
    total_moved = 0
    
    with open(images_csv, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=images_fields)
        writer.writeheader()
        
        for family in families:
            family_id = family.get('external_id', '')
            family_name = family.get('name', 'unknown')
            
            # Создаем папку для семейства в frontend
            family_frontend_dir = frontend_images / f"{family_id}_{sanitize_filename(family_name)}"
            family_frontend_dir.mkdir(exist_ok=True)
            
            for img in family.get('images', []):
                if img.get('local_path') and Path(img['local_path']).exists():
                    # Копируем изображение в frontend
                    source_file = Path(img['local_path'])
                    dest_file = family_frontend_dir / source_file.name
                    
                    try:
                        shutil.copy2(source_file, dest_file)
                        total_moved += 1
                        
                        # Обновляем путь для frontend
                        frontend_path = f"/images/downloaded_images/{family_id}_{sanitize_filename(family_name)}/{source_file.name}"
                        
                        row = {
                            'family_external_id': family_id,
                            'local_path': frontend_path,  # Путь для frontend
                            'alt_text': img.get('alt', ''),
                            'title': img.get('title', ''),
                            'image_type': img.get('type', ''),
                            'width': img.get('width', ''),
                            'height': img.get('height', ''),
                            'file_size': img.get('file_size', ''),
                            'local_filename': source_file.name
                        }
                        writer.writerow(row)
                        
                    except Exception as e:
                        logger.error(f"❌ Ошибка копирования {source_file}: {e}")
    
    logger.info(f"✅ Создан файл {images_csv}")
    logger.info(f"📁 Перемещено {total_moved} изображений в frontend")
    
    # Создаем упрощенный SQL скрипт
    create_simple_load_sql()
    
    logger.info(" Конвертация и перемещение завершены!")

def sanitize_filename(filename):
    """Очистка имени файла"""
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    if len(filename) > 100:
        filename = filename[:100]
    return filename

def create_simple_load_sql():
    """Создание упрощенного SQL скрипта"""
    
    sql_content = """-- Упрощенный SQL скрипт для загрузки CSV файлов
-- Выполните эти команды в psql или pgAdmin

-- 1. Загружаем семейства
\\copy families_bimfamily (
    name, external_id, url, description, technical_specs, 
    basic_specs, catalog_items, company_info, download_info,
    parsing_method, total_images, parsed_at
) FROM 'families_bimfamily_simple.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- 2. Загружаем изображения
-- Создаем временную таблицу
CREATE TEMP TABLE temp_images (
    family_external_id VARCHAR(100),
    local_path TEXT,
    alt_text TEXT,
    title TEXT,
    image_type VARCHAR(50),
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    local_filename VARCHAR(255)
);

-- Загружаем изображения во временную таблицу
\\copy temp_images FROM 'family_images_simple.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- Вставляем изображения с правильными family_id
INSERT INTO family_images (
    family_id, local_path, alt_text, title, image_type,
    width, height, file_size, local_filename
)
SELECT 
    f.id as family_id,
    ti.local_path, ti.alt_text, ti.title, ti.image_type,
    ti.width, ti.height, ti.file_size, ti.local_filename
FROM temp_images ti
JOIN families_bimfamily f ON f.external_id = ti.family_external_id;

-- Удаляем временную таблицу
DROP TABLE temp_images;

-- 3. Проверяем результат
SELECT COUNT(*) as total_families FROM families_bimfamily;
SELECT COUNT(*) as total_images FROM family_images;

-- 4. Примеры данных
SELECT name, external_id, total_images FROM families_bimfamily LIMIT 5;
SELECT local_path, local_filename FROM family_images LIMIT 5;
"""
    
    with open('load_csv_simple_to_postgres.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    logger.info("✅ Создан упрощенный SQL скрипт: load_csv_simple_to_postgres.sql")

if __name__ == "__main__":
    convert_and_move_images()