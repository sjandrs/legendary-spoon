import time
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone

from .models import (
    Account,
    Budget,
    Contact,
    Deal,
    DealStage,
    Expense,
    Invoice,
    JournalEntry,
    LedgerAccount,
    LineItem,
    Payment,
    Project,
    TimeEntry,
    Warehouse,
    WarehouseItem,
    WorkOrder,
    WorkOrderInvoice,
)

# from .reports import FinancialReports


class AuthTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user_model = get_user_model()
        self.user = self.user_model.objects.create_user(
            username="testuser", password="testpass"
        )

    def test_registration(self):
        response = self.client.post(
            reverse("register"),
            {
                "username": "newuser",
                "password1": "newpass123",
                "password2": "newpass123",
            },
        )
        self.assertEqual(response.status_code, 302)  # Redirect to login
        self.assertTrue(self.user_model.objects.filter(username="newuser").exists())

    def test_login_logout(self):
        login = self.client.login(username="testuser", password="testpass")
        self.assertTrue(login)
        response = self.client.get(reverse("home"))
        self.assertEqual(response.status_code, 200)
        self.client.logout()
        response = self.client.get(reverse("home"))
        self.assertEqual(response.status_code, 302)  # Redirect to login

    def test_session_expiry(self):
        self.client.login(username="testuser", password="testpass")
        session = self.client.session
        session.set_expiry(2)  # 2 seconds
        session.save()
        time.sleep(3)
        response = self.client.get(reverse("home"))
        self.assertEqual(response.status_code, 302)  # Should be logged out


class Phase1AccountingTests(TestCase):
    """Test Phase 1 Accounting Expansion features"""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="sales_manager", password="testpass"
        )
        # Add to Sales Manager group
        from django.contrib.auth.models import Group

        sales_manager_group, created = Group.objects.get_or_create(name="Sales Manager")
        self.user.groups.add(sales_manager_group)

        self.account = Account.objects.create(name="Test Account", owner=self.user)

        self.ledger_account = LedgerAccount.objects.create(
            name="Cash", code="1000", account_type="asset"
        )

    def test_ledger_account_creation(self):
        """Test LedgerAccount model creation and string representation"""
        self.assertEqual(str(self.ledger_account), "1000 - Cash (asset)")
        self.assertEqual(self.ledger_account.account_type, "asset")

    def test_journal_entry_creation(self):
        """Test JournalEntry double-entry bookkeeping"""
        debit_account = self.ledger_account
        credit_account = LedgerAccount.objects.create(
            name="Revenue", code="4000", account_type="revenue"
        )

        entry = JournalEntry.objects.create(
            date=timezone.now().date(),
            description="Test transaction",
            debit_account=debit_account,
            credit_account=credit_account,
            amount=100.00,
        )

        self.assertEqual(entry.amount, 100.00)
        self.assertEqual(str(entry), f"{entry.date}: Test transaction - 100.0")

    def test_expense_workflow(self):
        """Test expense creation and approval workflow"""
        expense = Expense.objects.create(
            date=timezone.now().date(),
            amount=150.00,
            category="travel",
            description="Business trip",
            vendor="Airline Co",
            submitted_by=self.user,
        )

        self.assertEqual(expense.amount, 150.00)
        self.assertFalse(expense.approved)
        self.assertIsNone(expense.approved_by)

        # Approve expense
        expense.approved = True
        expense.approved_by = self.user
        expense.approved_at = timezone.now()
        expense.save()

        self.assertTrue(expense.approved)
        self.assertEqual(expense.approved_by, self.user)

    def test_budget_variance_calculation(self):
        """Test budget variance calculations"""
        budget = Budget.objects.create(
            name="Q1 Marketing Budget",
            budget_type="quarterly",
            year=2025,
            quarter=1,
            categories={"marketing": 5000.00, "travel": 2000.00},
            created_by=self.user,
        )

        # Test variance calculation
        marketing_variance = budget.get_variance("marketing", 4500.00)
        self.assertEqual(marketing_variance, 500.00)  # Budget - Actual = 5000 - 4500

        travel_variance = budget.get_variance("travel", 2500.00)
        self.assertEqual(travel_variance, -500.00)  # Over budget

    def test_financial_reports_generation(self):
        """Test FinancialReports class methods"""
        try:
            from .reports import FinancialReports
        except ImportError:
            self.skipTest("FinancialReports not implemented yet")

        reports = FinancialReports()

        # Create some test data
        JournalEntry.objects.create(
            date=timezone.now().date(),
            description="Revenue",
            debit_account=self.ledger_account,
            credit_account=LedgerAccount.objects.create(
                name="Revenue", code="4000", account_type="revenue"
            ),
            amount=1000.00,
        )

        # Test balance sheet (this would need more setup for full testing)
        # For now, just ensure the method exists and doesn't crash
        # Ensure at least one asset and one liability account exist
        asset_account = self.ledger_account
        liability_account = LedgerAccount.objects.create(
            name="Accounts Payable", code="2000", account_type="liability"
        )
        # Create a journal entry for liability
        JournalEntry.objects.create(
            date=timezone.now().date(),
            description="Test liability",
            debit_account=asset_account,
            credit_account=liability_account,
            amount=500.00,
        )
        balance_sheet = reports.balance_sheet()
        self.assertIsInstance(balance_sheet, dict)
        # Check for expected keys in the balance sheet
        self.assertIn("assets", balance_sheet)
        self.assertIn("liabilities", balance_sheet)

    def test_payment_generic_relation(self):
        """Test Payment model with generic relations"""
        # Create a mock invoice for payment
        deal = Deal.objects.create(
            title="Test Deal",
            account=self.account,
            value=1000.00,
            close_date=timezone.now().date(),
            owner=self.user,
            stage=DealStage.objects.create(name="Closed Won", order=1),
        )

        invoice = Invoice.objects.create(
            deal=deal, due_date=timezone.now().date() + timedelta(days=30)
        )

        payment = Payment.objects.create(
            amount=500.00,
            payment_date=timezone.now().date(),
            method="check",
            received_by=self.user,
            content_object=invoice,
        )

        self.assertEqual(payment.amount, 500.00)
        self.assertEqual(payment.content_object, invoice)


