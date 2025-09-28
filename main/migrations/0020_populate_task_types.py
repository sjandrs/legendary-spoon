from django.db import migrations

def populate_task_types(apps, schema_editor):
    TaskType = apps.get_model('main', 'TaskType')
    TASK_TYPES = [
        'Call',
        'Email',
        'Meeting',
        'Follow Up',
        'Research',
        'Other',
    ]
    for task_type_name in TASK_TYPES:
        TaskType.objects.get_or_create(name=task_type_name)

def set_default_task_type_for_tasks(apps, schema_editor):
    Task = apps.get_model('main', 'Task')
    TaskType = apps.get_model('main', 'TaskType')
    
    # Get or create the 'Other' task type to use as a default
    other_type, _ = TaskType.objects.get_or_create(name='Other')

    # Set a default for any tasks that might have a null task_type
    # This is a defensive measure; based on the old model, it shouldn't be null.
    Task.objects.filter(task_type__isnull=True).update(task_type=other_type)

class Migration(migrations.Migration):

    dependencies = [
        ('main', '0019_tasktype_alter_task_task_type_and_more'),
    ]

    operations = [
        migrations.RunPython(populate_task_types),
        migrations.RunPython(set_default_task_type_for_tasks),
    ]

