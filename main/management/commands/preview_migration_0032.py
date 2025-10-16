from django.core.management.base import BaseCommand


class Command(BaseCommand):
    # Shortened to satisfy line length limit; details in README / migration notes
    help = "Preview rows affected by migration 0032 (phone_number->phone, title->name)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=10,
            help="Number of sample IDs to show for each affected model",
        )
        parser.add_argument(
            "--fail-if-changes",
            action="store_true",
            help="Exit with non-zero code if any prospective changes are found",
        )

    def handle(self, *args, **options):
        limit = options.get("limit", 10)
        fail_if_changes = options.get("fail_if_changes", False)

        from django.core.exceptions import FieldDoesNotExist
        from django.db.models import Q

        from main.models import Account, Deal

        def has_field(model, field_name):
            try:
                model._meta.get_field(field_name)
                return True
            except FieldDoesNotExist:
                return False

        # Accounts where phone_number exists (this would be affected by migration)
        if has_field(Account, "phone_number"):
            accounts_qs = Account.objects.filter(
                ~(Q(phone_number__isnull=True) | Q(phone_number=""))
            )
            accounts_count = accounts_qs.count()
        else:
            accounts_qs = Account.objects.none()
            accounts_count = 0

        # Deals where title exists (this would be affected by migration)
        if has_field(Deal, "title"):
            deals_qs = Deal.objects.filter(~(Q(title__isnull=True) | Q(title="")))
            deals_count = deals_qs.count()
        else:
            deals_qs = Deal.objects.none()
            deals_count = 0

        heading = (
            f"Migration 0032 preview: {accounts_count} account(s) and {deals_count} deal(s) "
            "would be updated"
        )
        self.stdout.write(self.style.MIGRATE_HEADING(heading))

        if accounts_count:
            self.stdout.write(self.style.NOTICE("Account samples (id : phone_number):"))
            for acct in accounts_qs.values_list("id", "phone_number")[:limit]:
                self.stdout.write(f" - {acct[0]} : {acct[1]}")

        if deals_count:
            self.stdout.write(self.style.NOTICE("Deal samples (id : title):"))
            for deal in deals_qs.values_list("id", "title")[:limit]:
                self.stdout.write(f" - {deal[0]} : {deal[1]}")

        if fail_if_changes and (accounts_count or deals_count):
            raise SystemExit(2)

        return
