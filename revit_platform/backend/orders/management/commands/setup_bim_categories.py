from django.core.management.base import BaseCommand
from orders.models import BIMFamilyCategory
from bim_families.models import BimFamily

class Command(BaseCommand):
    help = 'Настройка категорий для BIM-семейств и распределение существующих семейств'

    def handle(self, *args, **options):
        self.stdout.write('Создание категорий для BIM-семейств...')
        
        # Создаем основные категории
        categories_data = [
            {'name': 'Окна', 'slug': 'windows', 'description': 'Оконные конструкции', 'icon': 'window'},
            {'name': 'Двери', 'slug': 'doors', 'description': 'Дверные конструкции', 'icon': 'door'},
            {'name': 'Ворота', 'slug': 'gates', 'description': 'Ворота и калитки', 'icon': 'gate'},
            {'name': 'Кровля', 'slug': 'roofing', 'description': 'Кровельные материалы и конструкции', 'icon': 'roof'},
            {'name': 'Фундаменты', 'slug': 'foundations', 'description': 'Фундаментные конструкции', 'icon': 'foundation'},
            {'name': 'Водосточка', 'slug': 'drainage', 'description': 'Водосточные системы', 'icon': 'drainage'},
            {'name': 'Сантехника', 'slug': 'plumbing', 'description': 'Сантехническое оборудование', 'icon': 'plumbing'},
            {'name': 'Электрика', 'slug': 'electrical', 'description': 'Электрооборудование', 'icon': 'electrical'},
            {'name': 'Вентиляция', 'slug': 'ventilation', 'description': 'Вентиляционные системы', 'icon': 'ventilation'},
            {'name': 'Отопление', 'slug': 'heating', 'description': 'Системы отопления', 'icon': 'heating'},
            {'name': 'Мебель', 'slug': 'furniture', 'description': 'Мебельные изделия', 'icon': 'furniture'},
            {'name': 'Отделка', 'slug': 'finishing', 'description': 'Отделочные материалы', 'icon': 'finishing'},
            {'name': 'Конструкции', 'slug': 'structures', 'description': 'Несущие конструкции', 'icon': 'structure'},
            {'name': 'Прочее', 'slug': 'other', 'description': 'Прочие элементы', 'icon': 'other'},
        ]
        
        created_categories = []
        for cat_data in categories_data:
            category, created = BIMFamilyCategory.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(f'Создана категория: {category.name}')
            else:
                self.stdout.write(f'Категория уже существует: {category.name}')
            created_categories.append(category)
        
        # Распределяем существующие BIM-семейства по категориям
        self.stdout.write('Распределение существующих BIM-семейств по категориям...')
        
        # Простая логика распределения по названию
        family_categories = {
            'окно': 'windows',
            'дверь': 'doors',
            'ворота': 'gates',
            'кровля': 'roofing',
            'фундамент': 'foundations',
            'водосточка': 'drainage',
            'сантехника': 'plumbing',
            'электрика': 'electrical',
            'вентиляция': 'ventilation',
            'отопление': 'heating',
            'мебель': 'furniture',
            'отделка': 'finishing',
            'конструкция': 'structures',
        }
        
        families = BimFamily.objects.all()
        categorized_count = 0
        
        for family in families:
            if family.category:
                continue  # Пропускаем уже распределенные
                
            # Ищем подходящую категорию по названию
            family_name_lower = family.name.lower()
            assigned_category = None
            
            for keyword, category_slug in family_categories.items():
                if keyword in family_name_lower:
                    assigned_category = BIMFamilyCategory.objects.get(slug=category_slug)
                    break
            
            # Если не нашли подходящую категорию, назначаем "Прочее"
            if not assigned_category:
                assigned_category = BIMFamilyCategory.objects.get(slug='other')
            
            family.category = assigned_category
            family.save()
            categorized_count += 1
            
            if categorized_count % 10 == 0:
                self.stdout.write(f'Обработано {categorized_count} семейств...')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Готово! Создано {len(created_categories)} категорий, '
                f'распределено {categorized_count} BIM-семейств'
            )
        )
