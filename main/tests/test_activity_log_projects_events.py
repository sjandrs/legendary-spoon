from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from main.models import ActivityLog, Project, ScheduledEvent, WorkOrder


class ProjectAndEventLoggingTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="projuser", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_project_complete_logs_activity(self):
        project = Project.objects.create(
            title="Proj", status="in_progress", created_by=self.user
        )
        # Update project status to completed via API
        url = reverse("project-detail", kwargs={"pk": getattr(project, "id", None)})
        resp = self.client.patch(url, {"status": "completed"}, format="json")
        self.assertIn(resp.status_code, (200, 202))
        self.assertTrue(
            ActivityLog.objects.filter(
                action="complete", object_id=getattr(project, "id", None)
            ).exists()
        )

    def test_event_reschedule_and_complete_logs_activity(self):
        # Create minimal project->work order->event
        project = Project.objects.create(
            title="Proj2", status="in_progress", created_by=self.user
        )
        wo = WorkOrder.objects.create(project=project)
        start = timezone.now()
        end = start + timezone.timedelta(hours=1)
        event = ScheduledEvent.objects.create(
            work_order=wo, start_time=start, end_time=end, status="scheduled"
        )

        # Reschedule
        url_resched = reverse(
            "scheduledevent-reschedule", kwargs={"pk": getattr(event, "id", None)}
        )
        new_start = (start + timezone.timedelta(hours=2)).isoformat()
        new_end = (end + timezone.timedelta(hours=2)).isoformat()
        resp1 = self.client.post(
            url_resched, {"start_time": new_start, "end_time": new_end}, format="json"
        )
        self.assertEqual(resp1.status_code, 200)
        self.assertTrue(
            ActivityLog.objects.filter(
                action="update", object_id=getattr(event, "id", None)
            ).exists()
        )

        # Complete
        url_complete = reverse(
            "scheduledevent-complete", kwargs={"pk": getattr(event, "id", None)}
        )
        resp2 = self.client.post(url_complete, {"actual_duration": 60}, format="json")
        self.assertEqual(resp2.status_code, 200)
        self.assertTrue(
            ActivityLog.objects.filter(
                action="complete", object_id=getattr(event, "id", None)
            ).exists()
        )