class Phase2WorkflowTests(TestCase):
    """Test Phase 2 Workflow Automation features"""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="sales_rep", password="testpass"
        )

        self.account = Account.objects.create(name="Test Account", owner=self.user)

        self.contact = Contact.objects.create(
            account=self.account,
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            owner=self.user,
        )

        self.project = Project.objects.create(
            title="Test Project",
            description="Test project description",
            due_date=timezone.now().date() + timedelta(days=30),
            assigned_to=self.user,
            contact=self.contact,
            account=self.account,
        )

        self.warehouse = Warehouse.objects.create(
            name="Main Warehouse", manager=self.user
        )

        self.warehouse_item = WarehouseItem.objects.create(
            warehouse=self.warehouse,
            name="Test Part",
            sku="TP001",
            quantity=100,
            unit_cost=10.00,
            minimum_stock=10,
            item_type="part",
        )

    def test_work_order_creation_and_invoice_generation(self):
        """Test WorkOrder creation and invoice generation"""
        work_order = WorkOrder.objects.create(
            project=self.project, description="Install new system"
        )

        # Create line items
        LineItem.objects.create(
            work_order=work_order, description="Labor", quantity=5, unit_price=50.00
        )

        # Test invoice generation
        invoice = work_order.generate_invoice()
        self.assertIsInstance(invoice, WorkOrderInvoice)
        self.assertEqual(invoice.total_amount, 250.00)  # 5 * 50
        self.assertEqual(invoice.work_order, work_order)

    def test_inventory_adjustment_success(self):
        """Test successful inventory adjustment"""
        work_order = WorkOrder.objects.create(
            project=self.project, description="Repair job"
        )

        # Create line item linked to warehouse item
        LineItem.objects.create(
            work_order=work_order,
            description="Part replacement",
            quantity=5,
            unit_price=10.00,
            warehouse_item=self.warehouse_item,
        )

        initial_quantity = self.warehouse_item.quantity

        # Adjust inventory
        work_order.adjust_inventory()

        # Refresh from database
        self.warehouse_item.refresh_from_db()
        self.assertEqual(self.warehouse_item.quantity, initial_quantity - 5)

    def test_inventory_adjustment_insufficient_stock(self):
        """Test inventory adjustment with insufficient stock"""
        work_order = WorkOrder.objects.create(
            project=self.project, description="Large repair job"
        )

        # Create line item requesting more than available
        LineItem.objects.create(
            work_order=work_order,
            description="Part replacement",
            quantity=150,  # More than the 100 available
            unit_price=10.00,
            warehouse_item=self.warehouse_item,
        )

        # Should raise ValidationError
        with self.assertRaises(ValidationError):
            work_order.adjust_inventory()

    def test_inventory_adjustment_no_warehouse_link(self):
        """Test inventory adjustment when line item not linked to warehouse"""
        work_order = WorkOrder.objects.create(
            project=self.project, description="Service call"
        )

        # Create line item without warehouse link
        LineItem.objects.create(
            work_order=work_order,
            description="Labor only",
            quantity=5,
            unit_price=50.00
            # No warehouse_item specified
        )

        initial_quantity = self.warehouse_item.quantity

        # Should not affect inventory
        work_order.adjust_inventory()
        self.warehouse_item.refresh_from_db()
        self.assertEqual(self.warehouse_item.quantity, initial_quantity)

    def test_warehouse_item_properties(self):
        """Test WarehouseItem calculated properties"""
        # Test normal stock level
        self.assertFalse(self.warehouse_item.is_low_stock)
        self.assertEqual(self.warehouse_item.total_value, 1000.00)  # 100 * 10.00

        # Test low stock
        self.warehouse_item.quantity = 5  # Below minimum_stock of 10
        self.warehouse_item.save()
        self.assertTrue(self.warehouse_item.is_low_stock)

    def test_time_entry_creation_and_calculations(self):
        """Test TimeEntry model and calculations"""
        time_entry = TimeEntry.objects.create(
            project=self.project,
            user=self.user,
            date=timezone.now().date(),
            hours=2.5,
            description="Initial setup",
            billable=True,
            hourly_rate=50.00,
        )

        self.assertEqual(time_entry.hours, 2.5)
        self.assertEqual(time_entry.total_amount, 125.00)  # 2.5 * 50.00
        self.assertTrue(time_entry.billable)

        # Test without hourly rate
        time_entry_no_rate = TimeEntry.objects.create(
            project=self.project,
            user=self.user,
            date=timezone.now().date(),
            hours=1.0,
            description="Documentation",
        )

        self.assertEqual(time_entry_no_rate.total_amount, 0)

    def test_work_order_invoice_overdue_logic(self):
        """Test WorkOrderInvoice overdue detection"""
        work_order = WorkOrder.objects.create(
            project=self.project, description="Test work"
        )

        future_date = timezone.now().date() + timedelta(days=30)
        invoice = WorkOrderInvoice.objects.create(
            work_order=work_order,
            issued_date=timezone.now().date(),
            due_date=future_date,
            total_amount=100.00,
        )

        # Should not be overdue
        self.assertFalse(invoice.is_overdue())
        self.assertEqual(invoice.days_overdue(), 0)

        # Make it overdue
        invoice.due_date = timezone.now().date() - timedelta(days=5)
        invoice.save()

        self.assertTrue(invoice.is_overdue())
        self.assertEqual(invoice.days_overdue(), 5)


