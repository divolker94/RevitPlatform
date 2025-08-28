# revit_platform/parser/test_libraries.py
import sys

def test_libraries():
    """Тестирование всех необходимых библиотек"""
    print("=== ТЕСТИРОВАНИЕ БИБЛИОТЕК ===\n")
    
    # Список необходимых библиотек
    required_libraries = [
        'requests',
        'bs4',  # BeautifulSoup
        'psycopg2',
        'json',
        'time',
        're',
        'urllib.parse',
        'logging'
    ]
    
    all_ok = True
    
    for lib in required_libraries:
        try:
            if lib == 'bs4':
                import bs4
                print(f"✅ {lib} (BeautifulSoup) - OK")
            elif lib == 'psycopg2':
                import psycopg2
                print(f"✅ {lib} - OK")
            elif lib == 'urllib.parse':
                import urllib.parse
                print(f"✅ {lib} - OK")
            else:
                __import__(lib)
                print(f"✅ {lib} - OK")
        except ImportError as e:
            print(f"❌ {lib} - ОШИБКА: {e}")
            all_ok = False
        except Exception as e:
            print(f"⚠️  {lib} - ПРЕДУПРЕЖДЕНИЕ: {e}")
    
    print(f"\n=== РЕЗУЛЬТАТ ===")
    if all_ok:
        print("🎉 Все библиотеки работают корректно!")
    else:
        print("❌ Некоторые библиотеки не установлены или не работают")
    
    return all_ok

def test_individual_libraries():
    """Детальное тестирование каждой библиотеки"""
    print("\n=== ДЕТАЛЬНОЕ ТЕСТИРОВАНИЕ ===\n")
    
    # Тест requests
    try:
        import requests
        print("�� Тестируем requests...")
        response = requests.get('https://httpbin.org/get', timeout=5)
        if response.status_code == 200:
            print("✅ requests работает корректно")
        else:
            print("⚠️ requests работает, но получил неожиданный статус")
    except Exception as e:
        print(f"❌ requests не работает: {e}")
    
    # Тест BeautifulSoup
    try:
        from bs4 import BeautifulSoup
        print("🔍 Тестируем BeautifulSoup...")
        html = "<html><body><h1>Test</h1></body></html>"
        soup = BeautifulSoup(html, 'html.parser')
        if soup.find('h1').text == 'Test':
            print("✅ BeautifulSoup работает корректно")
        else:
            print("⚠️ BeautifulSoup работает, но парсинг не корректен")
    except Exception as e:
        print(f"❌ BeautifulSoup не работает: {e}")
    
    # Тест psycopg2
    try:
        import psycopg2
        print("�� Тестируем psycopg2...")
        print("✅ psycopg2 импортируется успешно")
        print("   (Подключение к БД будет протестировано отдельно)")
    except Exception as e:
        print(f"❌ psycopg2 не работает: {e}")
    
    # Тест json
    try:
        import json
        print("🔍 Тестируем json...")
        test_data = {"test": "data", "number": 123}
        json_str = json.dumps(test_data)
        parsed_data = json.loads(json_str)
        if parsed_data == test_data:
            print("✅ json работает корректно")
        else:
            print("⚠️ json работает, но сериализация/десериализация не корректы")
    except Exception as e:
        print(f"❌ json не работает: {e}")

def test_parser_class():
    """Тестирование класса парсера"""
    print("\n=== ТЕСТИРОВАНИЕ КЛАССА ПАРСЕРА ===\n")
    
    try:
        from bim_family_parser import BIMFamilyParser
        print("🔍 Создаем экземпляр парсера...")
        parser = BIMFamilyParser()
        print("✅ Класс BIMFamilyParser создан успешно")
        
        print(f"🔍 Количество категорий: {len(parser.categories)}")
        print(f"�� Количество брендов: {len(parser.brands)}")
        
        # Тест метода get_page_content
        print("🔍 Тестируем метод get_page_content...")
        test_url = "https://httpbin.org/html"
        content = parser.get_page_content(test_url)
        if content and "html" in content.lower():
            print("✅ Метод get_page_content работает корректно")
        else:
            print("⚠️ Метод get_page_content работает, но возвращает неожиданный контент")
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании парсера: {e}")

def main():
    """Основная функция тестирования"""
    print("�� НАЧИНАЕМ ТЕСТИРОВАНИЕ БИБЛИОТЕК\n")
    
    # Базовое тестирование
    basic_test = test_libraries()
    
    if basic_test:
        # Детальное тестирование
        test_individual_libraries()
        
        # Тестирование парсера
        test_parser_class()
        
        print("\n�� ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ!")
        print("Теперь можно запускать основной парсер:")
        print("python bim_family_parser.py")
    else:
        print("\n❌ Сначала исправьте проблемы с библиотеками!")
        print("Попробуйте переустановить:")
        print("pip install requests beautifulsoup4 psycopg2-binary")

if __name__ == "__main__":
    main()