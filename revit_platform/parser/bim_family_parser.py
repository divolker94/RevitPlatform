# revit_platform/parser/bim_family_parser.py
import requests
from bs4 import BeautifulSoup
import json
import time
import re
from urllib.parse import urljoin, urlparse
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BIMFamilyParser:
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
        
        # Категории семейств для парсинга (используем реальные URL с сайта)
        self.categories = {
            'windows': {
                'name': 'Окна',
                'url': '/models/?category=windows',
                'description': 'Окна различных конфигураций и типов'
            },
            'doors': {
                'name': 'Двери',
                'url': '/models/?category=doors',
                'description': 'Двери различных типов и конструкций'
            },
            'openings': {
                'name': 'Отверстия',
                'url': '/models/?category=openings',
                'description': 'Отверстия для стен и перекрытий'
            },
            'equipment': {
                'name': 'Оборудование',
                'url': '/models/?category=equipment',
                'description': 'Инженерное оборудование и системы'
            },
            'exterior': {
                'name': 'Объекты экстерьера',
                'url': '/models/?category=exterior',
                'description': 'Элементы внешнего благоустройства'
            },
            'roofing': {
                'name': 'Кровля',
                'url': '/models/?category=roofing',
                'description': 'Кровельные материалы и системы'
            },
            'partitions': {
                'name': 'Перегородки',
                'url': '/models/?category=partitions',
                'description': 'Перегородки и зашивки'
            },
            'panels': {
                'name': 'Панели',
                'url': '/models/?category=panels',
                'description': 'Панели и облицовка'
            },
            'gates': {
                'name': 'Ворота',
                'url': '/models/?category=gates',
                'description': 'Ворота и калитки'
            },
            'drainage': {
                'name': 'Водосточка',
                'url': '/models/?category=drainage',
                'description': 'Водосточные системы'
            }
        }
        
        # Фирменные семейства (используем реальные URL)
        self.brands = {
            'technonikol': {
                'name': 'ТехноНиколь',
                'url': '/models/?company=technonikol',
                'categories': ['кровля', 'гидроизоляция', 'утеплитель', 'водосточка'],
                'description': 'Ведущий производитель кровельных и гидроизоляционных материалов'
            },
            'metalprofil': {
                'name': 'МеталлПрофиль',
                'url': '/models/?company=metalprofil',
                'categories': ['кровля', 'фасад', 'заборы'],
                'description': 'Производитель кровельных и фасадных материалов'
            },
            'knauf': {
                'name': 'КНАУФ',
                'url': '/models/?company=knauf',
                'categories': ['гипсокартон', 'перегородки', 'штукатурки'],
                'description': 'Мировой лидер в производстве строительных материалов'
            },
            'kinston': {
                'name': 'Кинстон',
                'url': '/models/?company=kinston',
                'categories': ['панели', 'минвата', 'утеплитель'],
                'description': 'Производитель теплоизоляционных материалов'
            },
            'alutech': {
                'name': 'Алютех',
                'url': '/models/?company=alutech',
                'categories': ['ворота', 'рольставни', 'фасад'],
                'description': 'Производитель алюминиевых конструкций'
            }
        }
    
    def get_page_content(self, url, retries=3):
        """Получение содержимого страницы с повторными попытками"""
        for attempt in range(retries):
            try:
                full_url = urljoin(self.base_url, url)
                logger.info(f"Загружаем страницу: {full_url}")
                
                response = self.session.get(full_url, timeout=30)
                response.raise_for_status()
                
                # Проверяем, что получили HTML
                if 'text/html' in response.headers.get('content-type', ''):
                    return response.text
                else:
                    logger.warning(f"Получен не HTML контент: {response.headers.get('content-type')}")
                    return None
                    
            except requests.RequestException as e:
                logger.error(f"Попытка {attempt + 1} не удалась: {e}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)  # Экспоненциальная задержка
                else:
                    logger.error(f"Не удалось загрузить страницу после {retries} попыток")
                    return None
        
        return None
    
    def parse_family_list(self, category_url):
        """Парсинг списка семейств в категории"""
        families = []
        page_content = self.get_page_content(category_url)
        
        if not page_content:
            return families
        
        soup = BeautifulSoup(page_content, 'html.parser')
        
        # Ищем карточки семейств по реальной структуре сайта
        # Используем селектор, который виден в DevTools: .bim-product-card
        family_cards = soup.find_all('div', class_=re.compile(r'bim-product-card|card-base'))
        
        logger.info(f"Найдено карточек: {len(family_cards)}")
        
        for card in family_cards:
            try:
                # Извлекаем ссылку на детальную страницу
                family_link = card.find('a', href=True)
                if not family_link:
                    continue
                
                family_url = family_link.get('href')
                if not family_url.startswith('http'):
                    family_url = urljoin(self.base_url, family_url)
                
                # Извлекаем название семейства
                family_name = self.extract_family_name(card)
                
                # Извлекаем название компании/бренда
                company_name = self.extract_company_name(card)
                
                # Извлекаем изображение
                image_url = self.extract_image_url(card)
                
                if family_name and family_url:
                    families.append({
                        'name': family_name,
                        'url': family_url,
                        'company_name': company_name,
                        'image_url': image_url,
                        'category_url': category_url
                    })
                    
            except Exception as e:
                logger.error(f"Ошибка при парсинге карточки: {e}")
                continue
        
        logger.info(f"Найдено {len(families)} семейств в категории {category_url}")
        return families
    
    def extract_family_name(self, card):
        """Извлечение названия семейства из карточки"""
        # Ищем название в различных местах карточки
        name_selectors = [
            '.product-name',
            '.model-name',
            '.family-name',
            'h3', 'h4', 'h5',
            'a[href*="/model/"]'
        ]
        
        for selector in name_selectors:
            name_elem = card.select_one(selector)
            if name_elem:
                name = name_elem.get_text(strip=True)
                if name and len(name) > 2:  # Проверяем, что название не пустое
                    return name
        
        # Если не нашли по селекторам, ищем в ссылке
        link = card.find('a', href=True)
        if link:
            href = link.get('href')
            # Извлекаем название из URL вида /model/vodostochnaya-sistema-revit/45719/
            if '/model/' in href:
                name_part = href.split('/model/')[1].split('/')[0]
                # Преобразуем slug в читаемое название
                name = name_part.replace('-', ' ').replace('_', ' ').title()
                return name
        
        return "Неизвестное семейство"
    
    def extract_company_name(self, card):
        """Извлечение названия компании из карточки"""
        # Ищем название компании по селектору, который виден в DevTools
        company_selectors = [
            '.company-name',
            '.brand-name',
            '.manufacturer',
            '.producer'
        ]
        
        for selector in company_selectors:
            company_elem = card.select_one(selector)
            if company_elem:
                company = company_elem.get_text(strip=True)
                if company and len(company) > 1:
                    return company
        
        return None
    
    def extract_image_url(self, card):
        """Извлечение URL изображения из карточки"""
        # Ищем изображение в карточке
        img_selectors = [
            'img[src*="/images/"]',
            'img[src*="/uploads/"]',
            'img[src*="/models/"]',
            'img'
        ]
        
        for selector in img_selectors:
            img = card.select_one(selector)
            if img and img.get('src'):
                src = img.get('src')
                if src.startswith('http'):
                    return src
                else:
                    return urljoin(self.base_url, src)
        
        return None
    
    def parse_family_details(self, family_url):
        """Парсинг детальной информации о семействе"""
        page_content = self.get_page_content(family_url)
        
        if not page_content:
            return None
        
        soup = BeautifulSoup(page_content, 'html.parser')
        
        try:
            # Извлекаем основную информацию
            family_data = {
                'url': family_url,
                'external_id': self.extract_external_id(family_url),
                'name': self.extract_name(soup),
                'description': self.extract_description(soup),
                'category': self.extract_category(soup),
                'brand': self.extract_brand(soup),
                'technical_specs': self.extract_technical_specs(soup),
                'images': self.extract_images(soup),
                'download_url': self.extract_download_url(soup),
                'file_size': self.extract_file_size(soup),
                'version': self.extract_version(soup),
                'tags': self.extract_tags(soup)
            }
            
            return family_data
            
        except Exception as e:
            logger.error(f"Ошибка при парсинге семейства {family_url}: {e}")
            return None
    
    def extract_external_id(self, url):
        """Извлечение внешнего ID из URL"""
        # Извлекаем ID из URL вида /model/vodostochnaya-sistema-revit/45719/
        match = re.search(r'/model/.*?/(\d+)/?', url)
        return match.group(1) if match else None
    
    def extract_name(self, soup):
        """Извлечение названия семейства"""
        # Ищем заголовок страницы
        title = soup.find('h1')
        if title:
            return title.get_text(strip=True)
        
        # Альтернативный поиск
        title = soup.find('title')
        if title:
            return title.get_text(strip=True).split(' - ')[0]
        
        return "Неизвестное семейство"
    
    def extract_description(self, soup):
        """Извлечение описания"""
        # Ищем описание в различных местах
        description_selectors = [
            '.description',
            '.family-description',
            '.model-info p',
            'meta[name="description"]'
        ]
        
        for selector in description_selectors:
            if selector.startswith('meta'):
                meta = soup.find('meta', attrs={'name': 'description'})
                if meta and meta.get('content'):
                    return meta['content']
            else:
                desc = soup.select_one(selector)
                if desc:
                    return desc.get_text(strip=True)
        
        return "Описание отсутствует"
    
    def extract_category(self, soup):
        """Извлечение категории"""
        # Ищем категорию в навигации или метаданных
        category_selectors = [
            '.breadcrumb a',
            '.category',
            '.model-category'
        ]
        
        for selector in category_selectors:
            category = soup.select_one(selector)
            if category:
                return category.get_text(strip=True)
        
        return "Неизвестная категория"
    
    def extract_brand(self, soup):
        """Извлечение бренда/производителя"""
        # Ищем бренд в различных местах
        brand_selectors = [
            '.brand',
            '.manufacturer',
            '.producer'
        ]
        
        for selector in brand_selectors:
            brand = soup.select_one(selector)
            if brand:
                return brand.get_text(strip=True)
        
        return None
    
    def extract_technical_specs(self, soup):
        """Извлечение технических характеристик"""
        specs = {}
        
        # Ищем таблицу характеристик
        specs_table = soup.find('table', class_=re.compile(r'specs|characteristics|params'))
        if specs_table:
            rows = specs_table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    key = cells[0].get_text(strip=True)
                    value = cells[1].get_text(strip=True)
                    if key and value:
                        specs[key] = value
        
        # Ищем характеристики в списках
        specs_lists = soup.find_all(['ul', 'ol'], class_=re.compile(r'specs|characteristics'))
        for spec_list in specs_lists:
            items = spec_list.find_all('li')
            for item in items:
                text = item.get_text(strip=True)
                if ':' in text:
                    key, value = text.split(':', 1)
                    specs[key.strip()] = value.strip()
        
        return specs
    
    def extract_images(self, soup):
        """Извлечение изображений"""
        images = []
        
        # Ищем изображения семейства
        img_selectors = [
            '.family-image img',
            '.model-image img',
            '.preview-image img'
        ]
        
        for selector in img_selectors:
            imgs = soup.select(selector)
            for img in imgs:
                src = img.get('src')
                if src:
                    full_src = urljoin(self.base_url, src)
                    images.append({
                        'url': full_src,
                        'alt': img.get('alt', ''),
                        'title': img.get('title', '')
                    })
        
        return images
    
    def extract_download_url(self, soup):
        """Извлечение ссылки для скачивания"""
        # Ищем ссылки на скачивание
        download_selectors = [
            'a[href*="download"]',
            'a[href*=".rfa"]',
            'a[href*=".rvt"]',
            '.download-link'
        ]
        
        for selector in download_selectors:
            link = soup.select_one(selector)
            if link:
                href = link.get('href')
                if href:
                    return urljoin(self.base_url, href)
        
        return None
    
    def extract_file_size(self, soup):
        """Извлечение размера файла"""
        # Ищем размер файла
        size_selectors = [
            '.file-size',
            '.download-size',
            'span:contains("МБ")',
            'span:contains("KB")'
        ]
        
        for selector in size_selectors:
            size_elem = soup.select_one(selector)
            if size_elem:
                text = size_elem.get_text(strip=True)
                # Извлекаем размер из текста
                size_match = re.search(r'(\d+(?:\.\d+)?)\s*(МБ|KB|MB)', text, re.IGNORECASE)
                if size_match:
                    return f"{size_match.group(1)} {size_match.group(2).upper()}"
        
        return None
    
    def extract_version(self, soup):
        """Извлечение версии семейства"""
        # Ищем версию
        version_selectors = [
            '.version',
            '.family-version',
            'span:contains("версия")',
            'span:contains("version")'
        ]
        
        for selector in version_selectors:
            version_elem = soup.select_one(selector)
            if version_elem:
                text = version_elem.get_text(strip=True)
                # Извлекаем версию
                version_match = re.search(r'(\d+(?:\.\d+)*)', text)
                if version_match:
                    return version_match.group(1)
        
        return "1.0"
    
    def extract_tags(self, soup):
        """Извлечение тегов"""
        tags = []
        
        # Ищем теги
        tag_selectors = [
            '.tags a',
            '.tag',
            '.keywords'
        ]
        
        for selector in tag_selectors:
            tag_elems = soup.select(selector)
            for tag_elem in tag_elems:
                tag_text = tag_elem.get_text(strip=True)
                if tag_text and tag_text not in tags:
                    tags.append(tag_text)
        
        return tags
    
    def parse_all_families(self, max_families_per_category=50):
        """Парсинг всех семейств по категориям"""
        all_families = []
        
        # Парсим основные категории
        for category_key, category_info in self.categories.items():
            logger.info(f"Парсим категорию: {category_info['name']}")
            
            try:
                families = self.parse_family_list(category_info['url'])
                
                # Ограничиваем количество семейств на категорию
                families = families[:max_families_per_category]
                
                for family in families:
                    logger.info(f"Парсим семейство: {family['name']}")
                    
                    # Добавляем задержку между запросами
                    time.sleep(1)
                    
                    family_details = self.parse_family_details(family['url'])
                    if family_details:
                        family_details['category_key'] = category_key
                        family_details['category_name'] = category_info['name']
                        all_families.append(family_details)
                
                logger.info(f"Завершен парсинг категории {category_info['name']}: {len(families)} семейств")
                
            except Exception as e:
                logger.error(f"Ошибка при парсинге категории {category_info['name']}: {e}")
                continue
        
        # Парсим фирменные семейства
        for brand_key, brand_info in self.brands.items():
            logger.info(f"Парсим бренд: {brand_info['name']}")
            
            try:
                families = self.parse_family_list(brand_info['url'])
                families = families[:max_families_per_category]
                
                for family in families:
                    logger.info(f"Парсим семейство бренда: {family['name']}")
                    
                    time.sleep(1)
                    
                    family_details = self.parse_family_details(family['url'])
                    if family_details:
                        family_details['brand_key'] = brand_key
                        family_details['brand_name'] = brand_info['name']
                        family_details['category_key'] = 'branded'
                        family_details['category_name'] = f"Бренд: {brand_info['name']}"
                        all_families.append(family_details)
                
                logger.info(f"Завершен парсинг бренда {brand_info['name']}: {len(families)} семейств")
                
            except Exception as e:
                logger.error(f"Ошибка при парсинге бренда {brand_info['name']}: {e}")
                continue
        
        logger.info(f"Всего спарсено семейств: {len(all_families)}")
        return all_families
    
    def save_to_json(self, families, filename='bim_families.json'):
        """Сохранение результатов в JSON файл"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(families, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Результаты сохранены в файл: {filename}")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка при сохранении в JSON: {e}")
            return False
    
    def save_to_csv(self, families, filename='bim_families.csv'):
        """Сохранение результатов в CSV файл"""
        try:
            import csv
            
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                if not families:
                    return False
                
                # Определяем все возможные поля
                all_fields = set()
                for family in families:
                    all_fields.update(family.keys())
                
                fieldnames = sorted(list(all_fields))
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for family in families:
                    # Заполняем отсутствующие поля пустыми значениями
                    row = {field: family.get(field, '') for field in fieldnames}
                    writer.writerow(row)
            
            logger.info(f"Результаты сохранены в CSV файл: {filename}")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка при сохранении в CSV: {e}")
            return False

def main():
    """Основная функция для запуска парсера"""
    parser = BIMFamilyParser()
    
    logger.info("Начинаем парсинг BIM семейств...")
    
    try:
        # Парсим все семейства
        families = parser.parse_all_families(max_families_per_category=30)
        
        if families:
            # Сохраняем в JSON
            parser.save_to_json(families, 'bim_families.json')
            
            # Сохраняем в CSV
            parser.save_to_csv(families, 'bim_families.csv')
            
            logger.info(f"Парсинг завершен успешно! Спарсено {len(families)} семейств")
            
            # Выводим статистику
            categories_stats = {}
            brands_stats = {}
            
            for family in families:
                cat = family.get('category_name', 'Неизвестно')
                categories_stats[cat] = categories_stats.get(cat, 0) + 1
                
                brand = family.get('brand_name')
                if brand:
                    brands_stats[brand] = brands_stats.get(brand, 0) + 1
            
            logger.info("Статистика по категориям:")
            for cat, count in categories_stats.items():
                logger.info(f"  {cat}: {count}")
            
            logger.info("Статистика по брендам:")
            for brand, count in brands_stats.items():
                logger.info(f"  {brand}: {count}")
                
        else:
            logger.warning("Не удалось спарсить ни одного семейства")
            
    except Exception as e:
        logger.error(f"Критическая ошибка при парсинге: {e}")

if __name__ == "__main__":
    main()