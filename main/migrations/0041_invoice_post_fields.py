from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0040_alter_account_options_remove_account_annual_revenue_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="invoice",
            name="posted_journal",
            field=models.ForeignKey(
                to="main.journalentry",
                on_delete=models.SET_NULL,
                null=True,
                blank=True,
                related_name="posted_invoices",
            ),
        ),
        migrations.AddField(
            model_name="invoice",
            name="posted_at",
            field=models.DateTimeField(null=True, blank=True),
        ),
    ]
