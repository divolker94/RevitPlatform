# revit_platform/parser/universal_bim_parser_complete.py
import requests
from bs4 import BeautifulSoup
import json
import logging
import re
import time
from urllib.parse import urljoin, urlparse  # Добавляем urlparse
import os
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UniversalBIMParserComplete:
    def __init__(self, download_images=True, images_dir="downloaded_images"):
        self.base_url = "https://bimlib.pro"
        self.download_images = download_images
        self.images_dir = Path(images_dir)
        self.images_dir.mkdir(exist_ok=True)
        
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
        self.setup_selenium()
    
    def setup_selenium(self):
        """Настройка Selenium WebDriver"""
        try:
            chrome_options = Options()
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            
            self.driver = webdriver.Chrome(options=chrome_options)
            logger.info("✅ Selenium WebDriver успешно настроен")
            
        except Exception as e:
            logger.error(f"❌ Ошибка настройки Selenium: {e}")
            self.driver = None
    
    def close_selenium(self):
        """Закрытие Selenium WebDriver"""
        try:
            if self.driver:
                self.driver.quit()
                logger.info("Selenium WebDriver закрыт")
        except Exception as e:
            logger.warning(f"Предупреждение при закрытии Selenium: {e}")
    
    def parse_family_page(self, url):
        """Парсинг страницы BIM семейства"""
        try:
            logger.info(f"Парсим страницу: {url}")
            
            # Шаг 1: Парсинг текстовых данных через BeautifulSoup
            text_data = self.parse_text_content(url)
            
            # Шаг 2: Парсинг и скачивание изображений через Selenium
            image_data = []
            if self.driver and self.download_images:
                image_data = self.parse_and_download_images_with_selenium(url, text_data)
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
    
    def parse_and_download_images_with_selenium(self, url, text_data):
        """Парсинг и скачивание изображений через Selenium"""
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
            
            # Скачиваем изображения
            if images:
                downloaded_images = self.download_images_to_local(images, text_data)
                return downloaded_images
            
            return images
            
        except Exception as e:
            logger.error(f"Ошибка при парсинге изображений через Selenium: {e}")
            return []
    
    def download_images_to_local(self, images, text_data):
        """Скачивание изображений в локальную папку"""
        try:
            family_name = text_data.get('name', 'unknown_family')
            family_id = text_data.get('external_id', 'unknown_id')
            
            # Создаем папку для семейства
            family_dir = self.images_dir / f"{family_id}_{self.sanitize_filename(family_name)}"
            family_dir.mkdir(exist_ok=True)
            
            logger.info(f"📁 Скачиваем изображения в: {family_dir}")
            
            downloaded_images = []
            for i, img in enumerate(images, 1):
                try:
                    downloaded_img = self.download_single_image(img, family_dir, i)
                    if downloaded_img:
                        downloaded_images.append(downloaded_img)
                except Exception as e:
                    logger.error(f"Ошибка скачивания изображения {i}: {e}")
            
            logger.info(f"✅ Скачано {len(downloaded_images)}/{len(images)} изображений")
            return downloaded_images
            
        except Exception as e:
            logger.error(f"Ошибка при скачивании изображений: {e}")
            return images
    
    def download_single_image(self, img_data, family_dir, index):
        """Скачивание одного изображения"""
        try:
            url = img_data.get('url')
            if not url:
                return None
            
            # Получаем расширение файла
            parsed_url = urlparse(url)
            filename = parsed_url.path.split('/')[-1]
            
            # Если нет расширения, определяем по типу
            if '.' not in filename:
                ext = '.jpg'  # По умолчанию
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
            downloaded_img = img_data.copy()
            downloaded_img['local_path'] = str(file_path)
            downloaded_img['file_size'] = len(response.content)
            downloaded_img['downloaded'] = True
            downloaded_img['local_filename'] = filename
            
            logger.info(f"  ✅ Скачано: {filename}")
            return downloaded_img
            
        except Exception as e:
            logger.error(f"  ❌ Ошибка скачивания {url}: {e}")
            return None
    
    def sanitize_filename(self, filename):
        """Очистка имени файла от недопустимых символов"""
        # Убираем недопустимые символы для Windows/Linux
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            filename = filename.replace(char, '_')
        
        # Ограничиваем длину
        if len(filename) > 100:
            filename = filename[:100]
        
        return filename
    
    def parse_images_with_beautifulsoup(self, url):
        """Парсинг изображений через BeautifulSoup (fallback)"""
        try:
            response = self.session.get(url, timeout=30)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            images = []
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
        combined['parsing_method'] = 'combined_complete'
        combined['selenium_used'] = bool(self.driver)
        combined['images_downloaded'] = self.download_images
        
        # Добавляем метаданные
        combined['parsed_at'] = time.strftime('%Y-%m-%d %H:%M:%S')
        combined['total_images'] = len(image_data)
        combined['downloaded_images'] = len([img for img in image_data if img.get('downloaded', False)])
        
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
    
    # Методы извлечения текстовых данных
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
                    logger.info(f"   Скачано: {family_data.get('downloaded_images', 0)}")
                else:
                    logger.warning(f"⚠️ Не удалось спарсить: {url}")
                
                # Добавляем задержку между запросами
                if i < len(urls) - 1:
                    time.sleep(3)
                    
            except Exception as e:
                logger.error(f"❌ Ошибка при парсинге {url}: {e}")
                continue
        
        return all_families
    
    def save_to_json(self, data, filename='bim_families_complete.json'):
        """Сохранение результатов в JSON"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Результаты сохранены в файл: {filename}")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка при сохранении: {e}")
            return False
    
    def prepare_for_postgresql(self, data):
        """Подготовка данных для PostgreSQL"""
        postgres_data = []
        
        for family in data:
            # Основные данные семейства
            family_record = {
                'name': family.get('name', ''),
                'external_id': family.get('external_id', ''),
                'url': family.get('url', ''),
                'description': family.get('description', ''),
                'technical_specs': json.dumps(family.get('technical_specs', {}), ensure_ascii=False),
                'basic_specs': json.dumps(family.get('basic_specs', {}), ensure_ascii=False),
                'catalog_items': family.get('catalog_items', []),
                'company_info': json.dumps(family.get('company', {}), ensure_ascii=False),
                'download_info': json.dumps(family.get('download_info', {}), ensure_ascii=False),
                'parsing_method': family.get('parsing_method', ''),
                'selenium_used': family.get('selenium_used', False),
                'total_images': family.get('total_images', 0),
                'downloaded_images': family.get('downloaded_images', 0),
                'parsed_at': family.get('parsed_at', ''),
                'images': []
            }
            
            # Данные изображений
            for img in family.get('images', []):
                image_record = {
                    'url': img.get('url', ''),
                    'local_path': img.get('local_path', ''),
                    'alt_text': img.get('alt', ''),
                    'title': img.get('title', ''),
                    'image_type': img.get('type', ''),
                    'width': img.get('width'),
                    'height': img.get('height'),
                    'file_size': img.get('file_size'),
                    'downloaded': img.get('downloaded', False),
                    'local_filename': img.get('local_filename', '')
                }
                family_record['images'].append(image_record)
            
            postgres_data.append(family_record)
        
        return postgres_data

def main():
    """Основная функция для парсинга всех семейств"""
    parser = UniversalBIMParserComplete(download_images=True)
    
    # Список всех URL для парсинга
    urls = [
        "https://bimlib.pro/model/vodostochnaya-sistema-revit/45719/",
        "https://bimlib.pro/model/fundamenty-i-podpornye-sooruzheniya-revit/18333/",
        "https://bimlib.pro/model/alyuminievoe-okno-1-stv-newtec-euroline/39991/",
        "https://bimlib.pro/model/okno-2-stv-sunline-skhema-d/36066/",
        "https://bimlib.pro/model/dver-aquadoor-glukhaya-1-stv/40700/",
        "https://bimlib.pro/model/ploskie-kryshi-i-stilobaty-revit/18327/",
        "https://bimlib.pro/model/ograzhdeniya-krovli-i-snegozaderzhateli-revit/45724/",
        "https://bimlib.pro/model/skatnye-kryshi-revit/18331/",
        "https://bimlib.pro/model/dver-metallicheskaya-kvartirnaya-tipa-dm-100-s-mdf-panelyami/42850/",
        "https://bimlib.pro/model/schuco-dveri-sbornik/43826/",
        "https://bimlib.pro/model/dver-protivopozharnaya-dpm-ognedekor-0260-nippel/53516/",
        "https://bimlib.pro/model/dver-1-stv-whs-60/31609/",
        "https://bimlib.pro/model/thermomax-100w-ekstrudpen-100w-d1w-302-proffasad/31175/",
        "https://bimlib.pro/model/sistema-lobatherm-r-km300-kas-qg-khr20/21856/",
        "https://bimlib.pro/model/vorota-podemno-sektsionnye-vpps-ognedekor-60k/14807/",
        "https://bimlib.pro/model/douteplenie-skatnykh-krysh-iznutri/35726/",
        "https://bimlib.pro/model/primykaniya-krovli-k-stenam/52041/",
        "https://bimlib.pro/model/primykaniya-krovli-k-trubam/52055/",
        "https://bimlib.pro/model/uzly-primykaniya-krovli-k-voronkam/52056/",
        "https://bimlib.pro/model/primykanie-krovli-k-stene-svetovogo-fonarya/35753/",
        "https://bimlib.pro/model/uzel-primykaniya-krovli-k-ventiliruemomu-fasadu/52031/",
        "https://bimlib.pro/model/primykanie-krovli-k-stoykam-pod-oborudovanie/52053/",
        "https://bimlib.pro/model/uzel-primykaniya-krovli-k-uteplennomu-parapetu/52034/",
        "https://bimlib.pro/model/uzel-primykaniya-krovli-k-parapetam-vysotoy-bolee-600-mm/52013/",
        "https://bimlib.pro/model/zabor-2m/1619/"
    ]
    
    logger.info(f"🚀 Начинаем полный парсинг {len(urls)} BIM семейств...")
    
    try:
        # Парсим все семейства
        all_families = parser.parse_multiple_families(urls)
        
        if all_families:
            logger.info(f"\n✅ Успешно спарсено {len(all_families)} семейств!")
            
            # Сохраняем в JSON
            parser.save_to_json(all_families, 'bim_families_complete.json')
            
            # Подготавливаем данные для PostgreSQL
            postgres_data = parser.prepare_for_postgresql(all_families)
            
            # Сохраняем данные для PostgreSQL
            with open('postgres_data.json', 'w', encoding='utf-8') as f:
                json.dump(postgres_data, f, ensure_ascii=False, indent=2)
            
            logger.info("✅ Данные подготовлены для PostgreSQL: postgres_data.json")
            
            # Выводим статистику
            categories = {}
            companies = {}
            total_images = 0
            downloaded_images = 0
            
            for family in all_families:
                # Категории
                if 'technical_specs' in family and 'Категория' in family['technical_specs']:
                    cat = family['technical_specs']['Категория']
                    categories[cat] = categories.get(cat, 0) + 1
                
                # Компании
                if 'company' in family and 'name' in family['company']:
                    comp = family['company']['name']
                    companies[comp] = companies.get(comp, 0) + 1
                
                # Изображения
                total_images += family.get('total_images', 0)
                downloaded_images += family.get('downloaded_images', 0)
            
            logger.info("\n📊 СТАТИСТИКА:")
            logger.info(f"  Всего семейств: {len(all_families)}")
            logger.info(f"  Всего изображений: {total_images}")
            logger.info(f"  Скачано изображений: {downloaded_images}")
            
            logger.info("\n📁 По категориям:")
            for cat, count in categories.items():
                logger.info(f"  {cat}: {count}")
            
            logger.info("\n🏢 По компаниям:")
            for comp, count in companies.items():
                logger.info(f"  {comp}: {count}")
            
        else:
            logger.warning("⚠️ Не удалось спарсить ни одного семейства")
            
    except Exception as e:
        logger.error(f"❌ Критическая ошибка: {e}")
    
    finally:
        parser.close_selenium()

if __name__ == "__main__":
    main()