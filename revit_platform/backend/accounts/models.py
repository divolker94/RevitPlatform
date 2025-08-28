from django.contrib.auth.models import AbstractUser, BaseUserManager, Group, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email обязателен')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'admin')
        
        # Добавим username, если он требуется
        if 'username' not in extra_fields:
            extra_fields['username'] = email  # Используем email как username
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('specialist', 'BIM Specialist'),
        ('individual', 'Individual Client'),
        ('legal', 'Legal Entity'),
        ('manager', 'Manager'),
        ('admin', 'Administrator'),
    )
    
    # Переопределяем email как основное поле для входа
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    
    # Поля для определения типа пользователя
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='individual')
    role_selected = models.BooleanField(default=False)
    profile_completed = models.BooleanField(default=False)
    
    # Поле для аватара
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name=_('Avatar'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.email

    def get_display_name(self):
        """Возвращает отображаемое имя пользователя для сайта"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.username:
            return self.username
        return self.email
    
    def get_short_name(self):
        """Возвращает короткое имя пользователя"""
        return self.first_name if self.first_name else self.email.split('@')[0]
    
    def get_full_name(self):
        """Возвращает полное имя пользователя"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email

    def save(self, *args, **kwargs):
        # Автоматически генерируем username из email если не указан
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)

@receiver(post_save, sender=User)
def create_user_group(sender, instance, created, **kwargs):
    # Проверяем, что это действительно модель User
    if isinstance(instance, User) and created and instance.user_type:
        group_name = f"{instance.user_type}_group"
        group, created = Group.objects.get_or_create(name=group_name)
        instance.groups.add(group)
