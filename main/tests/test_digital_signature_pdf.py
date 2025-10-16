from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework.test import APITestCase

from main.models import Contact, DigitalSignature
from main.pdf_service import get_pdf_service


class DigitalSignaturePDFTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="ds1", password="pass")
        self.client.login(username="ds1", password="pass")
        ct = ContentType.objects.get_for_model(Contact)
        self.signature = DigitalSignature.objects.create(
            content_type=ct,
            object_id=0,
            signature_data="iVBORw0KGgo=",  # minimal base64
            signer_name="Tester",
            signer_email="t@example.com",
            document_name="Agreement",
            ip_address="127.0.0.1",
        )

    def test_pdf_endpoint(self):
        url = reverse("digitalsignature-pdf", kwargs={"pk": self.signature.id})
        resp = self.client.get(url)
        service = get_pdf_service()
        if getattr(service, "weasyprint_available", False):
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp["Content-Type"], "application/pdf")
        else:
            self.assertEqual(resp.status_code, 503)
