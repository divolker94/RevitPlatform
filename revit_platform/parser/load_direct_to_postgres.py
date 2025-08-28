# revit_platform/parser/load_direct_to_postgres.py
import psycopg2
import json
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db_config = {
    'host': 'localhost',
    'database': 'revit_platform_2',
    'user': 'postgres',
    'password': '23031994',
    'options': {'client_encoding': 'UTF8'}
}

def load_direct_to_postgres():
    """Прямая загрузка данных в PostgreSQL"""
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        logger.info("✅ Подключение к PostgreSQL установлено")
        
        # Читаем JSON
        with open('bim_families_complete.json', 'r', encoding='utf-8') as f:
            families = json.load(f)
        
        logger.info(f"📁 Загружено {len(families)} семейств")
        
        inserted_families = 0
        inserted_images = 0
        
        for family in families:
            try:
                # Вставляем семейство
                cursor.execute("""
                    INSERT INTO families_bimfamily (
                        name, external_id, url, description, technical_specs, 
                        basic_specs, catalog_items, company_info, download_info,
                        parsing_method, selenium_used, total_images, 
                        downloaded_images, parsed_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (external_id) DO UPDATE SET
                        name = EXCLUDED.name,
                        url = EXCLUDED.url,
                        description = EXCLUDED.description,
                        technical_specs = EXCLUDED.technical_specs,
                        basic_specs = EXCLUDED.basic_specs,
                        catalog_items = EXCLUDED.catalog_items,
                        company_info = EXCLUDED.company_info,
                        download_info = EXCLUDED.download_info,
                        parsing_method = EXCLUDED.parsing_method,
                        selenium_used = EXCLUDED.selenium_used,
                        total_images = EXCLUDED.total_images,
                        downloaded_images = EXCLUDED.downloaded_images,
                        parsed_at = EXCLUDED.parsed_at
                    RETURNING id
                """, (
                    family.get('name', ''),
                    family.get('external_id', ''),
                    family.get('url', ''),
                    family.get('description', ''),
                    json.dumps(family.get('technical_specs', {}), ensure_ascii=False),
                    json.dumps(family.get('basic_specs', {}), ensure_ascii=False),
                    family.get('catalog_items', []),
                    json.dumps(family.get('company', {}), ensure_ascii=False),
                    json.dumps(family.get('download_info', {}), ensure_ascii=False),
                    family.get('parsing_method', ''),
                    family.get('selenium_used', False),
                    family.get('total_images', 0),
                    family.get('downloaded_images', 0),
                    family.get('parsed_at', '')
                ))
                
                family_id = cursor.fetchone()[0]
                inserted_families += 1
                
                # Вставляем изображения
                for img in family.get('images', []):
                    cursor.execute("""
                        INSERT INTO family_images (
                            family_id, url, local_path, alt_text, title, image_type,
                            width, height, file_size, downloaded, local_filename
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        family_id,
                        img.get('url', ''),
                        img.get('local_path', ''),
                        img.get('alt', ''),
                        img.get('title', ''),
                        img.get('type', ''),
                        img.get('width'),
                        img.get('height'),
                        img.get('file_size'),
                        img.get('downloaded', False),
                        img.get('local_filename', '')
                    ))
                    inserted_images += 1
                
                logger.info(f"✅ Семейство {family.get('name', 'Unknown')} загружено")
                
            except Exception as e:
                logger.error(f"❌ Ошибка при загрузке семейства {family.get('name', 'Unknown')}: {e}")
                continue
        
        conn.commit()
        
        logger.info(f"\n�� Загрузка завершена!")
        logger.info(f"  Семейств: {inserted_families}")
        logger.info(f"  Изображений: {inserted_images}")
        
    except Exception as e:
        logger.error(f"❌ Критическая ошибка: {e}")
        if 'conn' in locals():
            conn.rollback()
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    load_direct_to_postgres()