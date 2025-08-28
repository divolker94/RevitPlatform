#!/usr/bin/env python
"""
Скрипт для прямого SQL исправления JSON полей в базе данных BIM семейств.
Исправляет проблему с полями, которые хранятся как Python списки вместо JSON строк.
"""

import os
import sys
import django
import json
import psycopg2
from psycopg2.extras import RealDictCursor

# Настраиваем Django для получения настроек базы данных
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings

def get_db_connection():
    """Получаем прямое подключение к базе данных"""
    db_settings = settings.DATABASES['default']
    
    connection = psycopg2.connect(
        host=db_settings['HOST'],
        port=db_settings['PORT'],
        database=db_settings['NAME'],
        user=db_settings['USER'],
        password=db_settings['PASSWORD']
    )
    
    return connection

def check_data_structure_sql():
    """Проверяем структуру данных через прямой SQL"""
    print("🔍 Проверяем структуру данных через SQL...")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Проверяем первую запись
        cursor.execute("""
            SELECT id, name, technical_specs, catalog_items, basic_specs, company_info, download_info
            FROM families_bimfamily_2 
            LIMIT 1
        """)
        
        record = cursor.fetchone()
        if record:
            print(f"✅ Найдена запись ID: {record['id']}")
            print(f"📝 Название: {record['name']}")
            print(f"🔧 Technical specs тип: {type(record['technical_specs'])}")
            print(f"📋 Catalog items тип: {type(record['catalog_items'])}")
            
            if record['basic_specs']:
                print(f"📊 Basic specs тип: {type(record['basic_specs'])}")
            if record['company_info']:
                print(f"🏢 Company info тип: {type(record['company_info'])}")
            if record['download_info']:
                print(f"⬇️ Download info тип: {type(record['download_info'])}")
            
            cursor.close()
            conn.close()
            return True
        else:
            print("❌ Нет записей в базе данных")
            cursor.close()
            conn.close()
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при проверке: {e}")
        try:
            cursor.close()
            conn.close()
        except:
            pass
        return False

def fix_json_fields_sql():
    """Исправляем JSON поля через прямой SQL"""
    print("\n🔧 Исправляем JSON поля через SQL...")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Получаем все записи с проблемными JSON полями
        cursor.execute("""
            SELECT id, technical_specs, catalog_items, basic_specs, company_info, download_info 
            FROM families_bimfamily_2 
            WHERE technical_specs IS NOT NULL 
               OR catalog_items IS NOT NULL 
               OR basic_specs IS NOT NULL 
               OR company_info IS NOT NULL 
               OR download_info IS NOT NULL
        """)
        
        records = cursor.fetchall()
        print(f"  📊 Найдено записей для проверки: {len(records)}")
        
        fixed_count = 0
        
        for record in records:
            record_id = record[0]
            updates = []
            
            try:
                # Проверяем каждое поле
                if isinstance(record[1], list):  # technical_specs
                    json_str = json.dumps(record[1], ensure_ascii=False)
                    updates.append(f"technical_specs = '{json_str}'")
                    print(f"  🔧 Исправлен technical_specs для записи {record_id}")
                    
                if isinstance(record[2], list):  # catalog_items
                    json_str = json.dumps(record[2], ensure_ascii=False)
                    updates.append(f"catalog_items = '{json_str}'")
                    print(f"  📋 Исправлен catalog_items для записи {record_id}")
                    
                if isinstance(record[3], list):  # basic_specs
                    json_str = json.dumps(record[3], ensure_ascii=False)
                    updates.append(f"basic_specs = '{json_str}'")
                    print(f"  📊 Исправлен basic_specs для записи {record_id}")
                    
                if isinstance(record[4], list):  # company_info
                    json_str = json.dumps(record[4], ensure_ascii=False)
                    updates.append(f"company_info = '{json_str}'")
                    print(f"  🏢 Исправлен company_info для записи {record_id}")
                    
                if isinstance(record[5], list):  # download_info
                    json_str = json.dumps(record[5], ensure_ascii=False)
                    updates.append(f"download_info = '{json_str}'")
                    print(f"  ⬇️ Исправлен download_info для записи {record_id}")
                
                # Обновляем запись
                if updates:
                    update_sql = f"UPDATE families_bimfamily_2 SET {', '.join(updates)} WHERE id = {record_id}"
                    cursor.execute(update_sql)
                    fixed_count += 1
                    
            except Exception as e:
                print(f"  ❌ Ошибка при обработке записи {record_id}: {e}")
                continue
        
        conn.commit()
        print(f"  ✅ Обновлено записей: {fixed_count}")
        
        cursor.close()
        conn.close()
        
        return fixed_count
        
    except Exception as e:
        print(f"  ❌ Ошибка при SQL обновлении: {e}")
        try:
            cursor.close()
            conn.close()
        except:
            pass
        return 0

def verify_fix_sql():
    """Проверяем результат исправления через SQL"""
    print("\n🔍 Проверяем результат исправления...")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Проверяем первую запись
        cursor.execute("""
            SELECT id, technical_specs, catalog_items, basic_specs, company_info, download_info
            FROM families_bimfamily_2 
            LIMIT 1
        """)
        
        record = cursor.fetchone()
        if record:
            print("✅ После исправления:")
            print(f"  🔧 Technical specs тип: {type(record['technical_specs'])}")
            print(f"  📋 Catalog items тип: {type(record['catalog_items'])}")
            
            if record['basic_specs']:
                print(f"  📊 Basic specs тип: {type(record['basic_specs'])}")
            if record['company_info']:
                print(f"  🏢 Company info тип: {type(record['company_info'])}")
            if record['download_info']:
                print(f"  ⬇️ Download info тип: {type(record['download_info'])}")
            
            # Проверяем, что поля теперь строки
            if isinstance(record['technical_specs'], str) and isinstance(record['catalog_items'], str):
                print("✅ Все JSON поля исправлены!")
                cursor.close()
                conn.close()
                return True
            else:
                print("❌ Некоторые поля все еще не исправлены")
                cursor.close()
                conn.close()
                return False
        else:
            print("❌ Нет записей для проверки")
            cursor.close()
            conn.close()
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при проверке: {e}")
        try:
            cursor.close()
            conn.close()
        except:
            pass
        return False

def main():
    """Основная функция"""
    print("🚀 Запуск SQL исправления данных BIM семейств")
    print("=" * 50)
    
    # Проверяем структуру данных
    if not check_data_structure_sql():
        print("❌ Не удалось проверить структуру данных")
        return
    
    # Исправляем через SQL
    fixed_count = fix_json_fields_sql()
    
    if fixed_count > 0:
        # Проверяем результат
        if verify_fix_sql():
            print("\n🎉 Исправление завершено успешно!")
            print("Теперь API должен работать корректно.")
        else:
            print("\n❌ Исправление не завершено полностью.")
            print("Проверьте логи и попробуйте снова.")
    else:
        print("\n❌ Не удалось исправить данные.")
        print("Возможно, данные уже в правильном формате или есть другие проблемы.")

if __name__ == "__main__":
    main()
