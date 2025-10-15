from django.db import migrations, models
import django.db.models.deletion


def seed_default_cost_center(apps, schema_editor):
    CostCenter = apps.get_model('main', 'CostCenter')
    if not CostCenter.objects.filter(name='General Operations').exists():
        CostCenter.objects.create(name='General Operations', code='GEN', description='Default cost center')


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0042_warehouseitem_gtin_alter_activitylog_user_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='CostCenter',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('code', models.CharField(blank=True, max_length=20, unique=True)),
                ('description', models.CharField(blank=True, max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name='BudgetV2',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120)),
                ('year', models.PositiveIntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('cost_center', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='budgets', to='main.costcenter')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_budgets_v2', to='main.customuser')),
                ('project', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='budgets_v2', to='main.project')),
            ],
        ),
        migrations.CreateModel(
            name='MonthlyDistribution',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('month', models.PositiveSmallIntegerField()),
                ('percent', models.DecimalField(decimal_places=2, max_digits=5)),
                ('budget', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='monthly_distributions', to='main.budgetv2')),
            ],
            options={'ordering': ['month']},
        ),
        migrations.AlterUniqueTogether(
            name='budgetv2',
            unique_together={('name', 'year', 'cost_center')},
        ),
        migrations.AlterUniqueTogether(
            name='monthlydistribution',
            unique_together={('budget', 'month')},
        ),
        migrations.RunPython(seed_default_cost_center, migrations.RunPython.noop),
    ]
