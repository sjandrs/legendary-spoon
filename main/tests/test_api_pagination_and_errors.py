from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from main.models import Account, Contact, Deal, DealStage


class CanonicalPaginationAndErrorTests(APITestCase):
    def setUp(self):
        # Users and groups
        self.mgr_group, _ = Group.objects.get_or_create(name="Sales Manager")
        self.user = get_user_model().objects.create_user(
            username="mgr", password="testpass", email="mgr@test.com"
        )
        self.user.groups.add(self.mgr_group)

        # Seed minimal data for endpoints
        self.account = Account.objects.create(name="P1 Test Co", owner=self.user)
        self.stage = DealStage.objects.create(name="Proposal", order=1)
        self.deal = Deal.objects.create(
            title="Big Deal",
            account=self.account,
            value=1000,
            close_date=timezone.now().date(),
            owner=self.user,
            stage=self.stage,
        )
        self.contact = Contact.objects.create(
            account=self.account,
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
            owner=self.user,
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _assert_page_shape(self, payload):  # type: ignore[no-untyped-def]
        assert isinstance(payload, dict)
        for key in ("count", "next", "previous", "results"):
            assert key in payload, f"missing key {key} in pagination payload"

    def test_accounts_pagination_shape_and_boundaries(self):
        # Basic list
        resp = self.client.get("/api/accounts/")  # DRF Response with .data
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self._assert_page_shape(resp.data)

        # Boundary: invalid page
        resp = self.client.get("/api/accounts/?page=-1")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("detail", resp.data)  # type: ignore[index]

        # High page number (likely empty) should 404 by DRF default
        resp = self.client.get("/api/accounts/?page=9999")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("detail", resp.data)  # type: ignore[index]

    def test_contacts_pagination_shape(self):
        resp = self.client.get("/api/contacts/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self._assert_page_shape(resp.data)

    def test_deals_pagination_shape(self):
        resp = self.client.get("/api/deals/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self._assert_page_shape(resp.data)

    def test_validation_error_shape(self):
        # Missing required fields on POST /api/deals/
        bad = {"account": self.account.id}  # missing title, owner, etc.
        resp = self.client.post("/api/deals/", bad, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", resp.data)  # type: ignore[index]
        # Optional: presence of errors array for validation
        self.assertIn("errors", resp.data)  # type: ignore[index]
        self.assertIsInstance(resp.data["errors"], list)  # type: ignore[index]

    def test_404_shape(self):
        # Nonexistent record fetch should return {detail}
        resp = self.client.get("/api/accounts/999999/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("detail", resp.data)  # type: ignore[index]
