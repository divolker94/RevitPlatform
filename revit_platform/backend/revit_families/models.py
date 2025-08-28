from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import User

class Category(models.Model):
    name = models.CharField('Название категории', max_length=100)
    description = models.TextField('Описание', blank=True)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['name']

    def __str__(self):
        return self.name

class Family(models.Model):
    name = models.CharField(
        _('Название'),
        max_length=200
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='families',
        verbose_name=_('Категория')
    )
    description = models.TextField(_('Описание'))
    file = models.FileField(
        _('Файл семейства'),
        upload_to='revit_families/'
    )
    preview_image = models.ImageField(
        _('Превью'),
        upload_to='family_previews/',
        null=True,
        blank=True
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='families',
        verbose_name=_('Автор')
    )
    created_at = models.DateTimeField(
        _('Создано'),
        auto_now_add=True
    )
    downloads = models.IntegerField(
        _('Количество скачиваний'),
        default=0
    )
    
    class Meta:
        verbose_name = _('Семейство')
        verbose_name_plural = _('Семейства')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.category.name}"

    def increment_downloads(self):
        """Увеличивает счетчик скачиваний"""
        self.downloads += 1
        self.save()
