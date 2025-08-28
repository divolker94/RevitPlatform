import psycopg2
import traceback

try:
    print("Попытка подключения к базе данных...")
    print("Параметры подключения:")
    print("dbname: revit_platform")
    print("user: postgres")
    print("host: localhost")
    print("port: 5432")
    
    conn = psycopg2.connect(
        dbname="revit_platform",
        user="postgres",
        password="23031994",
        host="localhost",
        port="5432"
    )
    print("Успешное подключение к базе данных!")
    
    # Пробуем получить список таблиц
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    tables = cur.fetchall()
    print("\nСписок таблиц в базе данных:")
    for table in tables:
        print(table[0])
    
    cur.close()
    conn.close()
    
except Exception as e:
    print("Ошибка при подключении к базе данных:")
    print(str(e))
    print("\nПолный стек ошибки:")
    traceback.print_exc() 