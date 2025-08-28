# revit_platform/parser/load_to_postgres_python.py
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

def load_data():
    """Загрузка данных в PostgreSQL через Python"""
    
    try:
        # Подключаемся к базе
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        print("✅ Подключение к PostgreSQL установлено")
        
        # 1. Загружаем семейства
        print("📁 Загружаем семейства...")
        families_count = 0
        with open('families_bimfamily_simple.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
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
                        row['name'], row['external_id'], row['url'], row['description'],
                        row['technical_specs'], row['basic_specs'], row['catalog_items'],
                        row['company_info'], row['download_info'], row['parsing_method'],
                        row['total_images'], row['parsed_at']
                    ))
                    families_count += 1
                    if families_count % 5 == 0:
                        print(f"  Загружено семейств: {families_count}")
                except Exception as e:
                    print(f"❌ Ошибка при загрузке семейства {row.get('name', 'Unknown')}: {e}")
                    continue
        
        print(f"✅ Семейства загружены: {families_count}")
        
        # 2. Загружаем изображения
        print("��️ Загружаем изображения...")
        images_count = 0
        with open('family_images_simple.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    cursor.execute("""
                        INSERT INTO family_images_2 (
                            family_id, local_path, alt_text, title, image_type,
                            width, height, file_size, local_filename
                        )
                        SELECT 
                            f.id, %s, %s, %s, %s, %s, %s, %s, %s
                        FROM families_bimfamily_2 f 
                        WHERE f.external_id = %s
                    """, (
                        row['local_path'], row['alt_text'], row['title'], row['image_type'],
                        row['width'] or None, row['height'] or None, 
                        row['file_size'] or None, row['local_filename'],
                        row['family_external_id']
                    ))
                    images_count += 1
                    if images_count % 20 == 0:
                        print(f"  Загружено изображений: {images_count}")
                except Exception as e:
                    print(f"❌ Ошибка при загрузке изображения {row.get('local_filename', 'Unknown')}: {e}")
                    continue
        
        print(f"✅ Изображения загружены: {images_count}")
        
        # Коммитим изменения
        conn.commit()
        
        # Проверяем результат
        cursor.execute("SELECT COUNT(*) FROM families_bimfamily_2")
        final_families = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM family_images_2")
        final_images = cursor.fetchone()[0]
        
        print(f"\n�� Результат загрузки:")
        print(f"  Семейств: {final_families}")
        print(f"  Изображений: {final_images}")
        
        # Показываем примеры
        cursor.execute("SELECT name, external_id, total_images FROM families_bimfamily_2 LIMIT 3")
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
            print("�� Соединение с базой данных закрыто")

if __name__ == "__main__":
    load_data()