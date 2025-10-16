from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from main.models import (
    Certification,
    Technician,
    TechnicianCertification,
    CoverageArea,
)


class TechnicianFiltersAPITests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="mgr", password="pass")
        self.client.login(username="mgr", password="pass")

        # Technicians
        self.t1 = Technician.objects.create(
            employee_id="E1", first_name="A", last_name="One", phone="1", email="a@x.com"
        )
        self.t2 = Technician.objects.create(
            employee_id="E2", first_name="B", last_name="Two", phone="2", email="b@x.com"
        )
        self.t3 = Technician.objects.create(
            employee_id="E3", first_name="C", last_name="Three", phone="3", email="c@x.com"
        )

        # Certifications
        self.c_low = Certification.objects.create(
            name="Low", description="", tech_level=2, category="general"
        )
        self.c_high = Certification.objects.create(
            name="High", description="", tech_level=7, category="general"
        )

        today = date.today()
        # Active cert for t1 (no expiration)
        TechnicianCertification.objects.create(
            technician=self.t1,
            certification=self.c_low,
            obtained_date=today - timedelta(days=30),
            expiration_date=None,
            is_active=True,
        )
        # Expired cert for t2
        TechnicianCertification.objects.create(
            technician=self.t2,
            certification=self.c_high,
            obtained_date=today - timedelta(days=400),
            expiration_date=today - timedelta(days=1),
            is_active=True,
        )
        # Active high-level cert for t3
        TechnicianCertification.objects.create(
            technician=self.t3,
            certification=self.c_high,
            obtained_date=today - timedelta(days=10),
            expiration_date=today + timedelta(days=365),
            is_active=True,
        )

        # Coverage areas (zip-based) for coverage_presence
        CoverageArea.objects.create(
            technician=self.t1, zip_code="98101", travel_time_minutes=10, is_primary=True
        )
        # t2 has no coverage; t3 also no coverage to test false case

    def _ids(self, resp):
        return [r["id"] for r in resp.json().get("results", [])]

    def test_filter_by_certification_id(self):
        url = reverse("technician-list") + f"?certification={self.c_low.id}"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn(self.t1.id, self._ids(resp))
        self.assertNotIn(self.t2.id, self._ids(resp))
        self.assertNotIn(self.t3.id, self._ids(resp))

    def test_filter_by_tech_level_min_max(self):
        # min level 5 should include t3 only
        url = reverse("technician-list") + "?tech_level_min=5"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        ids = self._ids(resp)
        self.assertIn(self.t3.id, ids)
        self.assertNotIn(self.t1.id, ids)

        # max level 3 should include t1 only
        url = reverse("technician-list") + "?tech_level_max=3"
        resp = self.client.get(url)
        ids = self._ids(resp)
        self.assertIn(self.t1.id, ids)
        self.assertNotIn(self.t3.id, ids)

    def test_filter_by_certification_status(self):
        # active = t1 (no expiry) and t3 (future expiry)
        url = reverse("technician-list") + "?certification_status=active"
        resp = self.client.get(url)
        ids = self._ids(resp)
        self.assertIn(self.t1.id, ids)
        self.assertIn(self.t3.id, ids)
        self.assertNotIn(self.t2.id, ids)

        # expired = t2
        url = reverse("technician-list") + "?certification_status=expired"
        resp = self.client.get(url)
        ids = self._ids(resp)
        self.assertIn(self.t2.id, ids)
        self.assertNotIn(self.t1.id, ids)
        self.assertNotIn(self.t3.id, ids)

    def test_filter_by_coverage_presence(self):
        # true should include t1 only
        url = reverse("technician-list") + "?coverage_presence=true"
        resp = self.client.get(url)
        ids = self._ids(resp)
        self.assertIn(self.t1.id, ids)
        self.assertNotIn(self.t2.id, ids)
        self.assertNotIn(self.t3.id, ids)

        # false should include t2 and t3 (no coverage areas)
        url = reverse("technician-list") + "?coverage_presence=false"
        resp = self.client.get(url)
        ids = self._ids(resp)
        self.assertIn(self.t2.id, ids)
        self.assertIn(self.t3.id, ids)
        self.assertNotIn(self.t1.id, ids)
