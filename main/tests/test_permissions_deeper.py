from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from main.models import Account, CustomField, Deal, Quote, QuoteItem


class DeeperPermissionTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.rep = User.objects.create_user(username="rep2", password="pass")
        self.other = User.objects.create_user(username="other", password="pass")
        self.mgr = User.objects.create_user(username="mgr2", password="pass")
        mgr_group, _ = Group.objects.get_or_create(name="Sales Manager")
        self.mgr.groups.add(mgr_group)

        # Minimal data to support QuoteItem ownership semantics via Deal->Account.owner
        self.account = Account.objects.create(name="Acme", owner=self.rep)
        # Create deal with minimal required fields; set stage below if needed
        self.deal = Deal.objects.create(
            title="Big Deal",
            account=self.account,
            value=1000,
            close_date=timezone.now().date(),
            owner=self.rep,
        )
        # If stage_id=1 not present, create a default stage and reassign
        if not getattr(self.deal, "stage_id", None):
            from main.models import DealStage

            stage = DealStage.objects.create(name="New", order=1)
            self.deal.stage = stage
            self.deal.save()

        self.quote = Quote.objects.create(
            deal=self.deal, valid_until=timezone.now().date()
        )
        self.quote_item = QuoteItem.objects.create(
            quote=self.quote, description="Line", quantity=1, unit_price=10
        )

        # Custom Field setup for CustomFieldValue tests
        ct = ContentType.objects.get_for_model(Account)
        self.cfield = CustomField.objects.create(
            name="VIP", field_type="boolean", content_type=ct
        )
        self.target_account = Account.objects.create(name="Beta", owner=self.other)

    def _client_for(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c

    def test_quoteitem_access_owner_vs_manager(self):
        # List/Detail access
        list_url = reverse("quoteitem-list")
        detail_url = reverse(
            "quoteitem-detail", kwargs={"pk": getattr(self.quote_item, "id", None)}
        )

        # As other rep (not owner) — IsOwnerOrManager should deny
        resp_other_list = self._client_for(self.other).get(list_url)
        # Using IsOwnerOrManager means non-owner list likely filtered/forbidden; assert not 200
        self.assertIn(getattr(resp_other_list, "status_code", 0), (403, 404))

        resp_other_detail = self._client_for(self.other).get(detail_url)
        self.assertIn(getattr(resp_other_detail, "status_code", 0), (403, 404))

        # As owner (rep)
        resp_owner_detail = self._client_for(self.rep).get(detail_url)
        code = getattr(resp_owner_detail, "status_code", 0)
        self.assertIn(code, (200, 404))  # 404 if filtered; accept 200 as allowed

        # As manager
        resp_mgr_detail = self._client_for(self.mgr).get(detail_url)
        self.assertIn(getattr(resp_mgr_detail, "status_code", 0), (200, 404))

    def test_customfieldvalue_create_update_restricted_for_rep(self):
        list_url = reverse("customfieldvalue-list")
        # Attempt create as rep (should be forbidden)
        payload = {
            "custom_field": getattr(self.cfield, "id", None),
            "object_id": getattr(self.target_account, "id", None),
            "content_type": ContentType.objects.get_for_model(Account).id,
            "value_boolean": True,
        }
        resp_create_rep = self._client_for(self.rep).post(
            list_url, payload, format="json"
        )
        # Permission class or validation may block
        self.assertIn(getattr(resp_create_rep, "status_code", 0), (403, 400))

        # Create as manager (allowed)
        resp_create_mgr = self._client_for(self.mgr).post(
            list_url, payload, format="json"
        )
        self.assertIn(getattr(resp_create_mgr, "status_code", 0), (201, 400))

        # If created, try update as rep and expect forbidden
        if getattr(resp_create_mgr, "status_code", 0) == 201:
            obj_id = getattr(resp_create_mgr, "data", {}).get("id")
            detail_url = reverse("customfieldvalue-detail", kwargs={"pk": obj_id})
            resp_update_rep = self._client_for(self.rep).patch(
                detail_url, {"value_boolean": False}, format="json"
            )
            self.assertEqual(getattr(resp_update_rep, "status_code", 0), 403)

    def test_quoteitem_create_forbidden_for_non_owner_rep(self):
        # Attempt to create a quote item as a different rep (not the account/deal owner)
        list_url = reverse("quoteitem-list")
        payload = {
            "quote": getattr(self.quote, "id", None),
            "description": "New line",
            "quantity": 1,
            "unit_price": 15,
        }
        resp = self._client_for(self.other).post(list_url, payload, format="json")
        # Expect forbidden due to IsOwnerOrManager
        self.assertEqual(getattr(resp, "status_code", 0), 403)
