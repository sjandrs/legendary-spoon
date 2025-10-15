from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from main.models import CostCenter


def _login_manager(client):
    User = get_user_model()
    mgr = User.objects.create_user(username="manager", password="x")
    # Put user in Sales Manager group if present; tests rely on permission class
    try:
        from django.contrib.auth.models import Group

        g, _ = Group.objects.get_or_create(name="Sales Manager")
        mgr.groups.add(g)
    except Exception:
        pass
    client.force_authenticate(user=mgr)
    return mgr


class BudgetV2DistributionAPITests(APITestCase):
    def setUp(self):
        _login_manager(self.client)
        self.cc, _ = CostCenter.objects.get_or_create(
            name="General Operations", defaults={"code": "GEN"}
        )

    def _create_budget(self, name="Ops Dist", year=2030):
        url = reverse("budgetv2-list")
        res = self.client.post(
            url, {"name": name, "year": year, "cost_center": self.cc.id}, format="json"
        )
        self.assertEqual(res.status_code, 201, res.content)
        return res.data["id"]

    def test_update_distributions_valid(self):
        bid = self._create_budget("Ops Dist A", 2030)
        url = reverse("budgetv2-update-distributions", args=[bid])
        rows = [{"month": m, "percent": Decimal("8.33")} for m in range(1, 12)]
        # Make last month add up to 100.00
        rows.append({"month": 12, "percent": Decimal("8.37")})
        res = self.client.put(url, {"distributions": rows}, format="json")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertTrue(res.data.get("updated"))

    def test_update_distributions_invalid_total(self):
        bid = self._create_budget("Ops Dist B", 2031)
        url = reverse("budgetv2-update-distributions", args=[bid])
        rows = [{"month": m, "percent": 8.0} for m in range(1, 13)]  # 96.0 total
        res = self.client.put(url, {"distributions": rows}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("Total percent must be 100.00", str(res.content))

    def test_update_distributions_duplicate_month(self):
        bid = self._create_budget("Ops Dist C", 2032)
        url = reverse("budgetv2-update-distributions", args=[bid])
        rows = [{"month": m, "percent": 8.33} for m in range(1, 12)]
        rows += [{"month": 11, "percent": 8.37}]  # duplicate month 11
        res = self.client.put(url, {"distributions": rows}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("Duplicate month", str(res.content))

    def test_update_distributions_missing_months(self):
        bid = self._create_budget("Ops Dist D", 2033)
        url = reverse("budgetv2-update-distributions", args=[bid])
        rows = [{"month": m, "percent": 10} for m in range(1, 11)]  # only 10 rows
        res = self.client.put(url, {"distributions": rows}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("Exactly 12 months required", str(res.content))
