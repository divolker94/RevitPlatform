from django.core.management.base import BaseCommand
from specialists.models import SpecialistProfile

class Command(BaseCommand):
    help = 'Исправляет специализации для существующих профилей специалистов'

    def handle(self, *args, **options):
        # Находим профили с невалидной специализацией
        invalid_profiles = SpecialistProfile.objects.filter(specialization='Не указано')
        
        self.stdout.write(f"Найдено {invalid_profiles.count()} профилей с невалидной специализацией")
        
        for profile in invalid_profiles:
            # Устанавливаем специализацию в зависимости от типа специалиста
            if profile.specialist_type == 'manager':
                profile.specialization = 'BIM management'
            else:
                profile.specialization = 'architectural design'
            
            profile.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Исправлен профиль {profile.id}: {profile.user.email} -> {profile.specialization}"
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS("Исправление завершено!")
        )
