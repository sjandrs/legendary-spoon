from django.contrib.auth import get_user_model
from django.test import TestCase

from main.models import Account, Contact
from main.serializers import AccountSerializer, ContactSerializer, DealSerializer

User = get_user_model()


class SerializerBackcompatTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="tester", password="pass")
        self.account = Account.objects.create(name="Acme", owner=self.user)
        self.contact = Contact.objects.create(
            account=self.account,
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            owner=self.user,
        )

    def test_account_accepts_legacy_phone_number_and_exposes_phone(self):
        data = {"name": "Acme 2", "owner": self.user.id, "phone_number": "+1-555-1111"}
        serializer = AccountSerializer(data=data, context={"request": None})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        acct = serializer.save(owner=self.user)
        self.assertEqual(acct.phone, "+1-555-1111")

        out = AccountSerializer(acct).data
        # response should include both new and legacy keys
        self.assertIn("phone", out)
        self.assertIn("phone_number", out)
        self.assertEqual(out["phone"], "+1-555-1111")
        # legacy field should mirror the new field in representation
        self.assertEqual(out["phone_number"], "+1-555-1111")

    def test_contact_accepts_legacy_phone_number(self):
        data = {
            "account_id": self.account.id,
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane@example.com",
            "phone_number": "+1-555-2222",
            "owner": self.user.id,
        }
        serializer = ContactSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        contact = serializer.save(owner=self.user)
        self.assertEqual(contact.phone, "+1-555-2222")

    def test_deal_accepts_legacy_title_and_representation_contains_title(self):
        data = {
            "name": "",  # intentionally empty to force title mapping
            "title": "Big Deal",
            "account": self.account.id,
            "value": "1000.00",
            "close_date": "2025-12-31",
            "owner": self.user.id,
        }
        serializer = DealSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        deal = serializer.save(owner=self.user, account=self.account)
        self.assertEqual(deal.name, "Big Deal")

        out = DealSerializer(deal).data
        self.assertIn("name", out)
        self.assertIn("title", out)
        self.assertEqual(out["title"], out["name"])  # legacy title mirrors name
