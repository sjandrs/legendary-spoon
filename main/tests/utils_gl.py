"""
Shared utilities for GL posting tests to reduce duplication.

Provides simple helpers to create COA accounts and seed a minimal invoice for tests.
Note: Keep dependencies minimal and avoid side effects across tests.
"""
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from main.models import Account, Deal, DealStage, Invoice, InvoiceItem, LedgerAccount


def ensure_account(code: str, name: str, account_type: str) -> LedgerAccount:
    obj, _ = LedgerAccount.objects.get_or_create(
        code=code, defaults={"name": name, "account_type": account_type}
    )
    if obj.account_type != account_type:
        obj.account_type = account_type
        obj.name = name
        obj.save()
    return obj


def seed_simple_invoice(user=None):
    """
    Create a minimal yet valid invoice with one item for posting tests based on current models:
    - Creates Account, Deal, Invoice, and one InvoiceItem
    - Ensures AR (1100) and Revenue (4000) accounts exist
    Returns: (invoice, ar_acct, revenue_acct)
    """
    User = get_user_model()
    user = user or User.objects.create(username="tester")

    # Ensure COA accounts
    ar = ensure_account("1100", "Accounts Receivable", "asset")
    rev = ensure_account("4000", "Revenue", "revenue")

    # Minimal CRM scaffolding to satisfy FK requirements
    account = Account.objects.create(name="Posting Test Account", owner=user)
    stage = DealStage.objects.create(name="Closed Won", order=1)
    deal = Deal.objects.create(
        title="Posting Test Deal",
        account=account,
        stage=stage,
        value=100.00,
        close_date=timezone.now().date(),
        owner=user,
        status="won",
    )

    inv = Invoice.objects.create(
        deal=deal,
        due_date=date.today() + timedelta(days=30),
    )
    InvoiceItem.objects.create(
        invoice=inv, description="Test Line", quantity=1, unit_price=100
    )
    return inv, ar, rev
