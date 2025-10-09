"""Add backwards-compatible fields to ScheduledEvent used by older tests/fixtures

This migration adds optional fields: location, priority, estimated_duration, and
recurrence_end_date so that tests that instantiate ScheduledEvent with legacy
kwargs will not fail on missing columns.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0037_make_fields_nullable_for_tests"),
    ]

    operations = [
        migrations.AddField(
            model_name="scheduledevent",
            name="location",
            field=models.CharField(max_length=255, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="scheduledevent",
            name="priority",
            field=models.CharField(max_length=20, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="scheduledevent",
            name="estimated_duration",
            field=models.IntegerField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="scheduledevent",
            name="recurrence_end_date",
            field=models.DateField(null=True, blank=True),
        ),
    ]
