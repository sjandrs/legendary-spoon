from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from main.models import CustomUser, Warehouse, WarehouseItem


class WarehouseItemGTINTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(username="inv", password="pass12345")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.warehouse = Warehouse.objects.create(name="Main")

    def _create_item(self, **extra):
        payload = {
            "warehouse": self.warehouse.id,
            "name": "Widget",
            "item_type": "part",
            "sku": "WIDG-1",
            "quantity": 1,
            "unit_cost": 1.0,
            "minimum_stock": 0,
            **extra,
        }
        return self.client.post("/api/warehouse-items/", payload, format="json")

    def test_accepts_7_to_13_digits(self):
        # 7 digits (no check digit enforcement)
        r1 = self._create_item(gtin="1234567")
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        # 13 digits
        r2 = self.client.post(
            "/api/warehouse-items/",
            {
                "warehouse": self.warehouse.id,
                "name": "Widget2",
                "item_type": "part",
                "sku": "WIDG-2",
                "quantity": 1,
                "unit_cost": 1.0,
                "minimum_stock": 0,
                "gtin": "1234567890123",
            },
            format="json",
        )
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)

    def test_rejects_14_digit_with_bad_check(self):
        # 14 digits but wrong check digit
        bad = "12345678901234"  # likely wrong
        r = self._create_item(gtin=bad)
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        # Check for new structured error format from custom exception handler
        self.assertIn("errors", r.data)
        self.assertEqual(r.data["detail"], "Validation error")
        # Find error for gtin field
        gtin_errors = [e for e in r.data["errors"] if "gtin" in e["path"]]
        self.assertTrue(len(gtin_errors) > 0, "Expected GTIN validation error")
        self.assertIn("check digit", gtin_errors[0]["message"])

    def test_accepts_valid_14_digit(self):
        # Compute valid 14 via the API util would be ideal; use a known good pair
        # base 1234567890123 -> let backend util compute; here we compute quickly
        base = "1234567890123"
        # Compute check digit (weights 3,1 from right)
        total = 0
        for i, ch in enumerate(reversed(base), start=1):
            d = ord(ch) - 48
            total += d * (3 if (i % 2 == 1) else 1)
        mod = total % 10
        cd = 0 if mod == 0 else 10 - mod
        full = base + str(cd)

        r = self._create_item(gtin=full)
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        item_id = r.data["id"]
        # Fetch and confirm value persisted as provided
        get_r = self.client.get(f"/api/warehouse-items/{item_id}/")
        self.assertEqual(get_r.status_code, 200)
        self.assertEqual(get_r.data["gtin"], full)
