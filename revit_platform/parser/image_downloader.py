# revit_platform/parser/image_downloader.py
import requests
import os
import logging
from urllib.parse import urlparse
import json
from pathlib import Path

class ImageDownloader:
    def __init__(self, download_dir="downloaded_images"):
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(exist_ok=True)
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def download_family_images(self, json_file_path, family_name=None):
        """Скачивание изображений для семейства из JSON файла"""
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if isinstance(data, list):
                families = data
            else:
                families = [data]
            
            for family in families:
                family_name = family.get('name', 'unknown_family')
                family_id = family.get('external_id', 'unknown_id')
                
                # Создаем папку для семейства
                family_dir = self.download_dir / f"{family_id}_{family_name[:30]}"
                family_dir.mkdir(exist_ok=True)
                
                self.logger.info(f"📁 Скачиваем изображения для: {family_name}")
                
                images = family.get('images', [])
                if images:
                    downloaded_count = 0
                    for i, img in enumerate(images, 1):
                        if self.download_single_image(img, family_dir, i):
                            downloaded_count += 1
                    
                    self.logger.info(f"✅ Скачано {downloaded_count}/{len(images)} изображений")
                else:
                    self.logger.warning(f"⚠️ Изображения не найдены для {family_name}")
                
        except Exception as e:
            self.logger.error(f"❌ Ошибка при скачивании: {e}")
    
    def download_single_image(self, img_data, family_dir, index):
        """Скачивание одного изображения"""
        try:
            url = img_data.get('url')
            if not url:
                return False
            
            # Получаем расширение файла
            parsed_url = urlparse(url)
            filename = parsed_url.path.split('/')[-1]
            
            # Если нет расширения, определяем по типу
            if '.' not in filename:
                content_type = img_data.get('content_type', 'image/jpeg')
                if 'png' in content_type:
                    ext = '.png'
                elif 'gif' in content_type:
                    ext = '.gif'
                elif 'webp' in content_type:
                    ext = '.webp'
                else:
                    ext = '.jpg'
                filename = f"image_{index}{ext}"
            else:
                # Очищаем имя файла
                filename = f"image_{index}_{filename}"
            
            # Полный путь для сохранения
            file_path = family_dir / filename
            
            # Скачиваем изображение
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            # Сохраняем файл
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            # Обновляем данные об изображении
            img_data['local_path'] = str(file_path)
            img_data['file_size'] = len(response.content)
            img_data['downloaded'] = True
            
            self.logger.info(f"  ✅ Скачано: {filename}")
            return True
            
        except Exception as e:
            self.logger.error(f"  ❌ Ошибка скачивания {url}: {e}")
            return False
    
    def update_json_with_local_paths(self, json_file_path, output_file_path=None):
        """Обновление JSON с локальными путями к изображениям"""
        if output_file_path is None:
            output_file_path = json_file_path.replace('.json', '_with_local_paths.json')
        
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Сохраняем обновленные данные
            with open(output_file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"✅ JSON обновлен: {output_file_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Ошибка обновления JSON: {e}")
            return False

def main():
    """Тестирование скачивания изображений"""
    downloader = ImageDownloader()
    
    # Скачиваем изображения из тестового JSON
    json_file = "bim_family_combined_test.json"
    
    if os.path.exists(json_file):
        downloader.logger.info(f"🔍 Начинаем скачивание изображений из {json_file}")
        downloader.download_family_images(json_file)
        
        # Обновляем JSON с локальными путями
        downloader.update_json_with_local_paths(json_file)
        
        downloader.logger.info("✅ Скачивание завершено!")
    else:
        downloader.logger.error(f"❌ Файл {json_file} не найден!")

if __name__ == "__main__":
    main()