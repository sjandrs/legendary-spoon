from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from main.models import BudgetV2, CostCenter, MonthlyDistribution


class BudgetV2ModelValidationTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="mgr", password="x")
        self.cc, _ = CostCenter.objects.get_or_create(
            name="General Operations", defaults={"code": "GEN"}
        )

    def test_enforces_total_100_on_12th_row_invalid(self):
        budget = BudgetV2.objects.create(
            name="Ops Model", year=2040, cost_center=self.cc, created_by=self.user
        )
        # Create 11 rows at 8.0 each = 88.0 total
        for m in range(1, 12):
            MonthlyDistribution.objects.create(
                budget=budget, month=m, percent=Decimal("8.0")
            )

        # 12th row that would lead to 96.0 total should raise ValidationError
        with self.assertRaises(ValidationError):
            MonthlyDistribution.objects.create(
                budget=budget, month=12, percent=Decimal("8.0")
            )

    def test_allows_total_100_on_12th_row_valid(self):
        budget = BudgetV2.objects.create(
            name="Ops Model 2", year=2041, cost_center=self.cc, created_by=self.user
        )
        # Create 11 rows at 8.33 each = 91.63 total
        for m in range(1, 12):
            MonthlyDistribution.objects.create(
                budget=budget, month=m, percent=Decimal("8.33")
            )

        # 12th row with 8.37 brings total to exactly 100.00
        MonthlyDistribution.objects.create(
            budget=budget, month=12, percent=Decimal("8.37")
        )
        self.assertEqual(budget.monthly_distributions.count(), 12)
