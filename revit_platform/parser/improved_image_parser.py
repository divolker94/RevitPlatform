# revit_platform/parser/improved_image_parser.py
import requests
from bs4 import BeautifulSoup
import json
import logging
import re
import time

class ImprovedImageParser:
    def __init__(self):
        self.base_url = "https://bimlib.pro"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
        })
    
    def extract_real_images(self, soup):
        """Улучшенное извлечение реальных изображений"""
        real_images = []
        
        # Метод 1: Ищем изображения в data-src (lazy loading)
        lazy_imgs = soup.find_all('img', attrs={'data-src': True})
        for img in lazy_imgs:
            src = img.get('data-src')
            if src and self.is_real_image(src):
                real_images.append({
                    'url': self.normalize_url(src),
                    'alt': img.get('alt', ''),
                    'title': img.get('title', ''),
                    'type': 'lazy_loaded'
                })
        
        # Метод 2: Ищем изображения в src с фильтрацией
        all_imgs = soup.find_all('img')
        for img in all_imgs:
            src = img.get('src')
            if src and self.is_real_image(src):
                real_images.append({
                    'url': self.normalize_url(src),
                    'alt': img.get('alt', ''),
                    'title': img.get('title', ''),
                    'type': 'direct'
                })
        
        # Метод 3: Ищем изображения в background-image CSS
        elements_with_bg = soup.find_all(style=re.compile(r'background-image'))
        for elem in elements_with_bg:
            style = elem.get('style', '')
            bg_match = re.search(r'background-image:\s*url\(["\']?([^"\']+)["\']?\)', style)
            if bg_match:
                src = bg_match.group(1)
                if self.is_real_image(src):
                    real_images.append({
                        'url': self.normalize_url(src),
                        'alt': 'Background image',
                        'title': 'Background image',
                        'type': 'css_background'
                    })
        
        # Метод 4: Ищем скрытые изображения в JSON данных
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string and 'image' in script.string.lower():
                # Ищем JSON с изображениями
                json_match = re.search(r'\{[^}]*"image"[^}]*\}', script.string)
                if json_match:
                    try:
                        data = json.loads(json_match.group(0))
                        if 'image' in data:
                            src = data['image']
                            if self.is_real_image(src):
                                real_images.append({
                                    'url': self.normalize_url(src),
                                    'alt': 'JSON image',
                                    'title': 'JSON image',
                                    'type': 'json_data'
                                })
                    except:
                        pass
        
        return real_images
    
    def is_real_image(self, src):
        """Проверка, является ли src реальным изображением"""
        # Исключаем служебные изображения
        exclude_patterns = [
            'data:image/svg',  # SVG иконки
            'placeholder',      # Заглушки
            'icon',            # Иконки
            'button',          # Кнопки
            'arrow',           # Стрелки
            'logo',            # Логотипы
            'avatar'           # Аватары
        ]
        
        src_lower = src.lower()
        for pattern in exclude_patterns:
            if pattern in src_lower:
                return False
        
        # Проверяем расширения изображений
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
        has_image_ext = any(ext in src_lower for ext in image_extensions)
        
        # Проверяем размер (исключаем слишком маленькие)
        if 'data:image' in src_lower:
            return False
        
        return has_image_ext or ('/images/' in src_lower) or ('/uploads/' in src_lower)
    
    def normalize_url(self, src):
        """Нормализация URL изображения"""
        if src.startswith('http'):
            return src
        elif src.startswith('//'):
            return 'https:' + src
        else:
            return self.base_url + src
    
    def try_alternative_image_sources(self, url):
        """Попытка найти изображения через альтернативные источники"""
        try:
            # Пробуем получить страницу с другими заголовками
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
            
            response = self.session.get(url, headers=headers, timeout=30)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                return self.extract_real_images(soup)
                
        except Exception as e:
            logging.warning(f"Не удалось получить альтернативные изображения: {e}")
        
        return []

def main():
    """Тест улучшенного парсера изображений"""
    parser = ImprovedImageParser()
    
    # Тестируем на водосточной системе
    test_url = "https://bimlib.pro/model/vodostochnaya-sistema-revit/45719/"
    
    try:
        response = parser.session.get(test_url, timeout=30)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        real_images = parser.extract_real_images(soup)
        
        print(f"=== РЕЗУЛЬТАТЫ УЛУЧШЕННОГО ПАРСЕРА ===")
        print(f"Найдено реальных изображений: {len(real_images)}")
        
        for i, img in enumerate(real_images, 1):
            print(f"{i}. {img['url']}")
            print(f"   Тип: {img['type']}")
            print(f"   Alt: {img['alt']}")
            print()
        
        if not real_images:
            print("⚠️ Реальные изображения не найдены!")
            print("Возможные причины:")
            print("- Изображения загружаются через JavaScript")
            print("- Используется lazy loading")
            print("- Изображения в iframe или через API")
            print("- Сайт блокирует парсинг изображений")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    main()