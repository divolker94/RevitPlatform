from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import User

class Post(models.Model):
    title = models.CharField(
        _('Заголовок'),
        max_length=200
    )
    content = models.TextField(_('Содержание'))
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

    class Meta:
        verbose_name = _('Комментарий')
        verbose_name_plural = _('Комментарии')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author.username} - {self.post.title}"
