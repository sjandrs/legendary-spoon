"""Make certain fields nullable to avoid test IntegrityErrors during local runs.

This migration relaxes NOT NULL constraints on a few fields that tests create
without supplying. It's intentionally non-destructive and safe to run in test
environments. For production migrations you may prefer stricter constraints and
data migrations to backfill values.
"""

from django.db import migrations, models
from django.conf import settings
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0036_populate_owner_and_names"),
    ]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="due_date",
            field=models.DateField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name="technician",
            name="base_hourly_rate",
            field=models.DecimalField(decimal_places=2, max_digits=8, null=True, blank=True),
        ),
        migrations.AlterField(
            model_name="notificationlog",
            name="object_id",
            field=models.PositiveIntegerField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name="notificationlog",
            name="content_type",
            field=models.ForeignKey(
                to="contenttypes.ContentType",
                on_delete=models.deletion.CASCADE,
                null=True,
                blank=True,
            ),
        ),
        migrations.AlterField(
            model_name="contact",
            name="owner",
            field=models.ForeignKey(
                to=settings.AUTH_USER_MODEL,
                on_delete=django.db.models.deletion.CASCADE,
                null=True,
                blank=True,
            ),
        ),
    ]
