from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase


class ApiErrorAndPaginationTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="mgr", password="x")
        try:
            from django.contrib.auth.models import Group

            g, _ = Group.objects.get_or_create(name="Sales Manager")
            self.user.groups.add(g)
        except Exception:
            pass
        self.client.force_authenticate(user=self.user)  # type: ignore[attr-defined]

    def test_unauthenticated_401_accounts(self):
        anon = APIClient()
        r = anon.get(reverse("account-list"))
        self.assertEqual(getattr(r, "status_code", 0), 401)

    def test_validation_400_contacts(self):
        # Missing required fields
        url = reverse("contact-list")
        r = self.client.post(url, {"first_name": "A"}, format="json")
        self.assertEqual(r.status_code, 400)
        body = r.json()
        # Expect either DRF field errors or our {detail} pattern; accept both
        self.assertTrue(isinstance(body, dict))
        self.assertTrue("detail" in body or "last_name" in body or "account" in body)

    def test_deals_validation_400(self):
        # Create without title/account -> 400
        url = reverse("deal-list")
        r = self.client.post(url, {"value": 10}, format="json")
        self.assertEqual(r.status_code, 400)
        body = r.json()
        self.assertTrue("detail" in body or "title" in body)

    def test_pagination_edges_accounts(self):
        url = reverse("account-list")
        r = self.client.get(url, {"page": 9999})
        # DRF returns 404 for out-of-range page by default; allow 404 or last page 200 depending on customizations
        self.assertIn(r.status_code, (200, 404))
        if r.status_code == 200:
            body = r.json()
            for key in ("count", "next", "previous", "results"):
                self.assertIn(key, body)

    def test_pagination_edges_deals(self):
        url = reverse("deal-list")
        r = self.client.get(url, {"page": -1})
        # Invalid page value -> 404 or 400 depending on paginator handling
        self.assertIn(r.status_code, (400, 404))
