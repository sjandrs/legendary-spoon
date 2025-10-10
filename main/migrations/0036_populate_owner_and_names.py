from django.db import migrations, models


def create_migration_user(apps, schema_editor):
    User = apps.get_model('main', 'CustomUser')
    # Create or get a migration user to own migrated rows
    user, created = User.objects.get_or_create(username='migration_user')
    if created:
        user.set_password('migrator')
        user.save()
    return user


def forwards(apps, schema_editor):
    Account = apps.get_model('main', 'Account')
    Deal = apps.get_model('main', 'Deal')
    User = apps.get_model('main', 'CustomUser')

    # ensure a migration user exists
    migration_user, _ = User.objects.get_or_create(username='migration_user')

    # Use raw SQL to set owner for Accounts lacking one (covers any schema state)
    conn = schema_editor.connection
    with conn.cursor() as cursor:
        # Inline values to avoid sqlite debug formatting issues in this migration context
        cursor.execute(f"UPDATE main_account SET owner_id = {migration_user.pk} WHERE owner_id IS NULL")

        # Ensure all deals have a non-empty name. If name is NULL or empty, set a fallback.
        cursor.execute("UPDATE main_deal SET name = 'Migrated Deal' WHERE name IS NULL OR name = ''")


def reverse(apps, schema_editor):
    # No-op reverse
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0035_alter_account_options_remove_account_phone_number_and_more'),
    ]

    operations = [
        migrations.RunPython(forwards, reverse),
        migrations.AlterField(
            model_name='account',
            name='owner',
            field=models.ForeignKey(to='main.CustomUser', on_delete=models.CASCADE),
        ),
        migrations.AlterField(
            model_name='deal',
            name='name',
            field=models.CharField(max_length=255),
        ),
    ]
