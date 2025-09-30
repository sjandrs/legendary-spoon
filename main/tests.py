import time
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import (
    Account,
    Budget,
    Certification,
    Contact,
    CoverageArea,
    CustomUser,
    Deal,
    DealStage,
    Expense,
    Invoice,
    JournalEntry,
    LedgerAccount,
    LineItem,
    Payment,
    Project,
    Technician,
    TechnicianAvailability,
    TechnicianCertification,
    TimeEntry,
    Warehouse,
    WarehouseItem,
    WorkOrder,
    WorkOrderCertificationRequirement,
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
        self.user = CustomUser.objects.create_user(
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
        balance_sheet = reports.get_balance_sheet()
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
        self.user = CustomUser.objects.create_user(
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
        self.user = CustomUser.objects.create_user(
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


class Phase4ATechnicianManagementTests(APITestCase):
    """Comprehensive Phase 4A tests covering all user stories for technician management"""

    def setUp(self):
        """Set up test data for Phase 4A testing"""
        # Create user groups
        self.sales_manager_group = Group.objects.create(name="Sales Manager")
        self.sales_rep_group = Group.objects.create(name="Sales Rep")

        # Create test users
        self.manager_user = CustomUser.objects.create_user(
            username="manager", password="testpass123", email="manager@test.com"
        )
        self.manager_user.groups.add(self.sales_manager_group)

        self.tech_user = CustomUser.objects.create_user(
            username="tech_user", password="testpass123", email="tech@test.com"
        )
        self.tech_user.groups.add(self.sales_rep_group)

        # Create certifications
        self.hvac_cert = Certification.objects.create(
            name="HVAC Level 3",
            category="HVAC",
            tech_level=3,
            requires_renewal=True,
            renewal_period_months=24,
            issuing_authority="HVAC Certification Board",
        )

        self.electrical_cert = Certification.objects.create(
            name="Electrical Safety",
            category="Electrical",
            tech_level=2,
            requires_renewal=True,
            renewal_period_months=12,
            issuing_authority="Electrical Safety Institute",
        )

        self.welding_cert = Certification.objects.create(
            name="Welding Level 2",
            category="Welding",
            tech_level=2,
            requires_renewal=True,
            renewal_period_months=36,
        )

        # Create technicians
        self.technician1 = Technician.objects.create(
            user=self.tech_user,
            employee_id="TECH201",
            first_name="John",
            last_name="Smith",
            phone="555-0123",
            email="john.smith@company.com",
            hire_date=timezone.now().date() - timezone.timedelta(days=365),
            base_hourly_rate=35.00,
            emergency_contact={"name": "Jane Smith", "phone": "555-0124"},
        )

        self.technician2 = Technician.objects.create(
            employee_id="TECH202",
            first_name="Sarah",
            last_name="Johnson",
            phone="555-0125",
            email="sarah.johnson@company.com",
            hire_date=timezone.now().date() - timezone.timedelta(days=500),
            base_hourly_rate=40.00,
        )

        # Create test account and contact for work orders
        self.account = Account.objects.create(
            name="Test Customer Inc", owner=self.manager_user
        )

        self.contact = Contact.objects.create(
            account=self.account,
            first_name="Customer",
            last_name="Contact",
            email="customer@testcorp.com",
            phone_number="555-0123",
            title="Primary Contact",
            owner=self.manager_user,
        )

        # Create project and work order for assignment testing
        self.project = Project.objects.create(
            title="Installation Project",
            description="HVAC system installation",
            due_date=timezone.now().date() + timezone.timedelta(days=7),
            assigned_to=self.manager_user,
            contact=self.contact,
            account=self.account,
        )

        self.work_order = WorkOrder.objects.create(
            project=self.project, description="Install HVAC system"
        )

        # Set up API client
        self.client = APIClient()

    def test_user_story_1_technician_certification_management(self):
        """User Story 1: Technician Certification Management"""
        # Authenticate as manager
        self.client.force_authenticate(user=self.manager_user)

        # Scenario 1: Adding New Certification
        cert_data = {
            "certification_id": self.hvac_cert.id,
            "obtained_date": "2024-01-15",
            "expiration_date": "2026-12-31",
            "is_active": True,
        }

        response = self.client.post(
            f"/api/technicians/{self.technician1.id}/add_certification/", cert_data
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify certification was added
        tech_cert = TechnicianCertification.objects.get(
            technician=self.technician1, certification=self.hvac_cert
        )
        self.assertIsNotNone(tech_cert)
        self.assertEqual(str(tech_cert.obtained_date), "2024-01-15")
        self.assertEqual(str(tech_cert.expiration_date), "2026-12-31")

        self.assertTrue(tech_cert.is_active)
        self.assertFalse(
            tech_cert.is_expired
        )  # Should not be expired since expiration is 2026

        # Scenario 2: Certification Expiration Handling
        # Create an expired certification
        expired_cert = TechnicianCertification.objects.create(
            technician=self.technician2,
            certification=self.electrical_cert,
            obtained_date=timezone.now().date() - timezone.timedelta(days=400),
            expiration_date=timezone.now().date() - timezone.timedelta(days=10),
        )

        # Test that expired certification is identified
        self.assertTrue(expired_cert.is_expired)
        self.assertFalse(self.technician2.has_certification(self.electrical_cert))

        # Scenario 3: Multi-Certification Requirements
        # Add multiple certifications to technician1
        TechnicianCertification.objects.create(
            technician=self.technician1,
            certification=self.welding_cert,
            obtained_date=timezone.now().date() - timezone.timedelta(days=100),
            expiration_date=timezone.now().date() + timezone.timedelta(days=365),
        )

        # Refresh technician instance to see newly added certifications
        self.technician1.refresh_from_db()

        all_certs = TechnicianCertification.objects.filter(technician=self.technician1)
        all_certs = TechnicianCertification.objects.filter(technician=self.technician1)
        active_certs = self.technician1.get_active_certifications()
        # Note: has_certification method checks for active, non-expired certifications
        # The HVAC cert should be found since it expires in 2026
        self.assertTrue(
            self.technician1.has_certification(self.hvac_cert),
            f"HVAC certification not found. All certs: {all_certs.count()}, "
            f"Active: {active_certs.count()}",
        )
        self.assertTrue(
            self.technician1.has_certification(self.welding_cert),
            f"Welding certification not found. All certs: {all_certs.count()}, "
            f"Active: {active_certs.count()}",
        )

    def test_user_story_2_coverage_area_management(self):
        """User Story 2: Coverage Area Management"""
        self.client.force_authenticate(user=self.manager_user)

        # Scenario 1: Adding Coverage Areas
        coverage_data = {
            "zip_code": "90210",
            "travel_time_minutes": 15,
            "is_primary": True,
        }

        response = self.client.post(
            f"/api/technicians/{self.technician1.id}/add_coverage_area/", coverage_data
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Add additional coverage areas
        for zip_code in ["90211", "90212"]:
            self.client.post(
                f"/api/technicians/{self.technician1.id}/add_coverage_area/",
                {"zip_code": zip_code, "travel_time_minutes": 20},
            )

        # Verify coverage areas were added
        coverage_areas = self.technician1.get_coverage_areas()
        self.assertEqual(coverage_areas.count(), 3)

        # Scenario 2: Geographic Assignment Validation
        # Create coverage areas for both technicians in different areas
        CoverageArea.objects.create(
            technician=self.technician2,
            zip_code="10001",
            travel_time_minutes=10,
            is_primary=True,
        )

        # Test filtering by coverage area
        tech1_areas = set(
            self.technician1.get_coverage_areas().values_list("zip_code", flat=True)
        )
        tech2_areas = set(
            self.technician2.get_coverage_areas().values_list("zip_code", flat=True)
        )

        self.assertEqual(tech1_areas, {"90210", "90211", "90212"})
        self.assertEqual(tech2_areas, {"10001"})

        # Scenario 3: Coverage Area Conflicts (multiple technicians same area)
        # Add technician2 to same area as technician1
        CoverageArea.objects.create(
            technician=self.technician2, zip_code="90210", travel_time_minutes=25
        )

        # Verify both technicians now cover 90210
        techs_in_90210 = Technician.objects.filter(
            coverage_areas__zip_code="90210", coverage_areas__is_active=True
        ).distinct()
        self.assertEqual(techs_in_90210.count(), 2)

    def test_user_story_3_availability_scheduling(self):
        """User Story 3: Availability Scheduling"""
        self.client.force_authenticate(user=self.tech_user)

        # Scenario 1: Setting Weekly Schedule
        # Set Monday-Friday 8AM-5PM availability
        for weekday in range(5):  # Monday=0 to Friday=4
            availability_data = {
                "weekday": weekday,
                "start_time": "08:00:00",
                "end_time": "17:00:00",
            }
            response = self.client.post(
                f"/api/technicians/{self.technician1.id}/set_availability/",
                availability_data,
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify availability was set
        availability_count = TechnicianAvailability.objects.filter(
            technician=self.technician1, is_active=True
        ).count()
        self.assertEqual(availability_count, 5)

        # Scenario 2: Availability checking
        from datetime import time

        # Test availability on a weekday (Monday)
        monday = date.today() + timedelta(days=(7 - date.today().weekday()))
        self.assertTrue(
            self.technician1.is_available_on_date(monday, time(9, 0), time(16, 0))
        )

        # Test unavailability outside hours
        self.assertFalse(
            self.technician1.is_available_on_date(monday, time(18, 0), time(19, 0))
        )

        # Test weekend unavailability
        saturday = monday + timedelta(days=5)
        self.assertFalse(self.technician1.is_available_on_date(saturday))

    def test_user_story_4_work_order_assignment_integration(self):
        """User Story 4: Work Order Assignment Integration"""
        self.client.force_authenticate(user=self.manager_user)

        # Set up technician with certification and coverage area
        TechnicianCertification.objects.create(
            technician=self.technician1,
            certification=self.hvac_cert,
            obtained_date=date.today() - timedelta(days=100),
            expiration_date=date.today() + timedelta(days=365),
        )

        CoverageArea.objects.create(
            technician=self.technician1, zip_code="90210", travel_time_minutes=15
        )

        # Set availability
        from datetime import time

        TechnicianAvailability.objects.create(
            technician=self.technician1,
            weekday=1,  # Tuesday
            start_time=time(8, 0),
            end_time=time(17, 0),
        )

        # Scenario 1: Automated Assignment Matching
        # Create work order requirement
        WorkOrderCertificationRequirement.objects.create(
            work_order=self.work_order, certification=self.hvac_cert, is_required=True
        )

        # Test finding available technicians
        response = self.client.post(
            f"/api/work-orders/{self.work_order.id}/find-technicians/",
            {"zip_code": "90210"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response_data = response.json()
        self.assertEqual(response_data["total_found"], 1)
        self.assertEqual(
            response_data["technicians"][0]["employee_id"], self.technician1.employee_id
        )

        # Scenario 2: Assignment Validation
        # Test successful assignment
        response = self.client.post(
            f"/api/work-orders/{self.work_order.id}/assign-technician/",
            {"technician_id": self.technician1.id, "zip_code": "90210"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_comprehensive_api_endpoints(self):
        """Test all Phase 4A API endpoints are working"""
        self.client.force_authenticate(user=self.manager_user)

        # Test technician CRUD operations
        response = self.client.get("/api/technicians/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test certification endpoints
        response = self.client.get("/api/certifications/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test coverage area endpoints
        response = self.client.get("/api/coverage-areas/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test availability endpoints
        response = self.client.get("/api/technician-availability/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_phase4a_model_validations(self):
        """Test model validations and constraints for Phase 4A"""

        # Test technician model validations with proper transaction handling
        from django.db import IntegrityError, transaction

        # Test duplicate employee_id constraint
        with transaction.atomic():
            with self.assertRaises(
                IntegrityError
            ):  # Should fail due to duplicate employee_id
                Technician.objects.create(
                    employee_id="TECH201",  # Duplicate of existing technician
                    first_name="Test",
                    last_name="Tech",
                    phone="555-0000",
                    email="test@test.com",
                    hire_date=timezone.now().date(),
                    base_hourly_rate=30.00,
                )

        # Test certification uniqueness constraint in separate transaction
        with transaction.atomic():
            # First create a certification (should succeed)
            cert1 = TechnicianCertification.objects.create(
                technician=self.technician1,
                certification=self.hvac_cert,
                obtained_date=timezone.now().date(),
                expiration_date=timezone.now().date() + timezone.timedelta(days=365),
            )
            self.assertIsNotNone(cert1)

            # Try to create duplicate certification (should fail)
            with self.assertRaises(
                IntegrityError
            ):  # Should fail due to unique_together constraint
                TechnicianCertification.objects.create(
                    technician=self.technician1,
                    certification=self.hvac_cert,  # Same combination
                    obtained_date=timezone.now().date(),
                    expiration_date=timezone.now().date()
                    + timezone.timedelta(days=365),
                )
