# Generated manually to remove unused fields from orders_order table

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0004_add_category_field'),
    ]

    operations = [
        # Удаляем поля, которых нет в текущей модели Django
        migrations.RemoveField(
            model_name='order',
            name='project_name',
        ),
        migrations.RemoveField(
            model_name='order',
            name='budget',
        ),
        migrations.RemoveField(
            model_name='order',
            name='deadline',
        ),
        migrations.RemoveField(
            model_name='order',
            name='status',
        ),
        migrations.RemoveField(
            model_name='order',
            name='user',
        ),
    ]
