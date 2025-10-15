from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from main.models import CustomUser


class GTINUtilsTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="tester", password="pass12345"
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.url = "/api/utils/gtin/check-digit/"

    def test_get_requires_param(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        # DRF Response will include JSON body with 'detail'
        self.assertIn("detail", getattr(resp, "data", {}))

    def test_compute_from_7_digits(self):
        # Example base 1234567 -> compute check digit and normalized
        resp = self.client.get(self.url, {"gtin_base": "1234567"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["length"], 7)
        self.assertTrue(resp.data["normalized"].isdigit())
        self.assertEqual(len(resp.data["normalized"]), 14)

    def test_post_accepts_gtin_or_base(self):
        resp = self.client.post(self.url, {"gtin_base": "1234567"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        resp2 = self.client.post(self.url, {"gtin": "1234567"}, format="json")
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)

    def test_validate_14_digit_correct(self):
        # Use known valid GTIN-14: base 1234567890123 -> compute check digit 0 (example)
        # We'll instead call API to compute and then validate
        comp = self.client.post(self.url, {"gtin_base": "1234567890123"}, format="json")
        self.assertEqual(comp.status_code, 200)
        full = comp.data["normalized"]
        resp = self.client.post(self.url, {"gtin": full}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data["is_valid"])

    def test_invalid_non_digits(self):
        resp = self.client.post(self.url, {"gtin": "ABC123"}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("detail", resp.data)

    def test_invalid_length(self):
        resp = self.client.post(self.url, {"gtin": "1234"}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("detail", resp.data)
