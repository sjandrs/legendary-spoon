from datetime import time  # noqa: F401
from datetime import datetime, timedelta

from django.test import TestCase
from rest_framework.test import APIClient

from main.models import CustomUser, Technician, TechnicianAvailability


class TestAvailabilityCheck(TestCase):
    def setUp(self):
        # Create a technician and availability window for 'now'
        self.user = CustomUser.objects.create_user(username="techuser", password="pw")
        self.tech = Technician.objects.create(first_name="T", last_name="One")
        # Link user to technician if required elsewhere
        self.user.technician = self.tech
        self.user.save()

        now = datetime.now()
        weekday = now.weekday()
        TechnicianAvailability.objects.create(
            technician=self.tech,
            weekday=weekday,
            start_time=(now - timedelta(hours=1)).time(),
            end_time=(now + timedelta(hours=1)).time(),
            is_active=True,
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Time slot within availability
        self.start = now.replace(microsecond=0).isoformat()
        self.end = (now + timedelta(minutes=30)).replace(microsecond=0).isoformat()

    def test_get_availability(self):
        resp = self.client.get(
            "/api/scheduling/availability-check/",
            {
                "technician_id": self.tech.id,
                "start_time": self.start,
                "end_time": self.end,
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("is_available"))

    def test_post_availability(self):
        resp = self.client.post(
            "/api/scheduling/availability-check/",
            {
                "technician_id": self.tech.id,
                "start_time": self.start,
                "end_time": self.end,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("is_available"))
