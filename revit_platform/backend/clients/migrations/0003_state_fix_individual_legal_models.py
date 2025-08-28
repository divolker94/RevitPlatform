from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0002_auto_20250825_2236'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                # Пересоздаём состояние моделей, чтобы оно совпало с текущими models.py
                migrations.DeleteModel(name='IndividualClient'),
                migrations.DeleteModel(name='LegalEntityClient'),

                migrations.CreateModel(
                    name='IndividualClient',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('middle_name', models.CharField(max_length=150, null=True, blank=True, verbose_name='Middle Name')),
                        ('birth_date', models.DateField(null=True, blank=True, verbose_name='Birth Date')),
                        ('address', models.TextField(blank=True, verbose_name='Address')),
                        ('payment_method', models.CharField(max_length=20, blank=True, verbose_name='Payment Method')),
                        ('user', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='individual_client_profile', to='accounts.user')),
                    ],
                    options={
                        'verbose_name': 'Individual Client',
                        'verbose_name_plural': 'Individual Clients',
                    },
                ),

                migrations.CreateModel(
                    name='LegalEntityClient',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('company_name', models.CharField(max_length=255, verbose_name='Company Name')),
                        ('inn', models.CharField(max_length=12, verbose_name='INN')),
                        ('kpp', models.CharField(max_length=9, verbose_name='KPP')),
                        ('ogrn', models.CharField(max_length=15, verbose_name='OGRN')),
                        ('bik', models.CharField(max_length=9, verbose_name='BIK')),
                        ('account_number', models.CharField(max_length=20, verbose_name='Account Number')),
                        ('bank_name', models.CharField(max_length=255, verbose_name='Bank Name')),
                        ('contact_person', models.CharField(max_length=255, verbose_name='Contact Person')),
                        ('phone', models.CharField(max_length=20, verbose_name='Phone')),
                        ('legal_address', models.TextField(null=True, blank=True, verbose_name='Legal Address')),
                        ('actual_address', models.TextField(null=True, blank=True, verbose_name='Actual Address')),
                        ('position', models.CharField(max_length=255, null=True, blank=True, verbose_name='Position')),
                        ('signature_type', models.CharField(max_length=20, null=True, blank=True, verbose_name='Signature Type')),
                        ('user', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='legal_entity_client_profile', to='accounts.user')),
                    ],
                    options={
                        'verbose_name': 'Legal Entity',
                        'verbose_name_plural': 'Legal Entities',
                    },
                ),
            ],
        ),
    ]
