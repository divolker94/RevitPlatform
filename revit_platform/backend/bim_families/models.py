from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class BimFamily(models.Model):
    name = models.CharField(max_length=255)
    external_id = models.CharField(max_length=100, unique=True)
    url = models.URLField()
    description = models.TextField()
    technical_specs = models.JSONField(default=dict)
    basic_specs = models.JSONField(default=dict)
    catalog_items = models.JSONField(default=list)
    company_info = models.JSONField(default=dict)
    download_info = models.JSONField(default=dict)
    parsing_method = models.CharField(max_length=50)
    total_images = models.IntegerField(default=0)
    parsed_at = models.CharField(max_length=50)
    views = models.IntegerField(default=0)
    downloads = models.IntegerField(default=0)
    comments = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.5)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'families_bimfamily_2'
        verbose_name = 'BIM Семейство'
        verbose_name_plural = 'BIM Семейства'

    def __str__(self):
        return self.name

    def get_unique_views_count(self):
        """Возвращает количество уникальных просмотров"""
        return self.family_views.count()

    def add_view_from_user(self, user=None, ip_address=None):
        """Добавляет просмотр от пользователя (уникальный)"""
        if user and user.is_authenticated:
            # Если пользователь авторизован, используем его ID
            view, created = FamilyView.objects.get_or_create(
                family=self,
                user=user
            )
        elif ip_address:
            # Если пользователь не авторизован, используем IP адрес
            view, created = FamilyView.objects.get_or_create(
                family=self,
                ip_address=ip_address
            )
        
        # Обновляем общий счетчик просмотров
        if created:
            self.views = self.get_unique_views_count()
            self.save(update_fields=['views'])

class FamilyImage(models.Model):
    family = models.ForeignKey(BimFamily, on_delete=models.CASCADE, related_name='images')
    local_path = models.CharField(max_length=255)
    image_type = models.CharField(max_length=50, default='preview')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'families_familyimage_2'
        verbose_name = 'Изображение семейства'
        verbose_name_plural = 'Изображения семейств'

    def __str__(self):
        return f"{self.family.name} - {self.image_type}"

class FamilyView(models.Model):
    """Модель для отслеживания уникальных просмотров BIM семейств"""
    family = models.ForeignKey(
        BimFamily, 
        on_delete=models.CASCADE, 
        related_name='family_views',
        verbose_name='BIM Семейство'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        verbose_name='Пользователь',
        related_name='bim_family_views'
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
        verbose_name = 'Просмотр семейства'
        verbose_name_plural = 'Просмотры семейств'
        unique_together = [
            ('family', 'user'),  # Один пользователь - один просмотр
            ('family', 'ip_address')  # Один IP - один просмотр
        ]
        ordering = ['-viewed_at']

    def __str__(self):
        if self.user:
            return f'{self.user.email} просмотрел {self.family.name}'
        else:
            return f'IP {self.ip_address} просмотрел {self.family.name}'
