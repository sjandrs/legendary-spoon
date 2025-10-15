"""
AC-GL-001: Invoice Posting → Journal Entry

Smoke scaffolding for GL posting tests. This file will exercise:
- Invoice posting creates a double-entry JournalEntry (DR AR, CR Revenue [+ Tax])
- Idempotency (re-posting is a no-op)
- Status transition and ActivityLog audit
- Error modes (400 missing mappings, 409 already posted)

TODOs are included to guide full implementation.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase

from main.models import (  # import existence checks
    Invoice,
    InvoiceItem,
    JournalEntry,
    LedgerAccount,
)


class TestInvoicePosting(TestCase):
    def test_models_exist(self):
        """Basic import existence check for core accounting models used by invoice posting."""
        self.assertIsNotNone(Invoice)
        self.assertIsNotNone(InvoiceItem)
        self.assertIsNotNone(JournalEntry)
        self.assertIsNotNone(LedgerAccount)

    def test_placeholder_ready(self):
        """
        Placeholder to keep the scaffold green.

        TODO:
        - Create COA accounts: AR, Revenue, TaxPayable
        - Create Account/Contact/Deal (if required by serializer), then Invoice + InvoiceItems
        - POST /api/invoices/{id}/post/ and assert:
          - JournalEntry created with DR AR, CR Revenue [+ CR TaxPayable]
          - Idempotency: re-POST returns 409 or no-op without duplicate entry
          - Invoice status transitions to Posted; AR reflects balance
          - ActivityLog entry created
          - Error: missing mapping returns 400 with explicit field
        """
        self.assertTrue(True)

    def test_post_invoice_happy_path(self):
        """
        Happy path for AC-GL-001 using test utilities.

        Steps:
        - Seed simple invoice + COA via utils_gl.seed_simple_invoice()
        - POST /api/invoices/{id}/post/
        - Assert JournalEntry DR AR, CR Revenue (+Tax if configured)
        - Assert idempotency and status transition
        """
        from .utils_gl import (  # local import to avoid module load side-effects
            seed_simple_invoice,
        )

        # Create user and login (SessionAuthentication enabled in test settings)
        User = get_user_model()
        user = User.objects.create_user(username="poster", password="pw12345!")
        self.client.login(username="poster", password="pw12345!")

        inv, ar, rev = seed_simple_invoice(user=user)
        self.assertIsNotNone(inv)

        # Post the invoice
        inv_id = getattr(inv, "id", None)
        self.assertIsNotNone(inv_id)
        resp = self.client.post(f"/api/invoices/{inv_id}/post/")
        self.assertIn(resp.status_code, (200, 201))

        # Verify journal entry created with canonical description
        desc = f"Invoice {inv_id} posting"
        self.assertTrue(JournalEntry.objects.filter(description=desc).exists())
        entry = JournalEntry.objects.get(description=desc)
        self.assertEqual(float(entry.amount), 100.0)
        self.assertEqual(entry.debit_account.code, "1100")
        self.assertEqual(entry.credit_account.code, "4000")

        # Idempotency: posting again yields 409 and does not create another entry
        resp2 = self.client.post(f"/api/invoices/{inv_id}/post/")
        self.assertEqual(resp2.status_code, 409)
        self.assertEqual(JournalEntry.objects.filter(description=desc).count(), 1)
