from django.core.management.base import BaseCommand

from main.models import JournalEntry, LedgerAccount


class Command(BaseCommand):
    help = "Seed basic accounting data for testing reports"

    def handle(self, *args, **options):
        self.stdout.write("Creating sample ledger accounts...")

        # Create basic chart of accounts
        accounts_data = [
            # Assets
            {"name": "Cash", "code": "1000", "account_type": "asset"},
            {"name": "Accounts Receivable", "code": "1100", "account_type": "asset"},
            {"name": "Inventory", "code": "1200", "account_type": "asset"},
            # Liabilities
            {"name": "Accounts Payable", "code": "2000", "account_type": "liability"},
            {"name": "Loans Payable", "code": "2100", "account_type": "liability"},
            # Equity
            {"name": "Owner Equity", "code": "3000", "account_type": "equity"},
            {"name": "Retained Earnings", "code": "3100", "account_type": "equity"},
            # Revenue
            {"name": "Service Revenue", "code": "4000", "account_type": "revenue"},
            {"name": "Product Sales", "code": "4100", "account_type": "revenue"},
            # Expenses
            {"name": "Office Supplies", "code": "5000", "account_type": "expense"},
            {"name": "Rent Expense", "code": "5100", "account_type": "expense"},
            {"name": "Utilities", "code": "5200", "account_type": "expense"},
        ]

        for account_data in accounts_data:
            LedgerAccount.objects.get_or_create(
                code=account_data["code"], defaults=account_data
            )

        self.stdout.write("Creating sample journal entries...")

        # Get accounts for journal entries
        cash = LedgerAccount.objects.get(code="1000")
        ar = LedgerAccount.objects.get(code="1100")
        service_revenue = LedgerAccount.objects.get(code="4000")
        supplies = LedgerAccount.objects.get(code="5000")
        rent = LedgerAccount.objects.get(code="5100")
        equity = LedgerAccount.objects.get(code="3000")

        from datetime import date

        # Sample transactions
        transactions = [
            # Initial investment
            {
                "date": date.today(),
                "description": "Owner investment",
                "debit_account": cash,
                "credit_account": equity,
                "amount": 10000.00,
            },
            # Service revenue
            {
                "date": date.today(),
                "description": "Consulting services",
                "debit_account": ar,
                "credit_account": service_revenue,
                "amount": 2500.00,
            },
            # Payment received
            {
                "date": date.today(),
                "description": "Payment for services",
                "debit_account": cash,
                "credit_account": ar,
                "amount": 2500.00,
            },
            # Office supplies
            {
                "date": date.today(),
                "description": "Office supplies purchase",
                "debit_account": supplies,
                "credit_account": cash,
                "amount": 150.00,
            },
            # Rent expense
            {
                "date": date.today(),
                "description": "Monthly rent",
                "debit_account": rent,
                "credit_account": cash,
                "amount": 800.00,
            },
        ]

        for transaction in transactions:
            JournalEntry.objects.get_or_create(
                date=transaction["date"],
                description=transaction["description"],
                debit_account=transaction["debit_account"],
                credit_account=transaction["credit_account"],
                amount=transaction["amount"],
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded accounting data"))
        self.stdout.write(f"Created {len(accounts_data)} ledger accounts")
        self.stdout.write(f"Created {len(transactions)} journal entries")
