from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from main.models import (
    ActivityLog,
    DigitalSignature,
    InventoryReservation,
    Project,
    ScheduledEvent,
    WarehouseItem,
    WorkOrder,
    WorkOrderInvoice,
)


class ActivityLogEndpointsTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="tester", password="pass", email="t@example.com"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_send_invoice_email_logs_activity(self):
        # Minimal WorkOrder/Invoice
        project = Project.objects.create(title="P1", created_by=self.user)
        wo = WorkOrder.objects.create(project=project)
        inv = WorkOrderInvoice.objects.create(
            work_order=wo,
            total_amount=10,
            issued_date=timezone.now().date(),
            due_date=timezone.now().date(),
        )
        inv_id = getattr(inv, "id", None)
        url = reverse("send_invoice_email", kwargs={"invoice_id": inv_id})
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(
            ActivityLog.objects.filter(action="email_sent", object_id=inv_id).exists()
        )

    def test_signature_verify_logs_activity(self):
        # Signature with minimal required fields
        sig = DigitalSignature.objects.create(
            signer_email="t@example.com", signature_data="abc123"
        )
        sig_id = getattr(sig, "id", None)
        url = reverse("digitalsignature-verify", kwargs={"pk": sig_id})
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(
            ActivityLog.objects.filter(action="update", object_id=sig_id).exists()
        )

    def test_inventory_consume_logs_activity(self):
        project = Project.objects.create(title="P2", created_by=self.user)
        wo = WorkOrder.objects.create(project=project)
        event = ScheduledEvent.objects.create(
            work_order=wo, start_time=timezone.now(), end_time=timezone.now()
        )
        item = WarehouseItem.objects.create(
            name="Widget", sku="W1", quantity=10, minimum_stock=1, unit_cost=1
        )
        res = InventoryReservation.objects.create(
            scheduled_event=event, warehouse_item=item, quantity_reserved=5
        )
        res_id = getattr(res, "id", None)
        url = reverse("inventoryreservation-consume", kwargs={"pk": res_id})
        resp = self.client.post(url, {"quantity_used": 2}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(
            ActivityLog.objects.filter(action="update", object_id=res_id).exists()
        )
