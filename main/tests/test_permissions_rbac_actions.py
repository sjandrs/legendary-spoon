from django.contrib.auth.models import Group
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from main.models import (
    Account,
    CustomUser,
    Deal,
    DealStage,
    Invoice,
    InvoiceItem,
    Payment,
    Project,
    WorkOrder,
)


class RBACActionPermissionsTests(APITestCase):
    """RBAC checks for posting/allocate actions: 401 for unauthenticated, 2xx/409 for authenticated."""

    def setUp(self):
        # Manager user (allowed)
        self.user = CustomUser.objects.create_user(
            username="mgr_actions", password="pass"
        )
        mgr, _ = Group.objects.get_or_create(name="Sales Manager")
        self.user.groups.add(mgr)

        # Authenticated client
        self.client_auth = APIClient()
        self.client_auth.force_authenticate(user=self.user)

        # Minimal invoice
        stage = DealStage.objects.create(name="Closed Won", order=1)
        account = Account.objects.create(name="Acme Inc")
        deal = Deal.objects.create(
            title="Deal",
            account=account,
            stage=stage,
            value=100,
            close_date=timezone.now().date(),
            owner=self.user,
        )
        self.invoice = Invoice.objects.create(deal=deal, due_date=timezone.now().date())
        InvoiceItem.objects.create(
            invoice=self.invoice, description="Item", quantity=2, unit_price=50
        )

        # Minimal work order
        self.project = Project.objects.create(
            title="Proj",
            assigned_to=self.user,
            account=account,
            due_date=timezone.now().date(),
        )
        self.work_order = WorkOrder.objects.create(
            project=self.project, description="WO"
        )

        # Minimal payment linked to invoice
        from django.contrib.contenttypes.models import ContentType

        invoice_ct = ContentType.objects.get_for_model(Invoice)
        self.payment = Payment.objects.create(
            amount=10,
            payment_date=timezone.now().date(),
            method="card",
            content_type=invoice_ct,
            object_id=self.invoice.id,
        )

    def test_invoice_post_requires_auth(self):
        # Unauthenticated
        inv_id = getattr(self.invoice, "id", None)
        resp_unauth = APIClient().post(f"/api/invoices/{inv_id}/post/")
        self.assertIn(
            getattr(resp_unauth, "status_code", 0),
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
        # Authenticated
        resp_auth = self.client_auth.post(f"/api/invoices/{inv_id}/post/")
        self.assertIn(
            getattr(resp_auth, "status_code", 0),
            (status.HTTP_200_OK, status.HTTP_201_CREATED),
        )

    def test_work_order_actions_require_auth(self):
        # complete
        wo_id = getattr(self.work_order, "id", None)
        resp_unauth_complete = APIClient().post(f"/api/work-orders/{wo_id}/complete/")
        self.assertIn(
            getattr(resp_unauth_complete, "status_code", 0),
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
        resp_auth_complete = self.client_auth.post(
            f"/api/work-orders/{wo_id}/complete/"
        )
        self.assertIn(
            getattr(resp_auth_complete, "status_code", 0),
            (status.HTTP_200_OK, status.HTTP_201_CREATED, status.HTTP_409_CONFLICT),
        )
        # generate-invoice
        resp_unauth_gen = APIClient().post(
            f"/api/work-orders/{wo_id}/generate-invoice/"
        )
        self.assertIn(
            getattr(resp_unauth_gen, "status_code", 0),
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
        resp_auth_gen = self.client_auth.post(
            f"/api/work-orders/{wo_id}/generate-invoice/"
        )
        self.assertIn(
            getattr(resp_auth_gen, "status_code", 0),
            (status.HTTP_200_OK, status.HTTP_201_CREATED),
        )

    def test_payment_allocate_requires_auth(self):
        # Unauthenticated
        pay_id = getattr(self.payment, "id", None)
        resp_unauth = APIClient().post(f"/api/payments/{pay_id}/allocate/")
        self.assertIn(
            getattr(resp_unauth, "status_code", 0),
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
        # Authenticated (manager)
        resp_auth = self.client_auth.post(f"/api/payments/{pay_id}/allocate/")
        self.assertIn(
            getattr(resp_auth, "status_code", 0),
            (
                status.HTTP_200_OK,
                status.HTTP_201_CREATED,
                status.HTTP_409_CONFLICT,
                status.HTTP_400_BAD_REQUEST,
            ),
        )

    def test_budget_v2_requires_financial_permission(self):
        """Test that BudgetV2 endpoints require proper permissions"""
        # Create a cost center for testing
        from main.models import CostCenter

        cc = CostCenter.objects.create(name="Test CC", code="TST")

        # Test GET list - should work for manager
        resp_auth = self.client_auth.get("/api/budgets-v2/")
        self.assertIn(resp_auth.status_code, (status.HTTP_200_OK,))

        # Test POST create - should work for manager
        payload = {"name": "Test Budget 2026", "year": 2026, "cost_center": cc.id}
        resp_create = self.client_auth.post("/api/budgets-v2/", payload, format="json")
        self.assertIn(resp_create.status_code, (status.HTTP_201_CREATED,))

        if resp_create.status_code == status.HTTP_201_CREATED:
            budget_id = resp_create.data["id"]

            # Test PUT update - should work for manager
            resp_update = self.client_auth.put(
                f"/api/budgets-v2/{budget_id}/", payload, format="json"
            )
            self.assertIn(resp_update.status_code, (status.HTTP_200_OK,))

            # Test custom action seed-default - should work for manager
            resp_seed = self.client_auth.post(
                f"/api/budgets-v2/{budget_id}/seed-default/"
            )
            self.assertIn(resp_seed.status_code, (status.HTTP_200_OK,))

        # Test unauthenticated access - should fail
        unauth_client = APIClient()
        resp_unauth = unauth_client.get("/api/budgets-v2/")
        self.assertIn(
            resp_unauth.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
