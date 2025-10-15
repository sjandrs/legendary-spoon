from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0043_budget_v2"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="monthlydistribution",
            constraint=models.CheckConstraint(
                check=models.Q(("month__gte", 1)) & models.Q(("month__lte", 12)),
                name="md_month_between_1_12",
            ),
        ),
        migrations.AddConstraint(
            model_name="monthlydistribution",
            constraint=models.CheckConstraint(
                check=models.Q(("percent__gte", 0)) & models.Q(("percent__lte", 100)),
                name="md_percent_between_0_100",
            ),
        ),
    ]
