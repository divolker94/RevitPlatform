# Generated manually to increase design_cost by 1000x

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('architectural_projects', '0001_initial'),
    ]

    operations = [
        # Увеличиваем стоимость проектирования в 1000 раз
        migrations.RunSQL(
            sql="""
            UPDATE architectural_projects 
            SET design_cost = design_cost * 1000 
            WHERE design_cost > 0;
            """,
            reverse_sql="""
            UPDATE architectural_projects 
            SET design_cost = design_cost / 1000 
            WHERE design_cost > 0;
            """
        ),
    ]
