# revit_platform/parser/combined_bim_parser.py
import requests
from bs4 import BeautifulSoup
import json
import logging
import re
import time
from urllib.parse import urljoin
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CombinedBIMParser:
    def __init__(self, use_selenium=True):
        self.base_url = "https://bimlib.pro"
        self.use_selenium = use_selenium
        
        # Настройка requests сессии
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        
        # Настройка Selenium
        self.driver = None
        if self.use_selenium:
            self.setup_selenium()
    
    def setup_selenium(self):
        """Настройка Selenium WebDriver"""
        try:
            chrome_options = Options()
            chrome_options.add_argument('--headless')  # Запуск в фоновом режиме
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            
            self.driver = webdriver.Chrome(options=chrome_options)
            logger.info("✅ Selenium WebDriver успешно настроен")
            
        except Exception as e:
            logger.error(f"❌ Ошибка настройки Selenium: {e}")
            self.use_selenium = False
    
    def close_selenium(self):
        """Закрытие Selenium WebDriver"""
        if self.driver:
            self.driver.quit()
            logger.info("Selenium WebDriver закрыт")
    
    def parse_family_page(self, url):
        """Парсинг страницы BIM семейства с комбинированным подходом"""
        try:
            logger.info(f"Парсим страницу: {url}")
            
            # Шаг 1: Парсинг текстовых данных через BeautifulSoup
            text_data = self.parse_text_content(url)
            
            # Шаг 2: Парсинг изображений через Selenium (если доступен)
            image_data = []
            if self.use_selenium and self.driver:
                image_data = self.parse_images_with_selenium(url)
            else:
                image_data = self.parse_images_with_beautifulsoup(url)
            
            # Шаг 3: Объединение данных
            combined_data = self.combine_data(text_data, image_data, url)
            
            return combined_data
            
        except Exception as e:
            logger.error(f"Ошибка при парсинге страницы {url}: {e}")
            return None
    
    def parse_text_content(self, url):
        """Парсинг текстового контента через BeautifulSoup"""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            text_data = {
                'url': url,
                'external_id': self.extract_external_id(url),
                'name': self.extract_name(soup),
                'catalog_items': self.extract_catalog_items(soup),
                'technical_specs': self.extract_technical_specs(soup),
                'basic_specs': self.extract_basic_specs(soup),
                'description': self.extract_description(soup),
                'company': self.extract_company(soup),
                'download_info': self.extract_download_info(soup)
            }
            
            logger.info(f"✅ Текстовые данные извлечены: {text_data['name']}")
            return text_data
            
        except Exception as e:
            logger.error(f"Ошибка при парсинге текста: {e}")
            return {}
    
    def parse_images_with_selenium(self, url):
        """Парсинг изображений через Selenium"""
        try:
            logger.info("�� Загружаем страницу через Selenium...")
            
            self.driver.get(url)
            
            # Ждем загрузки страницы
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Дополнительное ожидание для загрузки изображений
            time.sleep(3)
            
            # Ищем изображения
            images = []
            
            # Метод 1: Ищем изображения в slider-block
            try:
                slider_elements = self.driver.find_elements(By.CLASS_NAME, "slider-block")
                for slider in slider_elements:
                    imgs = slider.find_elements(By.TAG_NAME, "img")
                    for img in imgs:
                        src = img.get_attribute('src') or img.get_attribute('data-src')
                        if src and self.is_real_image(src):
                            images.append({
                                'url': self.normalize_url(src),
                                'alt': img.get_attribute('alt') or '',
                                'title': img.get_attribute('title') or '',
                                'type': 'slider_selenium',
                                'width': img.get_attribute('width'),
                                'height': img.get_attribute('height')
                            })
            except Exception as e:
                logger.warning(f"Ошибка при поиске в slider-block: {e}")
            
            # Метод 2: Ищем все изображения на странице
            try:
                all_imgs = self.driver.find_elements(By.TAG_NAME, "img")
                for img in all_imgs:
                    src = img.get_attribute('src') or img.get_attribute('data-src')
                    if src and self.is_real_image(src):
                        # Проверяем, не дублируем ли уже
                        if not any(existing['url'] == self.normalize_url(src) for existing in images):
                            images.append({
                                'url': self.normalize_url(src),
                                'alt': img.get_attribute('alt') or '',
                                'title': img.get_attribute('title') or '',
                                'type': 'general_selenium',
                                'width': img.get_attribute('width'),
                                'height': img.get_attribute('height')
                            })
            except Exception as e:
                logger.warning(f"Ошибка при поиске всех изображений: {e}")
            
            # Метод 3: Ищем изображения в background-image
            try:
                elements_with_bg = self.driver.find_elements(By.CSS_SELECTOR, "[style*='background-image']")
                for elem in elements_with_bg:
                    style = elem.get_attribute('style')
                    if style and 'background-image' in style:
                        bg_match = re.search(r'background-image:\s*url\(["\']?([^"\']+)["\']?\)', style)
                        if bg_match:
                            src = bg_match.group(1)
                            if self.is_real_image(src):
                                images.append({
                                    'url': self.normalize_url(src),
                                    'alt': 'Background image',
                                    'title': 'Background image',
                                    'type': 'css_background_selenium'
                                })
            except Exception as e:
                logger.warning(f"Ошибка при поиске background-image: {e}")
            
            logger.info(f"✅ Selenium нашел {len(images)} изображений")
            return images
            
        except Exception as e:
            logger.error(f"Ошибка при парсинге изображений через Selenium: {e}")
            return []
    
    def parse_images_with_beautifulsoup(self, url):
        """Парсинг изображений через BeautifulSoup (fallback)"""
        try:
            response = self.session.get(url, timeout=30)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            images = []
            
            # Ищем изображения различными способами
            all_imgs = soup.find_all('img')
            for img in all_imgs:
                src = img.get('src') or img.get('data-src')
                if src and self.is_real_image(src):
                    images.append({
                        'url': self.normalize_url(src),
                        'alt': img.get('alt', ''),
                        'title': img.get('title', ''),
                        'type': 'beautifulsoup_fallback'
                    })
            
            logger.info(f"✅ BeautifulSoup нашел {len(images)} изображений")
            return images
            
        except Exception as e:
            logger.error(f"Ошибка при парсинге изображений через BeautifulSoup: {e}")
            return []
    
    def combine_data(self, text_data, image_data, url):
        """Объединение текстовых данных и изображений"""
        combined = text_data.copy()
        combined['images'] = image_data
        combined['parsing_method'] = 'combined'
        combined['selenium_used'] = self.use_selenium and bool(image_data)
        
        # Добавляем метаданные
        combined['parsed_at'] = time.strftime('%Y-%m-%d %H:%M:%S')
        combined['total_images'] = len(image_data)
        
        logger.info(f"✅ Данные объединены: {len(image_data)} изображений + текст")
        return combined
    
    def is_real_image(self, src):
        """Проверка, является ли src реальным изображением"""
        if not src:
            return False
        
        # Исключаем служебные изображения
        exclude_patterns = [
            'data:image/svg',
            'placeholder',
            'icon',
            'button',
            'arrow',
            'logo',
            'avatar',
            'spinner',
            'loading'
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
        
        return has_image_ext or ('/images/' in src_lower) or ('/uploads/' in src_lower) or ('/models/' in src_lower)
    
    def normalize_url(self, src):
        """Нормализация URL изображения"""
        if src.startswith('http'):
            return src
        elif src.startswith('//'):
            return 'https:' + src
        else:
            return self.base_url + src
    
    # Методы извлечения текстовых данных (аналогично предыдущему парсеру)
    def extract_external_id(self, url):
        match = re.search(r'/model/.*?/(\d+)/?', url)
        return match.group(1) if match else None
    
    def extract_name(self, soup):
        title = soup.find('h1')
        if title:
            return title.get_text(strip=True)
        
        title = soup.find('title')
        if title:
            title_text = title.get_text(strip=True)
            if ' - ' in title_text:
                return title_text.split(' - ')[0]
            return title_text
        
        return "Неизвестное семейство"
    
    def extract_catalog_items(self, soup):
        catalog_items = []
        
        catalog_section = soup.find(string=re.compile(r'Каталог.*включается в себя следующие категории семейств'))
        if catalog_section:
            parent = catalog_section.parent
            if parent:
                ul = parent.find_next('ul')
                if ul:
                    items = ul.find_all('li')
                    for item in items:
                        text = item.get_text(strip=True)
                        if text:
                            catalog_items.append(text)
        
        return catalog_items
    
    def extract_technical_specs(self, soup):
        specs = {}
        
        tech_section = soup.find(string=re.compile(r'Технические характеристики'))
        if tech_section:
            parent = tech_section.parent
            if parent:
                ul = parent.find_next('ul')
                if ul:
                    items = ul.find_all('li')
                    for item in items:
                        text = item.get_text(strip=True)
                        if ':' in text:
                            key, value = text.split(':', 1)
                            specs[key.strip()] = value.strip()
        
        return specs
    
    def extract_basic_specs(self, soup):
        specs = {}
        
        basic_section = soup.find(string=re.compile(r'Основные характеристики'))
        if basic_section:
            parent = basic_section.parent
            if parent:
                ul = parent.find_next('ul')
                if ul:
                    items = ul.find_all('li')
                    for item in items:
                        text = item.get_text(strip=True)
                        if ':' in text:
                            key, value = text.split(':', 1)
                            specs[key.strip()] = value.strip()
        
        return specs
    
    def extract_description(self, soup):
        description = ""
        
        desc_block = soup.find('div', class_='description-block')
        if desc_block:
            paragraphs = desc_block.find_all('p')
            for p in paragraphs:
                text = p.get_text(strip=True)
                if text and len(text) > 20:
                    description += text + "\n"
        
        if not description:
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc and meta_desc.get('content'):
                description = meta_desc['content']
        
        return description.strip()
    
    def extract_company(self, soup):
        company_info = {}
        
        company_elem = soup.find('div', class_='company-name') or soup.find(string=re.compile(r'ТЕХНОНИКОЛЬ|VEKA|NEWTEC'))
        if company_elem:
            if hasattr(company_elem, 'get_text'):
                company_info['name'] = company_elem.get_text(strip=True)
            else:
                company_info['name'] = str(company_elem).strip()
        
        phone_elem = soup.find(string=re.compile(r'\d{1,3}[-\(\)\s]+\d{3}[-\(\)\s]+\d{2}[-\(\)\s]+\d{2}'))
        if phone_elem:
            company_info['phone'] = phone_elem.strip()
        
        email_elem = soup.find(string=re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'))
        if email_elem:
            company_info['email'] = email_elem.strip()
        
        return company_info
    
    def extract_download_info(self, soup):
        download_info = {}
        
        download_links = soup.find_all('a', href=re.compile(r'\.pdf|\.rfa|\.rvt'))
        if download_links:
            download_info['files'] = []
            for link in download_links:
                href = link.get('href')
                text = link.get_text(strip=True)
                if href:
                    download_info['files'].append({
                        'url': urljoin(self.base_url, href),
                        'name': text or href.split('/')[-1]
                    })
        
        return download_info
    
    def parse_multiple_families(self, urls):
        """Парсинг нескольких семейств"""
        all_families = []
        
        for i, url in enumerate(urls):
            logger.info(f"\n--- Парсинг {i+1}/{len(urls)}: {url} ---")
            
            try:
                family_data = self.parse_family_page(url)
                if family_data:
                    all_families.append(family_data)
                    logger.info(f"✅ Успешно спарсено: {family_data['name']}")
                    logger.info(f"   Изображений: {len(family_data.get('images', []))}")
                else:
                    logger.warning(f"⚠️ Не удалось спарсить: {url}")
                
                # Добавляем задержку между запросами
                if i < len(urls) - 1:
                    time.sleep(3)
                    
            except Exception as e:
                logger.error(f"❌ Ошибка при парсинге {url}: {e}")
                continue
        
        return all_families
    
    def save_to_json(self, data, filename='bim_families_combined.json'):
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
    """Основная функция для тестирования комбинированного парсера"""
    parser = CombinedBIMParser(use_selenium=True)
    
    try:
        # Тестируем на одном URL
        test_url = "https://bimlib.pro/model/vodostochnaya-sistema-revit/45719/"
        
        logger.info("🔍 Тестируем комбинированный парсер...")
        
        family_data = parser.parse_family_page(test_url)
        
        if family_data:
            logger.info("=== РЕЗУЛЬТАТЫ КОМБИНИРОВАННОГО ПАРСЕРА ===")
            logger.info(f"Название: {family_data['name']}")
            logger.info(f"ID: {family_data['external_id']}")
            logger.info(f"URL: {family_data['url']}")
            logger.info(f"Метод парсинга: {family_data['parsing_method']}")
            logger.info(f"Selenium использовался: {family_data['selenium_used']}")
            
            if family_data.get('catalog_items'):
                logger.info(f"Элементы каталога ({len(family_data['catalog_items'])}):")
                for item in family_data['catalog_items'][:3]:  # Показываем первые 3
                    logger.info(f"  - {item}")
            
            if family_data.get('technical_specs'):
                logger.info("Технические характеристики:")
                for key, value in family_data['technical_specs'].items():
                    logger.info(f"  {key}: {value}")
            
            if family_data.get('images'):
                logger.info(f"Изображения ({len(family_data['images'])}):")
                for i, img in enumerate(family_data['images'][:5], 1):  # Показываем первые 5
                    logger.info(f"  {i}. {img['url']}")
                    logger.info(f"     Тип: {img['type']}")
                    if img.get('width') and img.get('height'):
                        logger.info(f"     Размер: {img['width']}x{img['height']}")
            else:
                logger.warning("⚠️ Изображения не найдены!")
            
            # Сохраняем в JSON
            parser.save_to_json([family_data], 'bim_family_combined_test.json')
            
            logger.info("\n✅ Комбинированный парсинг завершен успешно!")
            
        else:
            logger.error("❌ Не удалось спарсить данные")
            
    except Exception as e:
        logger.error(f"❌ Критическая ошибка: {e}")
    
    finally:
        parser.close_selenium()

if __name__ == "__main__":
    main()