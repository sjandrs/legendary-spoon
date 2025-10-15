from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework.test import APIClient

from main.models import Account, Contact, CustomUser


class TestContactsRBAC(TestCase):
    def setUp(self):
        self.u1 = CustomUser.objects.create_user(username="alice", password="pw")
        self.u2 = CustomUser.objects.create_user(username="bob", password="pw")
        self.mgr = CustomUser.objects.create_user(username="manager", password="pw")
        mgr_group, _ = Group.objects.get_or_create(name="Sales Manager")
        self.mgr.groups.add(mgr_group)

        acct1 = Account.objects.create(name="Acme", owner=self.u1)
        acct2 = Account.objects.create(name="Blu", owner=self.u2)
        Contact.objects.create(
            first_name="A",
            last_name="One",
            email="a1@example.com",
            account=acct1,
            owner=self.u1,
        )
        Contact.objects.create(
            first_name="B",
            last_name="Two",
            email="b2@example.com",
            account=acct2,
            owner=self.u2,
        )
        self.client = APIClient()

    def test_non_manager_sees_only_own_contacts(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.get("/api/contacts/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # Allow for paginated or non-paginated responses
        results = data.get("results", data)
        self.assertTrue(all(item.get("owner") == self.u1.id for item in results))
        self.assertEqual(len(results), 1)

    def test_manager_sees_all_contacts(self):
        self.client.force_authenticate(user=self.mgr)
        resp = self.client.get("/api/contacts/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        results = data.get("results", data)
        self.assertGreaterEqual(len(results), 2)

    def test_non_manager_cannot_retrieve_others_contact(self):
        other_contact = Contact.objects.exclude(owner=self.u1).first()
        self.client.force_authenticate(user=self.u1)
        r = self.client.get(f"/api/contacts/{getattr(other_contact, 'id', 0)}/")
        # Should be 404 due to queryset scoping
        self.assertEqual(r.status_code, 404)
