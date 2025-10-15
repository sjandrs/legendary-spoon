from django.contrib.auth import get_user_model
from django.test import TestCase

from main.models import BudgetV2, CostCenter, MonthlyDistribution


class BudgetV2ModelTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="mgr", password="x")
        # Default cost center should be seeded by migration; create if absent in test DB
        self.cc, _ = CostCenter.objects.get_or_create(
            name="General Operations", defaults={"code": "GEN"}
        )

    def test_seed_default_distribution(self):
        b = BudgetV2.objects.create(
            name="Ops 2026", year=2026, cost_center=self.cc, created_by=self.user
        )
        # Should auto-seed 12 rows
        rows = list(MonthlyDistribution.objects.filter(budget=b).order_by("month"))
        self.assertEqual(len(rows), 12)
        total = sum(float(r.percent) for r in rows)
        self.assertAlmostEqual(total, 100.0, places=2)
        self.assertEqual(rows[0].month, 1)
        self.assertEqual(rows[-1].month, 12)

    def test_month_bounds_validation(self):
        b = BudgetV2.objects.create(
            name="Ops 2027", year=2027, cost_center=self.cc, created_by=self.user
        )
        md = MonthlyDistribution(budget=b, month=0, percent=10)
        with self.assertRaises(Exception):
            md.full_clean()

        md = MonthlyDistribution(budget=b, month=13, percent=10)
        with self.assertRaises(Exception):
            md.full_clean()
