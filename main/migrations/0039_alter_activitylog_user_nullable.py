"""Make ActivityLog.user nullable and use SET_NULL on delete

Revision ID: 0039_alter_activitylog_user_nullable
Revises: 0038_add_scheduledevent_compat_fields
Create Date: 2025-10-07 00:00
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0038_add_scheduledevent_compat_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="activitylog",
            name="user",
            field=models.ForeignKey(
                related_name="activity_logs",
                null=True,
                blank=True,
                to="main.customuser",
                on_delete=models.SET_NULL,
            ),
        ),
    ]
