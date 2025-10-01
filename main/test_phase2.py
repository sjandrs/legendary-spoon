"""
Tests for Phase 2: Backend - Services & Automation
Advanced Field Service Management Module
"""

import os
import tempfile
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone

from .celery_tasks import (
    generate_daily_analytics_snapshot,
    process_post_appointment_workflow,
    process_recurring_appointments,
    reserve_inventory_for_appointment,
    send_daily_appointment_reminders,
    send_technician_assignment_notification,
)
from .inventory_service import InventoryService, get_inventory_service
from .map_service import get_map_service
from .models import (
    Account,
    Contact,
    CustomUser,
    InventoryReservation,
    NotificationLog,
    Project,
    ScheduledEvent,
    SchedulingAnalytics,
    Technician,
    Warehouse,
    WarehouseItem,
    WorkOrder,
)
from .notification_service import NotificationService, get_notification_service
from .pdf_service import get_pdf_service

# Conditional imports for services that may have external dependencies
try:
    from .pdf_service import PDFService

    PDF_SERVICE_AVAILABLE = True
except ImportError:
    PDF_SERVICE_AVAILABLE = False

try:
    from .map_service import MapService

    MAP_SERVICE_AVAILABLE = True
except ImportError:
    MAP_SERVICE_AVAILABLE = False


class Phase2CeleryTaskTests(TestCase):
    """Test Phase 2 Celery tasks and automation"""

    def setUp(self):
        # Create test users
        self.user = CustomUser.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.technician_user = CustomUser.objects.create_user(
            username="techuser", email="tech@example.com", password="testpass123"
        )

        # Create test data
        self.account = Account.objects.create(name="Test Account", owner=self.user)

        self.contact = Contact.objects.create(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone_number="+1234567890",
            account=self.account,
            owner=self.user,
        )

        self.technician = Technician.objects.create(
            employee_id="TECH001",
            first_name="Tech",
            last_name="Smith",
            email="tech@example.com",
            phone="+1234567891",
            hire_date="2024-01-01",
            base_hourly_rate=25.00,
            user=self.technician_user,
            is_active=True,
        )

        self.project = Project.objects.create(
            title="Test Project",
            description="Test Description",
            account=self.account,
            contact=self.contact,
            assigned_to=self.user,
            created_by=self.user,
            due_date=timezone.now().date() + timedelta(days=30),
        )

        self.work_order = WorkOrder.objects.create(
            project=self.project, description="Test Work Order", status="pending"
        )

    def test_send_daily_appointment_reminders_task(self):
        """Test the daily appointment reminders Celery task"""
        # Create a scheduled event for tomorrow
        tomorrow = timezone.now() + timedelta(days=1)
        scheduled_event = ScheduledEvent.objects.create(
            work_order=self.work_order,
            technician=self.technician,
            start_time=tomorrow,
            end_time=tomorrow + timedelta(hours=2),
            status="scheduled",
        )

        # Mock the management command
        with patch("main.celery_tasks.call_command") as mock_call_command:
            result = send_daily_appointment_reminders()

            # Assert command was called
            mock_call_command.assert_called_once_with(
                "send_appointment_reminders", "--days-ahead=1"
            )
            self.assertEqual(result, "Appointment reminders sent successfully")

    def test_process_recurring_appointments_task(self):
        """Test the recurring appointments processing Celery task"""
        with patch("main.celery_tasks.call_command") as mock_call_command:
            result = process_recurring_appointments()

            # Assert command was called
            mock_call_command.assert_called_once_with(
                "process_recurrence_rules", "--days-ahead=30"
            )
            self.assertEqual(result, "Recurring appointments processed successfully")

    def test_generate_daily_analytics_snapshot_task(self):
        """Test the daily analytics snapshot Celery task"""
        with patch("main.celery_tasks.call_command") as mock_call_command:
            result = generate_daily_analytics_snapshot()

            # Assert command was called
            mock_call_command.assert_called_once_with("generate_analytics_snapshot")
            self.assertEqual(result, "Analytics snapshot generated successfully")

    @patch("main.notification_service.get_notification_service")
    def test_send_technician_assignment_notification_task(self, mock_get_service):
        """Test technician assignment notification task"""
        # Create scheduled event
        scheduled_event = ScheduledEvent.objects.create(
            work_order=self.work_order,
            technician=self.technician,
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=3),
            status="scheduled",
        )

        # Mock the notification service
        mock_service = MagicMock()
        mock_service.send_technician_assignment.return_value = True
        mock_get_service.return_value = mock_service

        # Run the task
        result = send_technician_assignment_notification(scheduled_event.id)

        # Assert notification was sent
        mock_service.send_technician_assignment.assert_called_once_with(scheduled_event)
        self.assertEqual(result, "Technician notification sent successfully")

    @patch("main.inventory_service.get_inventory_service")
    def test_reserve_inventory_for_appointment_task(self, mock_get_service):
        """Test inventory reservation task"""
        # Create scheduled event
        scheduled_event = ScheduledEvent.objects.create(
            work_order=self.work_order,
            technician=self.technician,
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=3),
            status="scheduled",
        )

        # Mock the inventory service
        mock_service = MagicMock()
        mock_service.reserve_items_for_event.return_value = [
            {"id": 1, "sku": "TEST-001"}
        ]
        mock_get_service.return_value = mock_service

        # Run the task
        result = reserve_inventory_for_appointment(scheduled_event.id)

        # Assert inventory was reserved
        mock_service.reserve_items_for_event.assert_called_once_with(scheduled_event)
        self.assertEqual(result, "Reserved 1 inventory items")


