from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import User

class IndividualClient(models.Model):
	CLIENT_TYPE_CHOICES = [
		('customer', 'Заказчик'),
		('contractor', 'Подрядчик'),
	]

	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='individual_client_profile', null=True, blank=True, unique=True)
	client_type = models.CharField(_('Client Type'), max_length=20, choices=CLIENT_TYPE_CHOICES, default='customer')
	middle_name = models.CharField(_('Middle Name'), max_length=150, null=True, blank=True)
	birth_date = models.DateField(_('Birth Date'), null=True, blank=True)
	address = models.TextField(_('Address'), blank=True)
	payment_method = models.CharField(_('Payment Method'), max_length=20, blank=True)
	phone = models.CharField(_('Phone'), max_length=20, blank=True)

	class Meta:
		verbose_name = _('Individual Client')
		verbose_name_plural = _('Individual Clients')

	def save(self, *args, **kwargs):
		# Устанавливаем тип пользователя при создании профиля
		if self.user and (not self.user.user_type or self.user.user_type == 'individual'):
			self.user.user_type = 'individual'
			self.user.save()
		super().save(*args, **kwargs)

	def __str__(self):
		if self.user:
			return f"{self.user.get_full_name()} ({self.user.email}) - {self.get_client_type_display()}"
		return f"Individual Client (ID: {self.pk}) - {self.get_client_type_display()}"

	def get_full_name(self):
		if self.user and self.middle_name:
			return f"{self.user.last_name} {self.user.first_name} {self.middle_name}"
		elif self.user:
			return f"{self.user.last_name} {self.user.first_name}"
		return "Unknown"

class LegalEntityClient(models.Model):
	CLIENT_TYPE_CHOICES = [
		('customer', 'Заказчик'),
		('contractor', 'Подрядчик'),
	]

	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='legal_entity_client_profile', null=True, blank=True)
	client_type = models.CharField(_('Client Type'), max_length=20, choices=CLIENT_TYPE_CHOICES, default='customer')

	# Обязательные поля
	company_name = models.CharField(_('Company Name'), max_length=255)
	inn = models.CharField(_('INN'), max_length=12)
	kpp = models.CharField(_('KPP'), max_length=9)
	ogrn = models.CharField(_('OGRN'), max_length=15)
	bik = models.CharField(_('BIK'), max_length=9)
	account_number = models.CharField(_('Account Number'), max_length=20)
	bank_name = models.CharField(_('Bank Name'), max_length=255)
	contact_person = models.CharField(_('Contact Person'), max_length=255)
	phone = models.CharField(_('Phone'), max_length=20)

	# Необязательные поля
	legal_address = models.TextField(_('Legal Address'), blank=True, null=True)
	actual_address = models.TextField(_('Actual Address'), blank=True, null=True)
	position = models.CharField(_('Position'), max_length=255, blank=True, null=True)
	signature_type = models.CharField(_('Signature Type'), max_length=20, blank=True, null=True)

	class Meta:
		verbose_name = _('Legal Entity')
		verbose_name_plural = _('Legal Entities')

	def save(self, *args, **kwargs):
		# Устанавливаем тип пользователя при создании профиля
		if self.user and (not self.user.user_type or self.user.user_type == 'legal'):
			self.user.user_type = 'legal'
			self.user.save()
		super().save(*args, **kwargs)

	def __str__(self):
		if self.user:
			return f"{self.company_name} ({self.user.email}) - {self.get_client_type_display()}"
		return f"{self.company_name} (No User) - {self.get_client_type_display()}"