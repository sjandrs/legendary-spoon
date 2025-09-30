from django.core.management.base import BaseCommand

from main.models import AnalyticsSnapshot, CustomerLifetimeValue


class Command(BaseCommand):
    help = "Populate analytics data for testing Phase 3 features"

    def handle(self, *args, **options):
        self.stdout.write("Populating analytics data...")

        # Create a daily snapshot
        snapshot = AnalyticsSnapshot.create_daily_snapshot()
        self.stdout.write(f"Created analytics snapshot for {snapshot.date}")

        # Calculate CLV for contacts that have deals
        from main.models import Contact

        contacts_with_deals = Contact.objects.filter(deals__isnull=False).distinct()

        clv_count = 0
        for contact in contacts_with_deals:
            try:
                clv = CustomerLifetimeValue.calculate_for_contact(contact)
                clv_count += 1
                self.stdout.write(
                    f"Calculated CLV for {contact.first_name} "
                    f"{contact.last_name}: ${clv.predicted_clv}"
                )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"Failed to calculate CLV for {contact}: {e}")
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully populated analytics data: 1 snapshot, {clv_count} CLV calculations"
            )
        )
