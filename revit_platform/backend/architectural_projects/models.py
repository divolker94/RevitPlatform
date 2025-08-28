from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg
import os

User = get_user_model()

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

    name = models.CharField('Наименование', max_length=255)
    category = models.CharField('Категория', max_length=100)
    description = models.TextField('Описание', default='')
    functional_class = models.CharField('Функциональный класс', max_length=100, null=True, blank=True)
    construction_system = models.CharField('Конструктивная система', max_length=255, null=True, blank=True)
    total_area = models.DecimalField('Общая площадь', max_digits=10, decimal_places=2, null=True, blank=True)
    building_volume = models.DecimalField('Объем здания', max_digits=10, decimal_places=2, null=True, blank=True)
    footprint_area = models.DecimalField('Площадь застройки', max_digits=10, decimal_places=2, null=True, blank=True)
    documentation = models.TextField('Документация', default='')
    design_duration = models.IntegerField('Длительность проектирования', default=0)
    design_cost = models.DecimalField('Стоимость проектирования', max_digits=10, decimal_places=2, default=0)
    
    # Изображения
    image_main = models.CharField('Главное изображение', max_length=255, blank=True, null=True)
    image_plan = models.CharField('План', max_length=255, blank=True, null=True)
    image_interior1 = models.CharField('Интерьер 1', max_length=255, blank=True, null=True)
    image_interior2 = models.CharField('Интерьер 2', max_length=255, blank=True, null=True)
    
    # Статистика
    user_comments = models.IntegerField('Комментарии', default=0)
    downloads = models.IntegerField('Загрузки', default=0)
    views_count = models.PositiveIntegerField('Просмотры', default=0)
    rating_average = models.DecimalField('Средний рейтинг', max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField('Количество оценок', default=0)

    class Meta:
        db_table = 'architectural_projects'
        verbose_name = 'Архитектурный проект'
        verbose_name_plural = 'Архитектурные проекты'
        ordering = ['-id']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """Переопределяем метод save для автоматического заполнения имен файлов"""
        if not self.image_main:
            self.image_main = f'3d_view_{self.id}.png'
        if not self.image_plan:
            self.image_plan = f'3d_view_{self.id}.png'
        if not self.image_interior1:
            self.image_interior1 = f'3d_view_{self.id}.png'
        if not self.image_interior2:
            self.image_interior2 = f'3d_view_{self.id}.png'
        super().save(*args, **kwargs)

    def increment_views(self):
        """Увеличивает счетчик просмотров"""
        self.views_count += 1
        self.save(update_fields=['views_count'])

    def get_unique_views_count(self):
        """Получает количество уникальных просмотров"""
        return self.project_views.count()

    def add_view_from_user(self, user=None, ip_address=None):
        """Добавляет уникальный просмотр от пользователя или IP адреса"""
        if user and user.is_authenticated:
            view, created = ProjectView.objects.get_or_create(
                project=self,
                user=user,
                defaults={'ip_address': ip_address}
            )
        elif ip_address:
            view, created = ProjectView.objects.get_or_create(
                project=self,
                ip_address=ip_address,
                defaults={'user': None}
            )
        if created:
            self.views_count = self.get_unique_views_count()
            self.save(update_fields=['views_count'])

    def update_rating_stats(self):
        """Обновляет статистику рейтинга на основе всех оценок"""
        ratings = self.ratings.all()
        if ratings.exists():
            avg_rating = ratings.aggregate(Avg('rating'))['rating__avg']
            self.rating_average = round(avg_rating, 2)
            self.rating_count = ratings.count()
        else:
            self.rating_average = 0
            self.rating_count = 0
        self.save(update_fields=['rating_average', 'rating_count'])

    @property
    def get_3d_view_url(self):
        """Получаем URL для 3D вида на основе ID проекта"""
        return f'/images/catalog/3d_view_{self.id}.png'

    @property
    def get_image_main_url(self):
        return f'/images/catalog/{self.image_main}.png' if self.image_main else None

    @property
    def get_image_plan_url(self):
        return f'/images/catalog/{self.image_plan}.png' if self.image_plan else None

    @property
    def get_image_interior1_url(self):
        return f'/images/catalog/{self.image_interior1}.png' if self.image_interior1 else None

    @property
    def get_image_interior2_url(self):
        return f'/images/catalog/{self.image_interior2}.png' if self.image_interior2 else None


class ProjectRating(models.Model):
    """Модель для хранения оценок проектов пользователями"""
    project = models.ForeignKey(
        ArchitecturalProject, 
        on_delete=models.CASCADE, 
        related_name='ratings',
        verbose_name='Проект'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        verbose_name='Пользователь'
    )
    rating = models.IntegerField(
        'Оценка',
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Оценка от 1 до 5 звезд'
    )
    created_at = models.DateTimeField('Дата оценки', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        verbose_name = 'Оценка проекта'
        verbose_name_plural = 'Оценки проектов'
        unique_together = ['project', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.rating}★ для {self.project.name}'

    def save(self, *args, **kwargs):
        """При сохранении оценки обновляем статистику проекта"""
        super().save(*args, **kwargs)
        self.project.update_rating_stats()

    def delete(self, *args, **kwargs):
        """При удалении оценки обновляем статистику проекта"""
        super().delete(*args, **kwargs)
        self.project.update_rating_stats()


class ProjectView(models.Model):
    project = models.ForeignKey(
        ArchitecturalProject,
        on_delete=models.CASCADE,
        related_name='project_views',
        verbose_name='Проект'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='Пользователь',
        related_name='architectural_project_views'
    )
    ip_address = models.GenericIPAddressField(
        verbose_name='IP-адрес',
        null=True,
        blank=True
    )
    viewed_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата просмотра'
    )

    class Meta:
        verbose_name = 'Просмотр архитектурного проекта'
        verbose_name_plural = 'Просмотры архитектурных проектов'
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
