from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase


class PermissionTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        # Create groups
        self.sales_manager_group, _ = Group.objects.get_or_create(name="Sales Manager")
        # Users
        self.rep = User.objects.create_user(username="rep", password="pass")
        self.mgr = User.objects.create_user(username="mgr", password="pass")
        self.mgr.groups.add(self.sales_manager_group)

    def _client_for(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c

    def test_payments_list_permissions(self):
        url = reverse("payment-list")
        # Rep forbidden
        resp_rep = self._client_for(self.rep).get(url)
        self.assertEqual(getattr(resp_rep, "status_code", 0), 403)
        # Manager allowed
        resp_mgr = self._client_for(self.mgr).get(url)
        self.assertIn(getattr(resp_mgr, "status_code", 0), (200, 204))

    def test_journal_entries_list_permissions(self):
        url = reverse("journalentry-list")
        resp_rep = self._client_for(self.rep).get(url)
        self.assertEqual(getattr(resp_rep, "status_code", 0), 403)
        resp_mgr = self._client_for(self.mgr).get(url)
        self.assertIn(getattr(resp_mgr, "status_code", 0), (200, 204))

    def test_custom_field_values_list_permissions(self):
        url = reverse("customfieldvalue-list")
        resp_rep = self._client_for(self.rep).get(url)
        # Expect forbidden for non-managers (sensitive data)
        self.assertEqual(getattr(resp_rep, "status_code", 0), 403)
        resp_mgr = self._client_for(self.mgr).get(url)
        self.assertIn(getattr(resp_mgr, "status_code", 0), (200, 204))

    def test_ledger_account_hierarchy_permissions(self):
        url = reverse("ledgeraccount-hierarchy")
        resp_rep = self._client_for(self.rep).get(url)
        self.assertEqual(getattr(resp_rep, "status_code", 0), 403)
        resp_mgr = self._client_for(self.mgr).get(url)
        self.assertEqual(getattr(resp_mgr, "status_code", 0), 200)
