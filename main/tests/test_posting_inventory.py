from django.contrib.auth.models import Group
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from main.models import (
    Account,
    CustomUser,
    JournalEntry,
    LedgerAccount,
    LineItem,
    Project,
    ProjectType,
    Warehouse,
    WarehouseItem,
    WorkOrder,
)


class TestWorkOrderConsumptionPosting(TestCase):
    def setUp(self):
        # Manager user
        self.user = CustomUser.objects.create_user(username="manager2", password="pass")
        mgr, _ = Group.objects.get_or_create(name="Sales Manager")
        self.user.groups.add(mgr)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Defaults for accounts
        LedgerAccount.objects.get_or_create(
            code="5000", defaults={"name": "COGS", "account_type": "expense"}
        )
        LedgerAccount.objects.get_or_create(
            code="1200", defaults={"name": "Inventory", "account_type": "asset"}
        )

        # Minimal project and work order
        account = Account.objects.create(name="Umbrella Corp")
        ptype = ProjectType.objects.create(name="Service")
        self.project = Project.objects.create(
            title="HVAC Repair",
            project_type=ptype,
            assigned_to=self.user,
            account=account,
            due_date=timezone.now().date(),
        )
        self.wo = WorkOrder.objects.create(project=self.project, description="Fix unit")

        # Inventory setup
        wh = Warehouse.objects.create(name="Main WH")
        self.item = WarehouseItem.objects.create(
            warehouse=wh,
            name="Filter",
            description="Air filter",
            item_type="part",
            sku="FILT-001",
            quantity=10,
            unit_cost=5.00,
            minimum_stock=1,
        )
        # Add line item consuming 2 units at $5 cost each (total COGS = 10)
        LineItem.objects.create(
            work_order=self.wo,
            description="Filter",
            quantity=2,
            unit_price=20,
            warehouse_item=self.item,
        )

    def test_complete_posts_cogs_and_reduces_inventory(self):
        resp = self.client.post(f"/api/work-orders/{self.wo.id}/complete/")
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertIn("journal_entry_id", data)
        # Verify inventory decreased
        self.item.refresh_from_db()
        self.assertEqual(float(self.item.quantity), 8.0)
        # Verify idempotency: second call 409
        resp2 = self.client.post(f"/api/work-orders/{self.wo.id}/complete/")
        self.assertEqual(resp2.status_code, 409)

    def test_insufficient_stock_returns_conflict(self):
        # Create another line item attempting to consume more than available
        LineItem.objects.create(
            work_order=self.wo,
            description="Large consumption",
            quantity=999,
            unit_price=1,
            warehouse_item=self.item,
        )
        resp = self.client.post(f"/api/work-orders/{self.wo.id}/complete/")
        self.assertEqual(resp.status_code, 409)
        self.assertIn("error", resp.json())
