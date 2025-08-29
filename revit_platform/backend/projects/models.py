from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils.text import slugify
from django.core.validators import MinValueValidator
from PIL import Image
import os

User = get_user_model()

def architectural_project_image_path(instance, filename):
    ext = filename.split('.')[-1]
    return f'architectural_projects/{instance.id}/images/{filename}'

def project_file_path(instance, filename):
    return f'project_files/{instance.project.id}/{filename}'

def project_section_file_path(instance, filename):
    return f'project_files/{instance.project.id}/sections/{instance.section_type}/{filename}'

class Project(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('in_progress', 'В работе'),
        ('completed', 'Завершен'),
        ('archived', 'В архиве'),
    ]

    # Основная информация
    name = models.CharField('Название', max_length=255)
    description = models.TextField('Описание', blank=True)
    status = models.CharField('Статус', max_length=20, choices=STATUS_CHOICES, default='draft')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects', verbose_name='Автор')
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    team_members = models.ManyToManyField(
        User,
        through='ProjectRole',
        related_name='project_memberships',
        verbose_name='Участники проекта'
    )

    # Поля для BIM-менеджера
    object_code = models.CharField('Шифр объекта', max_length=100, blank=True)
    design_stage = models.CharField('Стадия проектирования', max_length=100, blank=True)
    construction_queue = models.CharField('Очередь строительства', max_length=100, blank=True)
    launch_complexes = models.CharField('Пусковые комплексы', max_length=200, blank=True)

    # ТЭП (Технико-экономические показатели)
    floors = models.PositiveIntegerField('Этажность', null=True, blank=True)
    total_area = models.DecimalField('Общая площадь (м²)', max_digits=10, decimal_places=2, null=True, blank=True)
    building_area = models.DecimalField('Площадь застройки (м²)', max_digits=10, decimal_places=2, null=True, blank=True)
    construction_volume = models.DecimalField('Строительный объем (м³)', max_digits=12, decimal_places=2, null=True, blank=True)
    structural_system = models.CharField('Конструктивная система', max_length=100, blank=True)

    # Архитектурная часть (для архитектора)
    architectural_concept = models.TextField('Архитектурная концепция', blank=True)
    facade_materials = models.CharField('Материалы фасадов', max_length=200, blank=True)
    interior_finish = models.CharField('Отделка интерьеров', max_length=200, blank=True)
    landscape_design = models.TextField('Ландшафтное проектирование', blank=True)

    # Конструктивная часть (для конструктора)
    foundation_type = models.CharField('Тип фундамента', max_length=100, blank=True)
    wall_materials = models.CharField('Материалы стен', max_length=200, blank=True)
    roof_type = models.CharField('Тип кровли', max_length=100, blank=True)
    seismic_resistance = models.CharField('Сейсмостойкость', max_length=50, blank=True)

    # Водоснабжение и канализация (для специалиста ВК)
    water_supply_system = models.TextField('Система внутреннего и наружного водоснабжения', blank=True)
    sewerage_system = models.TextField('Система канализации', blank=True)
    cold_water_system = models.TextField('Система холодоснабжения', blank=True)
    water_consumption = models.DecimalField('Расход воды (л/с)', max_digits=8, decimal_places=2, null=True, blank=True)

    # Отопление и вентиляция (для специалиста ОВ)
    heating_system = models.TextField('Система отопления', blank=True)
    ventilation_system = models.TextField('Система вентиляции', blank=True)
    air_conditioning = models.TextField('Система кондиционирования', blank=True)
    heating_load = models.DecimalField('Тепловая нагрузка (кВт)', max_digits=10, decimal_places=2, null=True, blank=True)

    # Электроснабжение (для специалиста ЭОМ)
    electrical_system = models.TextField('Система электроснабжения', blank=True)
    electrical_load = models.DecimalField('Электрическая нагрузка (кВт)', max_digits=10, decimal_places=2, null=True, blank=True)
    backup_power = models.TextField('Резервное электроснабжение', blank=True)
    grounding_system = models.CharField('Система заземления', max_length=100, blank=True)

    # Сети связи (для специалиста СС)
    communication_networks = models.TextField('Сети связи', blank=True)
    security_systems = models.TextField('Системы безопасности', blank=True)
    automation_systems = models.TextField('Системы автоматизации', blank=True)
    it_infrastructure = models.TextField('IT-инфраструктура', blank=True)

    # Пожарная безопасность
    fire_safety = models.TextField('Пожарная безопасность', blank=True)
    evacuation_routes = models.TextField('Пути эвакуации', blank=True)
    fire_extinguishing = models.TextField('Системы пожаротушения', blank=True)

    # Экология и энергоэффективность
    energy_efficiency = models.CharField('Класс энергоэффективности', max_length=50, blank=True)
    environmental_impact = models.TextField('Воздействие на окружающую среду', blank=True)
    sustainability_features = models.TextField('Экологические особенности', blank=True)

    class Meta:
        verbose_name = 'Проект'
        verbose_name_plural = 'Проекты'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class ProjectComment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField('Комментарий')
    created_at = models.DateTimeField('Добавлен', auto_now_add=True)
    image_coordinates = models.JSONField('Координаты на изображении', null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Комментарий'
        verbose_name_plural = 'Комментарии'

    def __str__(self):
        return f"{self.user.username} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class ProjectRole(models.Model):
    ROLE_CHOICES = [
        ('bim_manager', 'BIM-менеджер'),
        ('architect', 'Архитектор'),
        ('constructor', 'Конструктор'),
        ('engineer', 'Инженер'),
        ('viewer', 'Просмотр')
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='roles')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_roles')
    role = models.CharField('Роль', max_length=20, choices=ROLE_CHOICES)
    assigned_at = models.DateTimeField('Дата назначения', auto_now_add=True)

    class Meta:
        verbose_name = 'Роль в проекте'
        verbose_name_plural = 'Роли в проекте'
        unique_together = ['project', 'user']

    def __str__(self):
        return f'{self.user.email} - {self.get_role_display()} в {self.project.name}'

class ProjectSection(models.Model):
    SECTION_TYPES = [
        ('architectural', 'Архитектурная часть'),
        ('structural', 'Конструктивная часть'),
        ('engineering', 'Инженерная часть'),
        ('general', 'Общая часть')
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sections')
    section_type = models.CharField('Тип раздела', max_length=20, choices=SECTION_TYPES)
    description = models.TextField('Описание', blank=True)
    last_updated = models.DateTimeField('Последнее обновление', auto_now=True)

    class Meta:
        verbose_name = 'Раздел проекта'
        verbose_name_plural = 'Разделы проекта'
        unique_together = ['project', 'section_type']

    def __str__(self):
        return f'{self.get_section_type_display()} - {self.project.name}'

class ProjectSectionFile(models.Model):
    section = models.ForeignKey(ProjectSection, on_delete=models.CASCADE, related_name='files')
    file = models.FileField('Файл', upload_to=project_section_file_path)
    title = models.CharField('Название', max_length=255)
    description = models.TextField('Описание', blank=True)
    file_type = models.CharField('Тип файла', max_length=10)
    thumbnail = models.ImageField('Миниатюра', upload_to=project_section_file_path, blank=True, null=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_section_files')
    uploaded_at = models.DateTimeField('Дата загрузки', auto_now_add=True)

    class Meta:
        verbose_name = 'Файл раздела'
        verbose_name_plural = 'Файлы разделов'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.title} - {self.section.get_section_type_display()}'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.file and self.file_type.lower() == 'pdf':
            try:
                from pdf2image import convert_from_path
                images = convert_from_path(self.file.path, first_page=1, last_page=1)
                if images:
                    thumb_path = f'{os.path.splitext(self.file.path)[0]}_thumb.jpg'
                    images[0].save(thumb_path, 'JPEG')
                    self.thumbnail.name = f'{os.path.splitext(self.file.name)[0]}_thumb.jpg'
                    super().save(update_fields=['thumbnail'])
            except Exception as e:
                print(f'Error generating PDF thumbnail: {e}')


class ArchitecturalProject(models.Model):
    OBJECT_TYPES = [
        ('residential', 'Жилой'),
        ('commercial', 'Коммерческий'),
        ('industrial', 'Промышленный'),
        ('public', 'Общественный'),
        ('mixed', 'Смешанный'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('in_progress', 'В разработке'),
        ('completed', 'Завершен'),
        ('archived', 'В архиве'),
    ]

    # Основная информация
    name = models.CharField('Наименование', max_length=255)
    slug = models.SlugField('URL', max_length=255, unique=True, blank=True)
    object_type = models.CharField('Тип объекта', max_length=20, choices=OBJECT_TYPES)
    status = models.CharField('Статус', max_length=20, choices=STATUS_CHOICES, default='draft')
    description = models.TextField('Описание')
    
    # Технические характеристики
    total_area = models.DecimalField(
        'Общая площадь (м²)',
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    price = models.DecimalField(
        'Стоимость (₽)',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    price_per_meter = models.DecimalField(
        'Стоимость за м² (₽)',
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        blank=True,
        null=True
    )
    
    # Медиа
    view_3d = models.ImageField(
        '3D вид',
        upload_to=architectural_project_image_path,
        blank=True,
        null=True
    )
    floor_plans = models.ImageField(
        'Планы этажей',
        upload_to=architectural_project_image_path,
        blank=True,
        null=True
    )
    
    # Метаданные
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='architectural_projects',
        verbose_name='Автор'
    )
    
    # Статистика
    views_count = models.PositiveIntegerField('Количество просмотров', default=0)
    comments_count = models.PositiveIntegerField('Количество комментариев', default=0)
    likes_count = models.PositiveIntegerField('Количество лайков', default=0)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Проект в каталоге'
        verbose_name_plural = 'Каталог проектов'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        if self.total_area and self.price:
            self.price_per_meter = self.price / self.total_area
        super().save(*args, **kwargs)

    def increment_views(self):
        self.views_count += 1
        self.save(update_fields=['views_count'])

    @property
    def get_view_3d_url(self):
        """Получаем полный URL для 3D вида"""
        if self.view_3d:
            return f"{settings.MEDIA_URL}{self.view_3d}"
        return f"{settings.MEDIA_URL}catalog/3d_view_{self.id}.jpg"

    @property
    def get_floor_plans_url(self):
        """Получаем полный URL для планов этажей"""
        if self.floor_plans:
            return f"{settings.MEDIA_URL}{self.floor_plans}"
        return None

    def get_image_path(self, image_type):
        """Получаем путь к изображению определенного типа"""
        return os.path.join(settings.MEDIA_ROOT, 'architectural_projects', str(self.id), 'images', f'{image_type}.jpg')

class ProjectView(models.Model):
    """Модель для отслеживания уникальных просмотров проектов"""
    project = models.ForeignKey(
        Project, 
        on_delete=models.CASCADE, 
        related_name='project_views',
        verbose_name='Проект'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        verbose_name='Пользователь',
        related_name='project_views'
    )
    ip_address = models.GenericIPAddressField(
        null=True, 
        blank=True,
        verbose_name='IP адрес'
    )
    viewed_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата просмотра'
    )

    class Meta:
        verbose_name = 'Просмотр проекта'
        verbose_name_plural = 'Просмотры проектов'
        unique_together = [
            ('project', 'user'),  # Один пользователь - один просмотр
            ('project', 'ip_address')  # Один IP - один просмотр
        ]
        ordering = ['-viewed_at']

    def __str__(self):
        if self.user:
            return f'{self.user.email} просмотрел {self.project.name}'
        else:
            return f'IP {self.ip_address} просмотрел {self.project.name}'