class Phase2ManagementCommandTests(TestCase):
    """Test Phase 2 management commands"""

    def setUp(self):
        # Create test data
        self.user = CustomUser.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.technician_user = CustomUser.objects.create_user(
            username="techuser", email="tech@example.com", password="testpass123"
        )

        self.account = Account.objects.create(name="Test Account", owner=self.user)

        self.contact = Contact.objects.create(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            account=self.account,
            owner=self.user,
        )

        self.technician = Technician.objects.create(
            employee_id="TECH002",
            first_name="Tech",
            last_name="Smith",
            email="tech@example.com",
            phone="+1234567891",
            hire_date="2024-01-01",
            base_hourly_rate=25.00,
            user=self.technician_user,
            is_active=True,
        )

    def test_process_recurrence_rules_command(self):
        """Test the process_recurrence_rules management command"""
        # Create a parent event with weekly recurrence
        parent_event = ScheduledEvent.objects.create(
            work_order=WorkOrder.objects.create(
                project=Project.objects.create(
                    title="Test Project",
                    account=self.account,
                    contact=self.contact,
                    assigned_to=self.user,
                    created_by=self.user,
                ),
                description="Recurring Work Order",
            ),
            technician=self.technician,
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=2),
            status="scheduled",
            recurrence_pattern="weekly",
        )

        # Run command with dry-run
        call_command("process_recurrence_rules", "--dry-run", "--days-ahead=14")

        # No events should be created in dry-run mode
        recurring_events = ScheduledEvent.objects.filter(parent_event=parent_event)
        self.assertEqual(recurring_events.count(), 0)

        # Run command for real
        call_command("process_recurrence_rules", "--days-ahead=14")

        # Should create recurring events
        recurring_events = ScheduledEvent.objects.filter(parent_event=parent_event)
        self.assertGreater(recurring_events.count(), 0)

    @patch("main.notification_service.NotificationService.send_customer_reminder")
    def test_send_appointment_reminders_command(self, mock_send_reminder):
        """Test the send_appointment_reminders management command"""
        # Create scheduled event for tomorrow
        tomorrow = timezone.now() + timedelta(days=1)
        scheduled_event = ScheduledEvent.objects.create(
            work_order=WorkOrder.objects.create(
                project=Project.objects.create(
                    title="Test Project",
                    account=self.account,
                    contact=self.contact,
                    assigned_to=self.user,
                    created_by=self.user,
                ),
                description="Test Work Order",
            ),
            technician=self.technician,
            start_time=tomorrow,
            end_time=tomorrow + timedelta(hours=2),
            status="scheduled",
        )

        # Mock successful reminder sending
        mock_send_reminder.return_value = True

        # Run command with dry-run
        call_command("send_appointment_reminders", "--dry-run")

        # Should not actually send in dry-run mode
        mock_send_reminder.assert_not_called()

        # Run command for real
        call_command("send_appointment_reminders")

        # Should send reminder
        mock_send_reminder.assert_called_once()

    def test_generate_analytics_snapshot_command(self):
        """Test the generate_analytics_snapshot management command"""
        # Create some test data for analytics
        yesterday = timezone.now() - timedelta(days=1)

        # Create completed scheduled event from yesterday
        scheduled_event = ScheduledEvent.objects.create(
            work_order=WorkOrder.objects.create(
                project=Project.objects.create(
                    title="Test Project",
                    account=self.account,
                    contact=self.contact,
                    assigned_to=self.user,
                    created_by=self.user,
                ),
                description="Test Work Order",
            ),
            technician=self.technician,
            start_time=yesterday,
            end_time=yesterday + timedelta(hours=2),
            status="completed",
        )

        # Run command with dry-run
        call_command("generate_analytics_snapshot", "--dry-run")

        # No snapshot should be created in dry-run mode
        snapshots = SchedulingAnalytics.objects.all()
        self.assertEqual(snapshots.count(), 0)

        # Run command for real
        call_command("generate_analytics_snapshot")

        # Should create analytics snapshot
        snapshots = SchedulingAnalytics.objects.all()
        self.assertEqual(snapshots.count(), 1)

        snapshot = snapshots.first()
        self.assertEqual(snapshot.total_appointments, 1)
        self.assertEqual(snapshot.completed_appointments, 1)
        self.assertEqual(snapshot.completion_rate, 100.0)


