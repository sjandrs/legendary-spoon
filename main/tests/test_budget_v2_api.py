from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from main.models import CostCenter


class BudgetV2APITests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="mgr", password="x")
        # Ensure permissions align with FinancialDataPermission by adding to manager group
        try:
            from django.contrib.auth.models import Group

            g, _ = Group.objects.get_or_create(name="Sales Manager")
            self.user.groups.add(g)
        except Exception:
            pass
        self.client.force_authenticate(user=self.user)
        self.cc, _ = CostCenter.objects.get_or_create(
            name="General Operations", defaults={"code": "GEN"}
        )

    def test_create_budget_v2_seeds_distributions(self):
        url = reverse("budgetv2-list")
        res = self.client.post(
            url,
            {
                "name": "Ops 2028",
                "year": 2028,
                "cost_center": self.cc.id,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        detail_url = reverse("budgetv2-detail", args=[res.data["id"]])
        res2 = self.client.get(detail_url)
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(len(res2.data.get("distributions") or []), 12)

    def test_seed_default_action(self):
        url = reverse("budgetv2-list")
        res = self.client.post(
            url,
            {
                "name": "Ops 2029",
                "year": 2029,
                "cost_center": self.cc.id,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        reseed_url = reverse("budgetv2-seed-default", args=[res.data["id"]])
        res3 = self.client.post(reseed_url)
        self.assertEqual(res3.status_code, 200)
        self.assertTrue(res3.data.get("seeded"))

    def test_create_budget_v2_with_nested_distributions(self):
        url = reverse("budgetv2-list")
        rows = [{"month": m, "percent": 8.33} for m in range(1, 12)]
        rows.append({"month": 12, "percent": 8.37})
        res = self.client.post(
            url,
            {
                "name": "Ops 2035",
                "year": 2035,
                "cost_center": self.cc.id,
                "distributions": rows,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        detail_url = reverse("budgetv2-detail", args=[res.data["id"]])
        res2 = self.client.get(detail_url)
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(len(res2.data.get("distributions") or []), 12)

    def test_create_budget_v2_with_invalid_total_fails(self):
        url = reverse("budgetv2-list")
        rows = [{"month": m, "percent": 8.0} for m in range(1, 13)]  # 96 total
        res = self.client.post(
            url,
            {
                "name": "Ops 2036",
                "year": 2036,
                "cost_center": self.cc.id,
                "distributions": rows,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("100.00", str(res.content))

    def test_update_budget_v2_with_nested_distributions(self):
        # Create minimal budget (will seed defaults)
        url = reverse("budgetv2-list")
        res = self.client.post(
            url,
            {
                "name": "Ops 2037",
                "year": 2037,
                "cost_center": self.cc.id,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        bid = res.data["id"]

        # Now PATCH with explicit distributions replacement
        rows = [{"month": m, "percent": 8.33} for m in range(1, 12)]
        rows.append({"month": 12, "percent": 8.37})
        detail_url = reverse("budgetv2-detail", args=[bid])
        res2 = self.client.patch(detail_url, {"distributions": rows}, format="json")
        self.assertIn(res2.status_code, (200, 202)), res2.content
        # Verify persisted rows
        res3 = self.client.get(detail_url)
        self.assertEqual(res3.status_code, 200)
        self.assertEqual(len(res3.data.get("distributions") or []), 12)

    def test_update_budget_v2_with_nested_invalid_total(self):
        # Create minimal budget
        url = reverse("budgetv2-list")
        res = self.client.post(
            url,
            {
                "name": "Ops 2038",
                "year": 2038,
                "cost_center": self.cc.id,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        bid = res.data["id"]

        # Attempt invalid update (total 96)
        bad_rows = [{"month": m, "percent": 8.0} for m in range(1, 13)]
        detail_url = reverse("budgetv2-detail", args=[bid])
        res2 = self.client.patch(detail_url, {"distributions": bad_rows}, format="json")
        self.assertEqual(res2.status_code, 400)
        self.assertIn("100.00", str(res2.content))
