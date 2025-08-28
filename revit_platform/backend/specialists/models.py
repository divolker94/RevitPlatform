from django.db import models
from django.conf import settings

class SpecialistProfile(models.Model):
    # Базовая связь с пользователем
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='specialist_profile')
    
    # Профессиональная информация
    specialization = models.CharField(max_length=500, blank=True, help_text='Специализации через запятую')
    experience = models.CharField(max_length=100, blank=True, help_text='Опыт работы')
    
    # Условия работы
    availability = models.CharField(max_length=100, blank=True, null=True, help_text='Доступность')
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='Почасовая ставка')
    
    # Дополнительная информация
    about = models.TextField(blank=True, help_text='О себе')
    
    # Портфолио и сертификаты
    portfolio = models.URLField(max_length=200, blank=True, null=True, help_text='Ссылка на портфолио')
    certificates = models.TextField(blank=True, help_text='Сертификаты')
    
    # Метаданные
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_profile_complete = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email}'s specialist profile"

    class Meta:
        verbose_name = 'Specialist Profile'
        verbose_name_plural = 'Specialist Profiles'


class ManagerProfile(models.Model):
    # Базовая связь с пользователем
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='manager_profile')
    
    # Информация о менеджере
    department = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    responsibilities = models.TextField(blank=True)
    
    # Метаданные
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_profile_complete = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email}'s manager profile"

    class Meta:
        verbose_name = 'Manager Profile'
        verbose_name_plural = 'Manager Profiles'