class Phase2ServiceIntegrationTests(TestCase):
    """Test integration between Phase 2 services"""

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    @override_settings(TWILIO_ACCOUNT_SID="test_sid", TWILIO_AUTH_TOKEN="test_token")
    @patch("main.notification_service.get_notification_service")
    def test_notification_service_sms_integration(self, mock_get_service):
        """Test SMS integration in notification service"""
        # Mock service
        mock_service = MagicMock()
        mock_service.send_sms.return_value = {"success": True, "sid": "test_sid"}
        mock_get_service.return_value = mock_service

        # Test SMS sending
        service = get_notification_service()
        result = service.send_sms(
            recipient="+1234567890", message="Test message", content_object=None
        )

        # Should have attempted to send SMS
        self.assertTrue(result["success"])
        self.assertEqual(result["sid"], "test_sid")

    @override_settings(GOOGLE_MAPS_API_KEY="test_api_key")
    @patch("main.map_service.googlemaps")
    def test_map_service_integration(self, mock_googlemaps):
        """Test Google Maps integration in map service"""
        if not MAP_SERVICE_AVAILABLE:
            self.skipTest("Map service not available due to missing dependencies")

        # Mock Google Maps client
        mock_client = MagicMock()
        mock_googlemaps.Client.return_value = mock_client

        # Mock response
        mock_client.distance_matrix.return_value = {
            "status": "OK",
            "rows": [
                {
                    "elements": [
                        {
                            "status": "OK",
                            "distance": {"text": "10 km", "value": 10000},
                            "duration": {"text": "15 mins", "value": 900},
                        }
                    ]
                }
            ],
        }

        # Create map service
        service = MapService()

        # Test travel time calculation
        result = service.calculate_travel_time(
            origin="123 Main St", destination="456 Oak Ave"
        )

        self.assertIsNotNone(result)
        self.assertEqual(result["duration_minutes"], 15)
        self.assertEqual(result["distance_meters"], 10000)

    def test_inventory_service_integration(self):
        """Test inventory service integration"""
        # Create test data
        warehouse = Warehouse.objects.create(
            name="Test Warehouse", location="123 Storage St"
        )
        warehouse_item = WarehouseItem.objects.create(
            warehouse=warehouse,
            name="Test Item",
            sku="TEST-001",
            quantity=10,
            minimum_stock=2,
            unit_cost=25.00,
        )

        # Create inventory service
        service = get_inventory_service()

        # Test available quantity calculation
        available = service.get_available_quantity("TEST-001")
        self.assertEqual(available, 10)  # No reservations yet

        # Create test scheduled event for reservation
        account = Account.objects.create(name="Test Account", owner=self.user)
        contact = Contact.objects.create(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone_number="+1234567890",
            account=account,
            owner=self.user,
        )

        technician = Technician.objects.create(
            employee_id="TECH003",
            first_name="Test",
            last_name="Tech",
            email="testtech@example.com",
            phone="555-0123",
            hire_date="2024-01-01",
            base_hourly_rate=25.00,
            user=self.user,
            is_active=True,
        )

        # Create project for scheduled event
        project = Project.objects.create(
            title="Test Project",
            description="Test Description",
            account=account,
            contact=contact,
            assigned_to=self.user,
            created_by=self.user,
        )

        scheduled_event = ScheduledEvent.objects.create(
            project=project,
            technician=technician,
            appointment_date=timezone.now() + timedelta(days=1),
            start_time="09:00",
            end_time="10:00",
            location="Test Location",
            status="scheduled",
        )

        # Test inventory reservation
        items_needed = [{"sku": "TEST-001", "quantity": 3}]
        result = service.reserve_items(scheduled_event, items_needed, self.user)

        self.assertTrue(result["success"])
        self.assertEqual(len(result["reservations"]), 1)

        # Check available quantity after reservation
        available = service.get_available_quantity("TEST-001")
        self.assertEqual(available, 7)  # 10 - 3 reserved


