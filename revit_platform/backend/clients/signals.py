from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group, Permission
from .models import LegalEntityClient, IndividualClient

@receiver(post_save, sender=LegalEntityClient)
def create_legal_entity_group(sender, instance, created, **kwargs):
	if created and instance.user:
		group_name = 'legal_entity_group'
		group, _ = Group.objects.get_or_create(name=group_name)
		# Добавляем группу пользователю, а не объекту клиента
		instance.user.groups.add(group)

		# Дополнительные права для юрлиц при необходимости
		permissions = [
			'view_project',
			'add_project',
			'change_project',
		]
		for permission_codename in permissions:
			try:
				permission = Permission.objects.get(codename=permission_codename)
				group.permissions.add(permission)
			except Permission.DoesNotExist:
				pass

@receiver(post_save, sender=IndividualClient)
def create_individual_group(sender, instance, created, **kwargs):
	if created and instance.user:
		group_name = 'individual_client_group'
		group, _ = Group.objects.get_or_create(name=group_name)
		# Добавляем группу пользователю, а не объекту клиента
		instance.user.groups.add(group)

		# Дополнительные права для физ. лиц при необходимости
		permissions = [
			'view_project',
			'add_project',
			'change_project',
		]
		for permission_codename in permissions:
			try:
				permission = Permission.objects.get(codename=permission_codename)
				group.permissions.add(permission)
			except Permission.DoesNotExist:
				pass