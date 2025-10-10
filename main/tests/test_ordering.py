from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase

from main.models import (
    Account,
    Certification,
    CoverageArea,
    Technician,
    TechnicianAvailability,
)


class OrderingTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        # Manager can see all accounts
        self.sales_manager_group, _ = Group.objects.get_or_create(name="Sales Manager")
        self.mgr = User.objects.create_user(username="mgr", password="pass")
        self.mgr.groups.add(self.sales_manager_group)
        # Two owners to avoid owner filters affecting default ordering assertion
        self.rep1 = User.objects.create_user(username="rep1", password="pass")
        self.rep2 = User.objects.create_user(username="rep2", password="pass")
        # Create accounts deliberately out of insertion order by id
        # Note: ids auto-increment; we can still assert ordering is by id asc
        Account.objects.create(name="Zeta Corp", owner=self.rep2)
        Account.objects.create(name="Alpha LLC", owner=self.rep1)

    def _client_for(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c

    def test_accounts_default_ordering_is_deterministic(self):
        url = reverse("account-list")
        resp = self._client_for(self.mgr).get(url)
        self.assertEqual(getattr(resp, "status_code", 0), 200)
        data = getattr(resp, "data", [])
        # Support both paginated (dict with 'results') and non-paginated (list) responses
        if isinstance(data, dict):
            results = data.get("results", [])
        else:
            results = data
        ids = [item.get("id") for item in results]
        self.assertEqual(ids, sorted(ids))

    def test_technicians_default_ordering_is_deterministic(self):
        # Create two technicians with distinct employee_ids
        Technician.objects.create(
            employee_id="T-002",
            first_name="Jane",
            last_name="Roe",
            phone="555-2000",
            email="jane.roe@example.com",
            hire_date="2024-01-01",
            is_active=True,
            base_hourly_rate="42.00",
            emergency_contact={},
        )
        Technician.objects.create(
            employee_id="T-001",
            first_name="John",
            last_name="Doe",
            phone="555-1000",
            email="john.doe@example.com",
            hire_date="2024-01-02",
            is_active=True,
            base_hourly_rate="40.00",
            emergency_contact={},
        )

        url = reverse("technician-list")
        resp = self._client_for(self.mgr).get(url)
        self.assertEqual(getattr(resp, "status_code", 0), 200)
        data = getattr(resp, "data", [])
        if isinstance(data, dict):
            results = data.get("results", [])
        else:
            results = data
        ids = [item.get("id") for item in results]
        self.assertEqual(ids, sorted(ids))

    def test_certifications_default_ordering_is_deterministic(self):
        Certification.objects.create(
            name="Cert B",
            description="",
            tech_level=2,
            category="safety",
            requires_renewal=True,
            renewal_period_months=12,
            issuing_authority="Org",
        )
        Certification.objects.create(
            name="Cert A",
            description="",
            tech_level=1,
            category="safety",
            requires_renewal=True,
            renewal_period_months=12,
            issuing_authority="Org",
        )

        url = reverse("certification-list")
        resp = self._client_for(self.mgr).get(url)
        self.assertEqual(getattr(resp, "status_code", 0), 200)
        data = getattr(resp, "data", [])
        results = data.get("results", []) if isinstance(data, dict) else data
        ids = [item.get("id") for item in results]
        self.assertEqual(ids, sorted(ids))

    def test_coverage_areas_default_ordering_is_deterministic(self):
        tech = Technician.objects.create(
            employee_id="T-010",
            first_name="Alex",
            last_name="Smith",
            phone="555-1010",
            email="alex.smith@example.com",
            hire_date="2024-02-01",
            is_active=True,
            base_hourly_rate="50.00",
            emergency_contact={},
        )
        CoverageArea.objects.create(
            technician=tech, zip_code="99999", travel_time_minutes=10
        )
        CoverageArea.objects.create(
            technician=tech, zip_code="00000", travel_time_minutes=5
        )

        url = reverse("coveragearea-list")
        resp = self._client_for(self.mgr).get(url)
        self.assertEqual(getattr(resp, "status_code", 0), 200)
        data = getattr(resp, "data", [])
        results = data.get("results", []) if isinstance(data, dict) else data
        ids = [item.get("id") for item in results]
        self.assertEqual(ids, sorted(ids))

    def test_availability_default_ordering_is_deterministic(self):
        tech = Technician.objects.create(
            employee_id="T-020",
            first_name="Casey",
            last_name="Lee",
            phone="555-2020",
            email="casey.lee@example.com",
            hire_date="2024-03-01",
            is_active=True,
            base_hourly_rate="55.00",
            emergency_contact={},
        )
        TechnicianAvailability.objects.create(
            technician=tech, weekday=1, start_time="09:00", end_time="17:00"
        )
        TechnicianAvailability.objects.create(
            technician=tech, weekday=2, start_time="09:00", end_time="17:00"
        )

        url = reverse("technicianavailability-list")
        resp = self._client_for(self.mgr).get(url)
        self.assertEqual(getattr(resp, "status_code", 0), 200)
        data = getattr(resp, "data", [])
        results = data.get("results", []) if isinstance(data, dict) else data
        ids = [item.get("id") for item in results]
        self.assertEqual(ids, sorted(ids))
