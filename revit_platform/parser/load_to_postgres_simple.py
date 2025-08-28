# revit_platform/parser/load_to_postgres_simple.py
import psycopg2
import csv
import json

# Конфигурация базы данных
db_config = {
    'host': 'localhost',
    'database': 'revit_platform_2',
    'user': 'postgres',
    'password': '23031994'
}

def fix_catalog_items(catalog_items_str):
    """Исправление формата catalog_items для PostgreSQL массива"""
    if not catalog_items_str:
        return []
    
    # Убираем лишние символы и разбиваем по ;
    items = catalog_items_str.replace('"', '').replace('[', '').replace(']', '')
    if ';' in items:
        return [item.strip() for item in items.split(';') if item.strip()]
    else:
        return [items.strip()] if items.strip() else []

def load_data():
    """Загрузка данных в PostgreSQL через Python"""
    
    try:
        # Подключаемся к базе
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        print("✅ Подключение к PostgreSQL установлено")
        
        # 1. Загружаем семейства
        print("📁 Загружаем семейства...")
        
        with open('families_bimfamily_simple.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for i, row in enumerate(reader, 1):
                try:
                    # Исправляем catalog_items
                    catalog_items = fix_catalog_items(row.get('catalog_items', ''))
                    
                    # Вставляем семейство
                    cursor.execute("""
                        INSERT INTO families_bimfamily_2 (
                            name, external_id, url, description, technical_specs, 
                            basic_specs, catalog_items, company_info, download_info,
                            parsing_method, total_images, parsed_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                            total_images = EXCLUDED.total_images,
                            parsed_at = EXCLUDED.parsed_at
                    """, (
                        row['name'],
                        row['external_id'],
                        row['url'],
                        row['description'],
                        row['technical_specs'],
                        row['basic_specs'],
                        catalog_items,
                        row['company_info'],
                        row['download_info'],
                        row['parsing_method'],
                        row['total_images'],
                        row['parsed_at']
                    ))
                    
                    if i % 5 == 0:
                        print(f"  Загружено семейств: {i}")
                        
                except Exception as e:
                    print(f"❌ Ошибка при загрузке семейства {row.get('name', 'Unknown')}: {e}")
                    continue
        
        conn.commit()
        print("✅ Семейства загружены")
        
        # 2. Загружаем ссылки на изображения
        print("🖼️ Загружаем ссылки на изображения...")
        
        with open('family_images_simple.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            images_loaded = 0
            for row in reader:
                try:
                    # Получаем ID семейства по external_id
                    cursor.execute("""
                        SELECT id FROM families_bimfamily_2 WHERE external_id = %s
                    """, (row['family_external_id'],))
                    
                    result = cursor.fetchone()
                    if not result:
                        print(f"⚠️ Семейство с external_id {row['family_external_id']} не найдено")
                        continue
                    
                    family_id = result[0]
                    
                    # Создаем путь к изображению в папке public/images
                    # Предполагаем, что изображения будут в: public/images/bim_families/
                    image_path = f"images/bim_families/{row['local_filename']}"
                    
                    # Вставляем ссылку на изображение
                    cursor.execute("""
                        INSERT INTO family_images_2 (
                            family_id, local_path, alt_text, title, 
                            image_type, width, height, file_size, local_filename
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        family_id,
                        image_path,  # Путь к изображению в public/images
                        row.get('alt_text', ''),
                        row.get('title', ''),
                        row.get('image_type', ''),
                        row.get('width') or None,
                        row.get('height') or None,
                        row.get('file_size') or None,
                        row['local_filename']
                    ))
                    
                    images_loaded += 1
                    
                except Exception as e:
                    print(f"❌ Ошибка при загрузке изображения {row.get('local_filename', 'Unknown')}: {e}")
                    continue
        
        conn.commit()
        print(f"✅ Ссылки на изображения загружены: {images_loaded}")
        
        # 3. Выводим статистику
        cursor.execute("SELECT COUNT(*) FROM families_bimfamily_2")
        families_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM family_images_2")
        images_count = cursor.fetchone()[0]
        
        print(f"\n�� Результат загрузки:")
        print(f"  Семейств: {families_count}")
        print(f"  Ссылок на изображения: {images_count}")
        
        # 4. Показываем примеры
        cursor.execute("""
            SELECT f.name, f.external_id, COUNT(i.id) as images_count
            FROM families_bimfamily_2 f
            LEFT JOIN family_images_2 i ON f.id = i.family_id
            GROUP BY f.id, f.name, f.external_id
            LIMIT 3
        """)
        
        print(f"\n📋 Примеры семейств:")
        for row in cursor.fetchall():
            print(f"  {row[0]} (ID: {row[1]}, Изображений: {row[2]})")
        
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        if 'conn' in locals():
            conn.rollback()
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
            print("Соединение с базой данных закрыто")

if __name__ == "__main__":
    load_data()