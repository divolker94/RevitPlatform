from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class BimFamily(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey('orders.BIMFamilyCategory', on_delete=models.SET_NULL, null=True, blank=True)
    family_type = models.CharField(max_length=100, default='Не указан')
    manufacturer = models.CharField(max_length=200, default='Не указан')
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    views_count = models.IntegerField(default=0)
    downloads_count = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
            self.views_count = self.get_unique_views_count()
            self.save(update_fields=['views_count'])

class FamilyImage(models.Model):
    family = models.ForeignKey(BimFamily, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='bim_families/', null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'families_familyimage_2'
        verbose_name = 'Изображение семейства'
        verbose_name_plural = 'Изображения семейств'

    def __str__(self):
        return f"{self.family.name} - изображение"

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
