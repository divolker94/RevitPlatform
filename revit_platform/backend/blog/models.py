from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import User

class Post(models.Model):
    CATEGORY_CHOICES = [
        ('news', 'Новости'),
        ('tips', 'Советы'),
        ('technology', 'Технологии'),
        ('training', 'Обучение'),
    ]
    
    title = models.CharField(
        _('Заголовок'),
        max_length=200
    )
    content = models.TextField(_('Содержание'))
    preview = models.TextField(_('Превью'), max_length=500, blank=True)
    category = models.CharField(
        _('Категория'),
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='news'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='posts',
        verbose_name=_('Автор')
    )
    image = models.ImageField(
        _('Изображение'),
        upload_to='blog/',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(
        _('Создано'),
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        _('Обновлено'),
        auto_now=True
    )
    
    class Meta:
        verbose_name = _('Пост')
        verbose_name_plural = _('Посты')
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class Comment(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name=_('Пост')
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name=_('Автор')
    )
    content = models.TextField(_('Комментарий'))
    created_at = models.DateTimeField(
        _('Создано'),
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        _('Обновлено'),
        auto_now=True
    )
    likes = models.ManyToManyField(
        User,
        related_name='liked_comments',
        verbose_name=_('Лайки'),
        blank=True
    )
    is_edited = models.BooleanField(
        _('Отредактировано'),
        default=False
    )

    class Meta:
        verbose_name = _('Комментарий')
        verbose_name_plural = _('Комментарии')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author.username} - {self.post.title}"

    def get_likes_count(self):
        return self.likes.count()

    def is_liked_by_user(self, user):
        if user.is_authenticated:
            return self.likes.filter(id=user.id).exists()
        return False
