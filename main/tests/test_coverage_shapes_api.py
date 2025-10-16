from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from main.models import Technician, CoverageShape


class CoverageShapeAPITests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="techmgr", password="pass")
        self.client.login(username="techmgr", password="pass")
        self.tech = Technician.objects.create(
            employee_id="T100",
            first_name="Alex",
            last_name="Riley",
            phone="555",
            email="a@x.com",
        )

    def test_create_polygon_shape_and_filter(self):
        url = reverse("coverageshape-list")
        payload = {
            "technician": self.tech.id,
            "name": "North Zone",
            "area_type": "polygon",
            "geometry": {"coordinates": [[-122.1, 47.6], [-122.2, 47.65], [-122.15, 47.7]]},
            "color": "#ff0000",
            "priority_level": 2,
            "properties": {"service_types": ["electrical", "hvac"]},
        }
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 201, resp.content)
        obj_id = resp.json()["id"]

        # list and filter by technician
        resp = self.client.get(url + f"?technician={self.tech.id}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["count"], 1)

        # filter by service_type (contains)
        resp = self.client.get(url + "?service_type=hvac")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["count"], 1)

        # retrieve and then delete
        detail = reverse("coverageshape-detail", kwargs={"pk": obj_id})
        resp = self.client.get(detail)
        self.assertEqual(resp.status_code, 200)
        del_resp = self.client.delete(detail)
        self.assertEqual(del_resp.status_code, 204)

    def test_circle_validation(self):
        url = reverse("coverageshape-list")
        bad = {
            "technician": self.tech.id,
            "area_type": "circle",
            "geometry": {"center": [0, 0], "radius_m": -5},
        }
        resp = self.client.post(url, bad, format="json")
        self.assertEqual(resp.status_code, 400)

        good = {
            "technician": self.tech.id,
            "area_type": "circle",
            "geometry": {"center": [0, 0], "radius_m": 1000},
        }
        resp = self.client.post(url, good, format="json")
        self.assertEqual(resp.status_code, 201)

    def test_summary_endpoint_basic_aggregates(self):
        # Seed a few shapes
        list_url = reverse("coverageshape-list")
        payloads = [
            {
                "technician": self.tech.id,
                "name": "Zone A",
                "area_type": "polygon",
                "geometry": {
                    "coordinates": [
                        [-122.1, 47.6],
                        [-122.2, 47.65],
                        [-122.15, 47.7],
                    ]
                },
                "priority_level": 1,
                "properties": {"service_types": ["repair", "install"]},
            },
            {
                "technician": self.tech.id,
                "name": "Zone B",
                "area_type": "circle",
                "geometry": {"center": [0, 0], "radius_m": 500},
                "priority_level": 2,
                "properties": {"service_types": ["repair"]},
            },
            {
                "technician": self.tech.id,
                "name": "Zone C",
                "area_type": "circle",
                "geometry": {"center": [0, 0], "radius_m": 750},
                "priority_level": 2,
                "is_active": False,
                "properties": {"service_types": ["maintenance"]},
            },
        ]
        for p in payloads:
            r = self.client.post(list_url, p, format="json")
            self.assertEqual(r.status_code, 201, r.content)

        # Hit summary with technician filter to scope dataset
        summary_url = reverse("coverageshape-list") + "summary/"
        resp = self.client.get(summary_url + f"?technician={self.tech.id}")
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()

        # Validate shape of response and key aggregates
        self.assertIn("total", data)
        self.assertIn("by_area_type", data)
        self.assertIn("by_priority_level", data)
        self.assertIn("by_active", data)
        self.assertIn("technicians_with_shapes", data)
        self.assertIn("service_types", data)

        self.assertEqual(data["total"], 3)
        # area types: 1 polygon, 2 circles
        self.assertEqual(data["by_area_type"].get("polygon", 0), 1)
        self.assertEqual(data["by_area_type"].get("circle", 0), 2)
        # priorities: one 1, two 2
        self.assertEqual(int(data["by_priority_level"].get("1", 0)), 1)
        self.assertEqual(int(data["by_priority_level"].get("2", 0)), 2)
        # active vs inactive: 2 true, 1 false
        self.assertEqual(int(data["by_active"].get("true", 0)), 2)
        self.assertEqual(int(data["by_active"].get("false", 0)), 1)
        # distinct techs = 1
        self.assertEqual(int(data["technicians_with_shapes"]), 1)
        # service types aggregated
        st = data["service_types"]
        self.assertGreaterEqual(st.get("repair", 0), 2)
        self.assertGreaterEqual(st.get("install", 0), 1)
        self.assertGreaterEqual(st.get("maintenance", 0), 1)
