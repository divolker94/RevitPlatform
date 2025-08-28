# revit_platform/parser/load_to_postgres.py
import psycopg2
import json
import logging
from pathlib import Path

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Конфигурация базы данных
db_config = {
    'host': 'localhost',
    'database': 'revit_platform_2',
    'user': 'postgres',
    'password': '23031994',
    'options': {'client_encoding': 'UTF8'}
}

def load_data_to_postgres():
    """Загрузка данных в PostgreSQL"""
    try:
        # Подключаемся к базе
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        logger.info("✅ Подключение к PostgreSQL установлено")
        
        # Читаем JSON файл с данными
        json_file = Path('bim_families_complete.json')
        if not json_file.exists():
            logger.error("❌ Файл bim_families_complete.json не найден!")
            return
        
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        logger.info(f"📁 Загружено {len(data)} семейств из JSON")
        
        # Загружаем данные через функцию
        cursor.execute("SELECT load_bim_families_from_json(%s)", (json.dumps(data),))
        result = cursor.fetchone()
        
        if result:
            logger.info(f"✅ Загружено {result[0]} семейств в базу данных")
        
        # Коммитим изменения
        conn.commit()
        
        # Проверяем результат
        cursor.execute("SELECT COUNT(*) FROM families_bimfamily")
        families_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM family_images")
        images_count = cursor.fetchone()[0]
        
        logger.info(f"📊 В базе данных:")
        logger.info(f"  Семейств: {families_count}")
        logger.info(f"  Изображений: {images_count}")
        
        # Показываем несколько примеров
        cursor.execute("""
            SELECT name, external_id, total_images, downloaded_images 
            FROM families_bimfamily 
            LIMIT 5
        """)
        
        logger.info("\n📋 Примеры загруженных семейств:")
        for row in cursor.fetchall():
            logger.info(f"  {row[0]} (ID: {row[1]}, Изображений: {row[2]}/{row[3]})")
        
    except Exception as e:
        logger.error(f"❌ Ошибка при загрузке данных: {e}")
        if 'conn' in locals():
            conn.rollback()
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
            logger.info("�� Соединение с базой данных закрыто")

if __name__ == "__main__":
    load_data_to_postgres()