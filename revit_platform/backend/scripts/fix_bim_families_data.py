#!/usr/bin/env python
"""
Скрипт для исправления JSON полей в базе данных BIM семейств.
Исправляет проблему с полями, которые хранятся как Python списки вместо JSON строк.
"""

import os
import sys
import django
import json

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from bim_families.models import BimFamily
from django.db import connection

def check_data_structure():
    """Проверяем структуру данных в базе"""
    print("🔍 Проверяем структуру данных...")
    
    try:
        family = BimFamily.objects.first()
        if family:
            print(f"✅ Найдена запись ID: {family.id}")
            print(f"📝 Название: {family.name}")
            print(f"🔧 Technical specs тип: {type(family.technical_specs)}")
            print(f"📋 Catalog items тип: {type(family.catalog_items)}")
            
            if hasattr(family, 'basic_specs'):
                print(f"📊 Basic specs тип: {type(family.basic_specs)}")
            if hasattr(family, 'company_info'):
                print(f"🏢 Company info тип: {type(family.company_info)}")
            if hasattr(family, 'download_info'):
                print(f"⬇️ Download info тип: {type(family.download_info)}")
                
            return True
        else:
            print("❌ Нет записей в базе данных")
            return False
    except Exception as e:
        print(f"❌ Ошибка при проверке: {e}")
        return False

def fix_json_fields():
    """Исправляем JSON поля через Django ORM"""
    print("\n🔧 Исправляем JSON поля через Django ORM...")
    
    families = BimFamily.objects.all()
    fixed_count = 0
    error_count = 0
    
    for family in families:
        try:
            updated = False
            
            # Исправляем technical_specs
            if isinstance(family.technical_specs, list):
                family.technical_specs = json.dumps(family.technical_specs, ensure_ascii=False)
                updated = True
                print(f"  🔧 Исправлен technical_specs для записи {family.id}")
            
            # Исправляем catalog_items
            if isinstance(family.catalog_items, list):
                family.catalog_items = json.dumps(family.catalog_items, ensure_ascii=False)
                updated = True
                print(f"  📋 Исправлен catalog_items для записи {family.id}")
            
            # Исправляем basic_specs
            if hasattr(family, 'basic_specs') and isinstance(family.basic_specs, list):
                family.basic_specs = json.dumps(family.basic_specs, ensure_ascii=False)
                updated = True
                print(f"  📊 Исправлен basic_specs для записи {family.id}")
            
            # Исправляем company_info
            if hasattr(family, 'company_info') and isinstance(family.company_info, list):
                family.company_info = json.dumps(family.company_info, ensure_ascii=False)
                updated = True
                print(f"  🏢 Исправлен company_info для записи {family.id}")
            
            # Исправляем download_info
            if hasattr(family, 'download_info') and isinstance(family.download_info, list):
                family.download_info = json.dumps(family.download_info, ensure_ascii=False)
                updated = True
                print(f"  ⬇️ Исправлен download_info для записи {family.id}")
            
            if updated:
                family.save()
                fixed_count += 1
                
        except Exception as e:
            error_count += 1
            print(f"  ❌ Ошибка при исправлении записи {family.id}: {e}")
    
    print(f"\n✅ Исправлено записей: {fixed_count}")
    if error_count > 0:
        print(f"❌ Ошибок: {error_count}")
    
    return fixed_count, error_count

def fix_json_fields_sql():
    """Исправляем JSON поля через SQL (альтернативный способ)"""
    print("\n🔧 Исправляем JSON поля через SQL...")
    
    try:
        with connection.cursor() as cursor:
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
                
                # Проверяем каждое поле
                if isinstance(record[1], list):  # technical_specs
                    updates.append(f"technical_specs = '{json.dumps(record[1], ensure_ascii=False)}'")
                    
                if isinstance(record[2], list):  # catalog_items
                    updates.append(f"catalog_items = '{json.dumps(record[2], ensure_ascii=False)}'")
                    
                if isinstance(record[3], list):  # basic_specs
                    updates.append(f"basic_specs = '{json.dumps(record[3], ensure_ascii=False)}'")
                    
                if isinstance(record[4], list):  # company_info
                    updates.append(f"company_info = '{json.dumps(record[4], ensure_ascii=False)}'")
                    
                if isinstance(record[5], list):  # download_info
                    updates.append(f"download_info = '{json.dumps(record[5], ensure_ascii=False)}'")
                
                # Обновляем запись
                if updates:
                    update_sql = f"UPDATE families_bimfamily_2 SET {', '.join(updates)} WHERE id = {record_id}"
                    cursor.execute(update_sql)
                    fixed_count += 1
                    print(f"  🔧 Обновлена запись {record_id}")
            
            connection.commit()
            print(f"  ✅ Обновлено записей: {fixed_count}")
            
            return fixed_count
            
    except Exception as e:
        print(f"  ❌ Ошибка при SQL обновлении: {e}")
        return 0

def verify_fix():
    """Проверяем, что исправление прошло успешно"""
    print("\n🔍 Проверяем результат исправления...")
    
    try:
        family = BimFamily.objects.first()
        if family:
            print("✅ После исправления:")
            print(f"  🔧 Technical specs тип: {type(family.technical_specs)}")
            print(f"  📋 Catalog items тип: {type(family.catalog_items)}")
            
            if hasattr(family, 'basic_specs'):
                print(f"  📊 Basic specs тип: {type(family.basic_specs)}")
            if hasattr(family, 'company_info'):
                print(f"  🏢 Company info тип: {type(family.company_info)}")
            if hasattr(family, 'download_info'):
                print(f"  ⬇️ Download info тип: {type(family.download_info)}")
            
            # Проверяем, что поля теперь строки
            if isinstance(family.technical_specs, str) and isinstance(family.catalog_items, str):
                print("✅ Все JSON поля исправлены!")
                return True
            else:
                print("❌ Некоторые поля все еще не исправлены")
                return False
        else:
            print("❌ Нет записей для проверки")
            return False
    except Exception as e:
        print(f"❌ Ошибка при проверке: {e}")
        return False

def main():
    """Основная функция"""
    print("🚀 Запуск исправления данных BIM семейств")
    print("=" * 50)
    
    # Проверяем структуру данных
    if not check_data_structure():
        print("❌ Не удалось проверить структуру данных")
        return
    
    # Исправляем через Django ORM
    fixed_count, error_count = fix_json_fields()
    
    # Если Django ORM не сработал, пробуем SQL
    if fixed_count == 0:
        print("\n🔄 Django ORM не сработал, пробуем SQL...")
        fix_json_fields_sql()
    
    # Проверяем результат
    if verify_fix():
        print("\n🎉 Исправление завершено успешно!")
        print("Теперь API должен работать корректно.")
    else:
        print("\n❌ Исправление не завершено полностью.")
        print("Проверьте логи и попробуйте снова.")

if __name__ == "__main__":
    main()
