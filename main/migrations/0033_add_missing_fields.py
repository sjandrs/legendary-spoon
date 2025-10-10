from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0032_serializer_backcompat"),
    ]

    operations = [
        # Add annual_revenue to Account (nullable to be safe)
        migrations.AddField(
            model_name="account",
            name="annual_revenue",
            field=models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True),
        ),
        # Add name to Deal (nullable for now; code already allows null=True)
        migrations.AddField(
            model_name="deal",
            name="name",
            field=models.CharField(max_length=255, null=True, blank=True),
        ),
        # Add probability to Deal (has default in model)
        migrations.AddField(
            model_name="deal",
            name="probability",
            field=models.IntegerField(default=0),
            preserve_default=False,
        ),
    ]
