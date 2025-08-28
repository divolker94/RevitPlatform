# revit_platform/parser/test_drainage_parser.py
import requests
from bs4 import BeautifulSoup
import json
import logging
import re

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestDrainageParser:
    def __init__(self):
        self.base_url = "https://bimlib.pro"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def parse_drainage_page(self, url):
        """Парсинг страницы водосточной системы"""
        try:
            logger.info(f"Парсим страницу: {url}")
            
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Извлекаем данные
            family_data = {
                'url': url,
                'external_id': self.extract_external_id(url),
                'name': self.extract_name(soup),
                'catalog_items': self.extract_catalog_items(soup),
                'technical_specs': self.extract_technical_specs(soup),
                'images': self.extract_images(soup),
                'description': self.extract_description(soup)
            }
            
            return family_data
            
        except Exception as e:
            logger.error(f"Ошибка при парсинге страницы {url}: {e}")
            return None
    
    def extract_external_id(self, url):
        """Извлечение ID из URL"""
        match = re.search(r'/model/.*?/(\d+)/?', url)
        return match.group(1) if match else None
    
    def extract_name(self, soup):
        """Извлечение названия"""
        # Ищем заголовок страницы
        title = soup.find('h1')
        if title:
            return title.get_text(strip=True)
        
        # Альтернативный поиск
        title = soup.find('title')
        if title:
            title_text = title.get_text(strip=True)
            # Убираем лишние части из заголовка
            if ' - ' in title_text:
                return title_text.split(' - ')[0]
            return title_text
        
        return "Неизвестное семейство"
    
    def extract_catalog_items(self, soup):
        """Извлечение элементов каталога"""
        catalog_items = []
        
        # Ищем секцию с каталогом комплектации
        catalog_section = soup.find(string=re.compile(r'Каталог комплектации'))
        if catalog_section:
            # Ищем родительский элемент
            parent = catalog_section.parent
            if parent:
                # Ищем список элементов
                ul = parent.find_next('ul')
                if ul:
                    items = ul.find_all('li')
                    for item in items:
                        text = item.get_text(strip=True)
                        if text:
                            catalog_items.append(text)
        
        # Альтернативный поиск по классам
        if not catalog_items:
            catalog_lists = soup.find_all('ul')
            for ul in catalog_lists:
                items = ul.find_all('li')
                for item in items:
                    text = item.get_text(strip=True)
                    # Проверяем, что это похоже на элемент каталога
                    if text and any(keyword in text.lower() for keyword in ['воронка', 'желоб', 'аэратор', 'водосточн']):
                        catalog_items.append(text)
        
        return catalog_items
    
    def extract_technical_specs(self, soup):
        """Извлечение технических характеристик"""
        specs = {}
        
        # Ищем секцию технических характеристик
        tech_section = soup.find(string=re.compile(r'Технические характеристики'))
        if tech_section:
            parent = tech_section.parent
            if parent:
                # Ищем список характеристик
                ul = parent.find_next('ul')
                if ul:
                    items = ul.find_all('li')
                    for item in items:
                        text = item.get_text(strip=True)
                        if ':' in text:
                            key, value = text.split(':', 1)
                            specs[key.strip()] = value.strip()
        
        # Альтернативный поиск по всему тексту
        if not specs:
            all_text = soup.get_text()
            lines = all_text.split('\n')
            for line in lines:
                line = line.strip()
                if ':' in line and any(keyword in line.lower() for keyword in ['категория', 'тип', 'класс', 'материалы']):
                    if ':' in line:
                        key, value = line.split(':', 1)
                        specs[key.strip()] = value.strip()
        
        return specs
    
    def extract_images(self, soup):
        """Извлечение изображений - улучшенная версия"""
        images = []
        
        # Метод 1: Ищем изображения в slider-block
        slider_block = soup.find('div', class_='slider-block')
        if slider_block:
            imgs = slider_block.find_all('img')
            for img in imgs:
                src = img.get('src')
                if src:
                    if src.startswith('http'):
                        full_src = src
                    else:
                        full_src = self.base_url + src
                    
                    images.append({
                        'url': full_src,
                        'alt': img.get('alt', ''),
                        'title': img.get('title', '')
                    })
        
        # Метод 2: Ищем изображения по data-src (lazy loading)
        if not images:
            lazy_imgs = soup.find_all('img', attrs={'data-src': True})
            for img in lazy_imgs:
                src = img.get('data-src')
                if src:
                    if src.startswith('http'):
                        full_src = src
                    else:
                        full_src = self.base_url + src
                    
                    images.append({
                        'url': full_src,
                        'alt': img.get('alt', ''),
                        'title': img.get('title', ''),
                        'type': 'lazy_loaded'
                    })
        
        # Метод 3: Ищем изображения в swiper-container
        if not images:
            swiper_container = soup.find('div', class_='swiper-container')
            if swiper_container:
                imgs = swiper_container.find_all('img')
                for img in imgs:
                    src = img.get('src') or img.get('data-src')
                    if src:
                        if src.startswith('http'):
                            full_src = src
                        else:
                            full_src = self.base_url + src
                        
                        images.append({
                            'url': full_src,
                            'alt': img.get('alt', ''),
                            'title': img.get('title', ''),
                            'type': 'swiper'
                        })
        
        # Метод 4: Ищем все изображения на странице
        if not images:
            all_imgs = soup.find_all('img')
            for img in all_imgs:
                src = img.get('src') or img.get('data-src')
                if src and any(keyword in src.lower() for keyword in ['drainage', 'vodostoch', 'gutter', 'model', 'product']):
                    if src.startswith('http'):
                        full_src = src
                    else:
                        full_src = self.base_url + src
                    
                    images.append({
                        'url': full_src,
                        'alt': img.get('alt', ''),
                        'title': img.get('title', ''),
                        'type': 'general'
                    })
        
        # Метод 5: Ищем изображения в background-image CSS
        if not images:
            elements_with_bg = soup.find_all(style=re.compile(r'background-image'))
            for elem in elements_with_bg:
                style = elem.get('style', '')
                bg_match = re.search(r'background-image:\s*url\(["\']?([^"\']+)["\']?\)', style)
                if bg_match:
                    src = bg_match.group(1)
                    if src.startswith('http'):
                        full_src = src
                    else:
                        full_src = self.base_url + src
                    
                    images.append({
                        'url': full_src,
                        'alt': 'Background image',
                        'title': 'Background image',
                        'type': 'css_background'
                    })
        
        logger.info(f"Найдено изображений: {len(images)}")
        return images
    
    def extract_description(self, soup):
        """Извлечение описания"""
        description = ""
        
        # Ищем описание в description-block
        desc_block = soup.find('div', class_='description-block')
        if desc_block:
            paragraphs = desc_block.find_all('p')
            for p in paragraphs:
                text = p.get_text(strip=True)
                if text and len(text) > 20:  # Только значимые абзацы
                    description += text + "\n"
        
        # Если не нашли, ищем в meta description
        if not description:
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc and meta_desc.get('content'):
                description = meta_desc['content']
        
        return description.strip()
    
    def save_to_json(self, data, filename='drainage_test.json'):
        """Сохранение результатов в JSON"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Результаты сохранены в файл: {filename}")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка при сохранении: {e}")
            return False

def main():
    """Тестовый парсинг водосточной системы"""
    parser = TestDrainageParser()
    
    # URL водосточной системы с скриншота
    test_url = "https://bimlib.pro/model/vodostochnaya-sistema-revit/45719/"
    
    logger.info("Начинаем тестовый парсинг водосточной системы...")
    
    try:
        # Парсим страницу
        family_data = parser.parse_drainage_page(test_url)
        
        if family_data:
            logger.info("=== РЕЗУЛЬТАТЫ ПАРСИНГА ===")
            logger.info(f"Название: {family_data['name']}")
            logger.info(f"ID: {family_data['external_id']}")
            logger.info(f"URL: {family_data['url']}")
            
            if family_data['catalog_items']:
                logger.info(f"Элементы каталога ({len(family_data['catalog_items'])}):")
                for item in family_data['catalog_items']:
                    logger.info(f"  - {item}")
            
            if family_data['technical_specs']:
                logger.info("Технические характеристики:")
                for key, value in family_data['technical_specs'].items():
                    logger.info(f"  {key}: {value}")
            
            if family_data['images']:
                logger.info(f"Изображения ({len(family_data['images'])}):")
                for img in family_data['images']:
                    logger.info(f"  - {img['url']} (тип: {img.get('type', 'unknown')})")
            else:
                logger.warning("⚠️ Изображения не найдены!")
            
            if family_data['description']:
                logger.info(f"Описание: {family_data['description'][:200]}...")
            
            # Сохраняем в JSON
            parser.save_to_json(family_data, 'drainage_test.json')
            
            logger.info("\n✅ Парсинг завершен успешно!")
            
        else:
            logger.error("❌ Не удалось спарсить данные")
            
    except Exception as e:
        logger.error(f"❌ Критическая ошибка: {e}")

if __name__ == "__main__":
    main()