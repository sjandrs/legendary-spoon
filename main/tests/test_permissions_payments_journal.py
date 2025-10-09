from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from main.models import JournalEntry, LedgerAccount, Payment


class PaymentJournalPermissionNegatives(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.rep = User.objects.create_user(username="rep_pj", password="pass")
        self.mgr = User.objects.create_user(username="mgr_pj", password="pass")
        mgr_group, _ = Group.objects.get_or_create(name="Sales Manager")
        self.mgr.groups.add(mgr_group)

        # Minimal journal entry setup
        self.cash = LedgerAccount.objects.create(name="Cash", code="1000", type="asset")
        self.rev = LedgerAccount.objects.create(
            name="Revenue", code="4000", type="revenue"
        )
        self.je = JournalEntry.objects.create(
            date=timezone.now().date(),
            description="Test entry",
            debit_account=self.cash,
            credit_account=self.rev,
            amount=100,
        )

        # Minimal payment
        self.payment = Payment.objects.create(amount=50)

    def _client_for(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c

    def test_payment_put_delete_forbidden_for_rep(self):
        url = reverse(
            "payment-detail", kwargs={"pk": getattr(self.payment, "id", None)}
        )
        # PUT
        resp_put = self._client_for(self.rep).put(url, {"amount": 60}, format="json")
        self.assertEqual(getattr(resp_put, "status_code", 0), 403)
        # DELETE
        resp_del = self._client_for(self.rep).delete(url)
        self.assertEqual(getattr(resp_del, "status_code", 0), 403)

        # Manager allowed (PUT may still validate; accept 200/400)
        resp_put_mgr = self._client_for(self.mgr).put(
            url, {"amount": 70}, format="json"
        )
        self.assertIn(getattr(resp_put_mgr, "status_code", 0), (200, 400))
        resp_del_mgr = self._client_for(self.mgr).delete(url)
        self.assertIn(getattr(resp_del_mgr, "status_code", 0), (200, 204, 404))

    def test_journalentry_put_delete_forbidden_for_rep(self):
        url = reverse(
            "journalentry-detail", kwargs={"pk": getattr(self.je, "id", None)}
        )
        resp_put = self._client_for(self.rep).put(
            url,
            {
                "date": str(self.je.date),
                "description": "Updated",
                "debit_account": getattr(self.cash, "id", None),
                "credit_account": getattr(self.rev, "id", None),
                "amount": 150,
            },
            format="json",
        )
        self.assertEqual(getattr(resp_put, "status_code", 0), 403)
        resp_del = self._client_for(self.rep).delete(url)
        self.assertEqual(getattr(resp_del, "status_code", 0), 403)

        # Manager allowed
        resp_put_mgr = self._client_for(self.mgr).put(
            url,
            {
                "date": str(self.je.date),
                "description": "Updated by mgr",
                "debit_account": getattr(self.cash, "id", None),
                "credit_account": getattr(self.rev, "id", None),
                "amount": 175,
            },
            format="json",
        )
        self.assertIn(getattr(resp_put_mgr, "status_code", 0), (200, 400))
        resp_del_mgr = self._client_for(self.mgr).delete(url)
        self.assertIn(getattr(resp_del_mgr, "status_code", 0), (200, 204, 404))
