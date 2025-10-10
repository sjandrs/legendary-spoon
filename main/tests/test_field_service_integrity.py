from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework.test import APITestCase

from main.models import Account, Contact, Deal, DealStage, DigitalSignature


class GlobalSearchRegressionTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="u1", password="pass")
        self.client.login(username="u1", password="pass")
        stage = DealStage.objects.create(name="Qualify", order=1)
        account = Account.objects.create(name="Acme Corp")
        Contact.objects.create(
            first_name="Jane", last_name="Doe", email="jane@example.com"
        )
        self.deal = Deal.objects.create(
            title="Big Opportunity",
            account=account,
            stage=stage,
            value=1000,
            close_date="2025-12-31",
            owner=self.user,
        )

    def test_search_deal_by_title(self):
        url = reverse("api_search") + "?q=Opportunity"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        # Ensure deal appears with title key
        self.assertTrue(any(r.get("title") == self.deal.title for r in resp.json()))


class DigitalSignatureVerifyTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="u2", password="pass")
        self.client.login(username="u2", password="pass")
        ct = ContentType.objects.get_for_model(Contact)
        self.signature = DigitalSignature.objects.create(
            content_type=ct,
            object_id=0,
            signature_data="dummy-signature",
            signer_name="Tester",
            signer_email="tester@example.com",
            document_name="Doc",
            ip_address="127.0.0.1",
        )

    def test_verify_signature_sets_hash_and_valid(self):
        url = reverse("digitalsignature-verify", kwargs={"pk": self.signature.id})
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, 200)
        self.signature.refresh_from_db()
        self.assertTrue(self.signature.is_valid)
        self.assertTrue(len(self.signature.document_hash) > 10)
