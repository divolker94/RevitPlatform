#!/usr/bin/env python
"""
Простой скрипт для исправления JSON полей в PostgreSQL
"""

import psycopg2
import json

def fix_json_fields():
    """Исправляем JSON поля в таблице families_bimfamily_2"""
    
    # Подключение к базе данных - замените на ваши данные
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        database='revit_platform_2',
        user='postgres',
        password='23031994'  # ЗАМЕНИТЕ НА ВАШ ПАРОЛЬ!
    )
    
    cursor = conn.cursor()
    
    try:
        print("🔍 Проверяем структуру данных...")
        
        # Проверяем первую запись
        cursor.execute("""
            SELECT id, name, 
                   pg_typeof(technical_specs) as tech_type,
                   pg_typeof(catalog_items) as cat_type
            FROM families_bimfamily_2 
            LIMIT 1
        """)
        
        record = cursor.fetchone()
        if record:
            print(f"✅ Найдена запись ID: {record[0]}")
            print(f"📝 Название: {record[1]}")
            print(f"🔧 Technical specs тип: {record[2]}")
            print(f"📋 Catalog items тип: {record[3]}")
        
        print("\n🔧 Исправляем JSON поля...")
        
        # Исправляем technical_specs
        cursor.execute("""
            UPDATE families_bimfamily_2 
            SET technical_specs = technical_specs::text::jsonb
            WHERE pg_typeof(technical_specs) = 'text[]'::regtype
        """)
        
        tech_updated = cursor.rowcount
        print(f"  🔧 Исправлено technical_specs: {tech_updated} записей")
        
        # Изменяем тип столбца catalog_items с text[] на jsonb
        cursor.execute("""
            ALTER TABLE families_bimfamily_2 
            ALTER COLUMN catalog_items TYPE jsonb 
            USING array_to_json(catalog_items)
        """)
        
        cat_updated = 1  # Изменение типа столбца
        print(f"  📋 Изменен тип catalog_items с text[] на jsonb")
        
        # Исправляем basic_specs
        cursor.execute("""
            UPDATE families_bimfamily_2 
            SET basic_specs = basic_specs::text::jsonb
            WHERE pg_typeof(basic_specs) = 'text[]'::regtype
        """)
        
        basic_updated = cursor.rowcount
        print(f"  📊 Исправлено basic_specs: {basic_updated} записей")
        
        # Исправляем company_info
        cursor.execute("""
            UPDATE families_bimfamily_2 
            SET company_info = company_info::text::jsonb
            WHERE pg_typeof(company_info) = 'text[]'::regtype
        """)
        
        company_updated = cursor.rowcount
        print(f"  🏢 Исправлено company_info: {company_updated} записей")
        
        # Исправляем download_info
        cursor.execute("""
            UPDATE families_bimfamily_2 
            SET download_info = download_info::text::jsonb
            WHERE pg_typeof(download_info) = 'text[]'::regtype
        """)
        
        download_updated = cursor.rowcount
        print(f"  ⬇️ Исправлено download_info: {download_updated} записей")
        
        # Сохраняем изменения
        conn.commit()
        
        total_updated = tech_updated + cat_updated + basic_updated + company_updated + download_updated
        print(f"\n✅ Всего исправлено полей: {total_updated}")
        
        # Проверяем результат
        print("\n🔍 Проверяем результат...")
        cursor.execute("""
            SELECT id, name, 
                   pg_typeof(technical_specs) as tech_type,
                   pg_typeof(catalog_items) as cat_type
            FROM families_bimfamily_2 
            LIMIT 1
        """)
        
        record = cursor.fetchone()
        if record:
            print(f"  🔧 Technical specs тип: {record[2]}")
            print(f"  📋 Catalog items тип: {record[3]}")
            
            if 'jsonb' in str(record[2]) and 'jsonb' in str(record[3]):
                print("✅ Все JSON поля исправлены!")
            else:
                print("❌ Некоторые поля все еще не исправлены")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        conn.rollback()
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("🚀 Запуск исправления JSON полей")
    print("=" * 50)
    print("⚠️  ВАЖНО: Замените 'ваш_пароль' на реальный пароль от PostgreSQL!")
    print("=" * 50)
    fix_json_fields()
