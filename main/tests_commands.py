from datetime import date
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from .models import Project, ScheduledEvent, Technician


class ProcessRecurrenceRulesCommandTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="tester", email="tester@example.com", password="pass"
        )

        # Minimal project owned by our user
        self.project = Project.objects.create(
            title="Test Project",
            description="",
            assigned_to=self.user,
            created_by=self.user,
        )

        # Minimal technician
        self.tech = Technician.objects.create(
            employee_id="T-100",
            first_name="Tech",
            last_name="User",
            phone="555-0100",
            email="tech@example.com",
        )

        # Parent scheduled event with invalid recurrence pattern
        ScheduledEvent.objects.create(
            project=self.project,  # manager will create a WorkOrder
            technician=self.tech,
            appointment_date=date.today(),
            start_time="09:00",
            end_time="10:00",
            recurrence_rule="invalid",  # triggers unknown pattern path
        )

    def test_invalid_pattern_dry_run_reports_error(self):
        out = StringIO()
        # days-ahead small window; dry-run to avoid DB writes
        call_command(
            "process_recurrence_rules",
            "--days-ahead",
            "1",
            "--dry-run",
            stdout=out,
        )

        output = out.getvalue()
        # Should warn about unknown recurrence pattern
        self.assertIn("Unknown recurrence pattern: invalid", output)
        # Summary should report at least 1 error
        self.assertIn("Errors:", output)
