from django.db import models
from django.conf import settings

class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    reference_project = models.ForeignKey(
        'architectural_projects.ArchitecturalProject', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name='Референсный проект'
    )
    project_name = models.CharField(max_length=255)
    description = models.TextField()
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    deadline = models.DateField()
    percentage_change = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        verbose_name='Процент изменения'
    )
    calculated_budget = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name='Рассчитанный бюджет'
    )
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.project_name} - {self.user.email}"

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Автоматически рассчитываем бюджет при сохранении
        if self.reference_project and self.percentage_change:
            base_cost = self.reference_project.design_cost
            change_multiplier = 1 + (self.percentage_change / 100)
            self.calculated_budget = base_cost * change_multiplier
        else:
            self.calculated_budget = self.budget
        
        super().save(*args, **kwargs)