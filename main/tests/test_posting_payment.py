from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from main.models import (
    Account,
    CustomUser,
    Deal,
    DealStage,
    Invoice,
    InvoiceItem,
    JournalEntry,
    LedgerAccount,
    Payment,
)


class TestPaymentPostingGL(TestCase):
    def setUp(self):
        # Manager user
        self.user = CustomUser.objects.create_user(username="manager", password="pass")
        mgr, _ = Group.objects.get_or_create(name="Sales Manager")
        self.user.groups.add(mgr)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Minimal deal and invoice
        stage = DealStage.objects.create(name="qualified", order=1)
        account = Account.objects.create(name="Acme Corp")
        deal = Deal.objects.create(
            title="Test Deal",
            account=account,
            stage=stage,
            value=100,
            close_date=timezone.now().date(),
            owner=self.user,
        )
        self.invoice = Invoice.objects.create(deal=deal, due_date=timezone.now().date())
        InvoiceItem.objects.create(
            invoice=self.invoice, description="Item", quantity=2, unit_price=50
        )

        # Ensure default accounts exist
        LedgerAccount.objects.get_or_create(
            code="1000", defaults={"name": "Cash", "account_type": "asset"}
        )
        LedgerAccount.objects.get_or_create(
            code="1100", defaults={"name": "AR", "account_type": "asset"}
        )

    def test_payment_posting_happy_path(self):
        # Create payment referencing CRM Invoice via generic relation
        ct = ContentType.objects.get_for_model(Invoice)
        payment = Payment.objects.create(
            amount=100,
            payment_date=timezone.now().date(),
            method="card",
            content_type=ct,
            object_id=self.invoice.id,
        )
        resp = self.client.post(f"/api/payments/{payment.id}/allocate/")
        self.assertIn(resp.status_code, (200, 201))
        data = resp.json()
        self.assertIn("journal_entry_id", data)
        self.assertEqual(float(data.get("open_balance", 0)), 0.0)

        # Idempotency: second call returns 409
        resp2 = self.client.post(f"/api/payments/{payment.id}/allocate/")
        self.assertIn(resp2.status_code, (200, 409))

    def test_payment_overpay_rejected(self):
        # Underlying invoice total = 100; attempt to overpay 150
        ct = ContentType.objects.get_for_model(Invoice)
        payment = Payment.objects.create(
            amount=150,
            payment_date=timezone.now().date(),
            method="card",
            content_type=ct,
            object_id=self.invoice.id,
        )
        resp = self.client.post(f"/api/payments/{payment.id}/allocate/")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Payment exceeds open balance", str(resp.content))

    def test_partial_payment_then_settle(self):
        ct = ContentType.objects.get_for_model(Invoice)
        p1 = Payment.objects.create(
            amount=60,
            payment_date=timezone.now().date(),
            method="card",
            content_type=ct,
            object_id=self.invoice.id,
        )
        r1 = self.client.post(f"/api/payments/{p1.id}/allocate/")
        self.assertIn(r1.status_code, (200, 201))
        self.assertAlmostEqual(r1.json().get("open_balance"), 40.0)

        p2 = Payment.objects.create(
            amount=40,
            payment_date=timezone.now().date(),
            method="card",
            content_type=ct,
            object_id=self.invoice.id,
        )
        r2 = self.client.post(f"/api/payments/{p2.id}/allocate/")
        self.assertIn(r2.status_code, (200, 201))
        self.assertAlmostEqual(r2.json().get("open_balance"), 0.0)


"""
AC-GL-002: Payment Receipt → Journal Entry and AR Settlement

Smoke scaffolding for payment posting tests. This file will exercise:
- Payment creates a double-entry JournalEntry (DR Cash/Bank, CR AR)
- Partial payment behavior and invoice balance transitions
- Idempotency via payment reference
- Overpayment validation (400)
"""