class WorkflowAutomationTests(TestCase):
    """Test automatic workflow triggers"""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="sales_user", password="testpass"
        )

        self.account = Account.objects.create(name="Test Corp", owner=self.user)

        self.contact = Contact.objects.create(
            account=self.account,
            first_name="Jane",
            last_name="Smith",
            email="jane@test.com",
            owner=self.user,
        )

        self.deal_stage = DealStage.objects.create(name="Proposal", order=1)

    def test_deal_to_project_conversion_signal(self):
        """Test that winning a deal automatically creates a project"""
        deal = Deal.objects.create(
            title="New Deal",
            account=self.account,
            primary_contact=self.contact,
            stage=self.deal_stage,
            value=5000.00,
            close_date=timezone.now().date(),
            owner=self.user,
            status="in_progress",
        )

        # Initially no projects
        self.assertEqual(Project.objects.count(), 0)

        # Change deal status to 'won' - this should trigger the signal
        deal.status = "won"
        deal.save()

        # Should now have a project
        self.assertEqual(Project.objects.count(), 1)
        project = Project.objects.first()
        self.assertEqual(project.title, f"Project for {deal.title}")
        self.assertEqual(project.deal, deal)
        self.assertEqual(project.contact, self.contact)
        self.assertEqual(project.account, self.account)

        # Project should have a work order
        self.assertEqual(WorkOrder.objects.count(), 1)
        work_order = WorkOrder.objects.first()
        self.assertEqual(work_order.project, project)


class PermissionsTests(TestCase):
    """Test role-based permissions and data access control"""

    def setUp(self):
        from django.contrib.auth.models import Group

        # Create users with different roles
        self.sales_rep = get_user_model().objects.create_user(
            username="sales_rep", password="testpass"
        )
        self.sales_manager = get_user_model().objects.create_user(
            username="sales_manager", password="testpass"
        )

        # Create groups
        sales_rep_group, _ = Group.objects.get_or_create(name="Sales Rep")
        sales_manager_group, _ = Group.objects.get_or_create(name="Sales Manager")

        self.sales_rep.groups.add(sales_rep_group)
        from rest_framework.test import APIRequestFactory

        from main.api_views import AccountViewSet

        factory = APIRequestFactory()

        # Sales rep should only see their own account
        request_rep = factory.get("/api/accounts/")
        request_rep.user = self.sales_rep
        viewset = AccountViewSet()
        viewset.request = request_rep
        queryset = viewset.get_queryset()
        accounts = list(queryset)
        self.assertEqual(len(accounts), 1)
        self.assertEqual(accounts[0], self.rep_account)

        # Sales manager should see all accounts
        request_manager = factory.get("/api/accounts/")
        request_manager.user = self.sales_manager
        viewset.request = request_manager
        queryset = viewset.get_queryset()
        accounts = list(queryset)
        self.assertEqual(len(accounts), 2)  # Both accounts

        # Sales rep should only see their own account
        viewset = AccountViewSet()
        viewset.request = type("Request", (), {"user": self.sales_rep})()
        queryset = viewset.get_queryset()
        accounts = list(queryset)
        self.assertEqual(len(accounts), 1)
        self.assertEqual(accounts[0], self.rep_account)

        # Sales manager should see all accounts
        viewset.request = type("Request", (), {"user": self.sales_manager})()
        queryset = viewset.get_queryset()
        accounts = list(queryset)
        self.assertEqual(len(accounts), 2)  # Both accounts
