import json
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient, APITestCase


class DevJsonValidatorTests(APITestCase):
    """Tiny DEBUG-gated tests for /api/dev/validate-json/ endpoint."""

    def setUp(self):
        # Auth setup
        self.user = get_user_model().objects.create_user(
            username="dev_validator_tester", password="testpass123"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Create minimal schema file under BASE_DIR/.copilot-tracking/research
        self.base_dir = Path(settings.BASE_DIR)
        self.research_dir = self.base_dir / ".copilot-tracking" / "research"
        self.research_dir.mkdir(parents=True, exist_ok=True)
        # Use key 'journalentry' to align with endpoint alias map and catalog
        self.schema_path = self.research_dir / "20251011-journalentry.schema.json"
        schema_obj = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "amount": {"type": "number"},
                "description": {"type": "string"},
            },
            "required": ["amount"],
            "additionalProperties": True,
        }
        self.schema_path.write_text(json.dumps(schema_obj), encoding="utf-8")

    def tearDown(self):
        # Clean up the test schema file; leave folder to avoid interfering with other tests
        try:
            if self.schema_path.exists():
                self.schema_path.unlink()
        except Exception:
            pass

    @override_settings(DEBUG=True)
    def test_validate_json_happy_path(self):
        payload = {
            "schema": "journalentry",
            "payload": {"amount": 120.5, "description": "test"},
        }
        res = self.client.post("/api/dev/validate-json/", data=payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = json.loads(res.content.decode("utf-8"))
        self.assertIn("valid", body)
        self.assertTrue(body["valid"])  # should be valid with required amount
        self.assertIn("schema_path", body)

    @override_settings(DEBUG=True)
    def test_validate_json_returns_errors_when_invalid(self):
        # Missing required field 'amount'
        payload = {"schema": "journalentry", "payload": {"description": "x"}}
        res = self.client.post("/api/dev/validate-json/", data=payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = json.loads(res.content.decode("utf-8"))
        self.assertIn("valid", body)
        self.assertFalse(body["valid"])  # should be invalid
        self.assertIsInstance(body.get("errors", []), list)
        self.assertGreaterEqual(len(body.get("errors", [])), 1)

    @override_settings(DEBUG=False)
    def test_endpoint_disabled_when_not_debug(self):
        payload = {"schema": "journalentry", "payload": {"amount": 1}}
        res = self.client.post("/api/dev/validate-json/", data=payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