class Phase2SignalIntegrationTests(TestCase):
    """Test Phase 2 signal integrations"""

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.account = Account.objects.create(name="Test Account", owner=self.user)

        self.contact = Contact.objects.create(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            account=self.account,
            owner=self.user,
        )

        self.technician = Technician.objects.create(
            first_name="Tech",
            last_name="Smith",
            email="tech@example.com",
            phone="+1234567891",
            is_active=True,
        )

        self.project = Project.objects.create(
            title="Test Project",
            account=self.account,
            contact=self.contact,
            assigned_to=self.user,
            created_by=self.user,
        )

        self.work_order = WorkOrder.objects.create(
            project=self.project, description="Test Work Order"
        )

    @patch("main.celery_tasks.send_technician_assignment_notification.delay")
    @patch("main.celery_tasks.reserve_inventory_for_appointment.delay")
    def test_scheduled_event_creation_signal(self, mock_reserve_task, mock_notify_task):
        """Test that creating a ScheduledEvent triggers appropriate Celery tasks"""
        # Create scheduled event
        scheduled_event = ScheduledEvent.objects.create(
            work_order=self.work_order,
            technician=self.technician,
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=3),
            status="scheduled",
        )

        # Assert Celery tasks were queued
        mock_notify_task.assert_called_once_with(scheduled_event.id)
        mock_reserve_task.assert_called_once_with(scheduled_event.id)

    @patch("main.celery_tasks.process_post_appointment_workflow.delay")
    def test_work_order_completion_signal(self, mock_workflow_task):
        """Test that completing a WorkOrder triggers post-appointment workflow"""
        # Complete the work order
        self.work_order.status = "completed"
        self.work_order.save()

        # Assert Celery task was queued
        mock_workflow_task.assert_called_once_with(self.work_order.id)
