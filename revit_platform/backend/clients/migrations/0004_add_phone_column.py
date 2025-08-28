from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0003_state_fix_individual_legal_models'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_name = 'clients_legalentityclient'
                          AND column_name = 'phone'
                    ) THEN
                        ALTER TABLE clients_legalentityclient
                            ADD COLUMN phone varchar(20) DEFAULT '' NOT NULL;
                        ALTER TABLE clients_legalentityclient
                            ALTER COLUMN phone DROP DEFAULT;
                    END IF;
                END$$;
                """
            ),
            reverse_sql=(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_name = 'clients_legalentityclient'
                          AND column_name = 'phone'
                    ) THEN
                        ALTER TABLE clients_legalentityclient DROP COLUMN phone;
                    END IF;
                END$$;
                """
            ),
        ),
    ]

