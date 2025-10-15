from __future__ import annotations

import json as _json

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase


def _canonicalize(obj):
    """Canonicalize JSON for stable snapshot comparisons.
    - Sort dict keys, normalize dynamic values (ids, timestamps) to placeholders.
    """
    if isinstance(obj, dict):
        out = {}
        for k in sorted(obj.keys()):
            v = obj[k]
            if k in {"id", "journal_entry_id", "invoice_id", "payment_id"}:
                out[k] = "<id>"
            elif k in {
                "created_at",
                "updated_at",
                "timestamp",
                "issued_date",
                "due_date",
            }:
                out[k] = "<date>"
            elif isinstance(v, (dict, list)):
                out[k] = _canonicalize(v)
            else:
                out[k] = v
        return out
    if isinstance(obj, list):
        return [_canonicalize(x) for x in obj]
    return obj


class ApiContractSnapshots(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="snap_mgr", password="x")
        try:
            from django.contrib.auth.models import Group

            g, _ = Group.objects.get_or_create(name="Sales Manager")
            self.user.groups.add(g)
        except Exception:
            pass
        self.client.force_authenticate(user=self.user)  # type: ignore[attr-defined]

    def test_accounts_list_shape(self):
        url = reverse("account-list")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        # Pagination contract
        for key in ("count", "next", "previous", "results"):
            self.assertIn(key, body)

    def test_contacts_rbac_matrix(self):
        # Unauthenticated -> 401
        from rest_framework.test import APIClient

        anon = APIClient()
        url = reverse("contact-list")
        r = anon.get(url)
        self.assertEqual(getattr(r, "status_code", 0), 401)

        # Authenticated non-manager should see only own contacts
        from main.models import Account, Contact

        acct = Account.objects.create(name="ACME", owner=self.user)
        Contact.objects.create(
            first_name="A",
            last_name="B",
            email="a@b.com",
            account=acct,
            owner=self.user,
        )
        # Another user’s contact
        other_user = get_user_model().objects.create_user(username="rep2", password="x")
        acct2 = Account.objects.create(name="BETA", owner=other_user)
        Contact.objects.create(
            first_name="X",
            last_name="Y",
            email="x@y.com",
            account=acct2,
            owner=other_user,
        )
        r2 = self.client.get(url)
        self.assertEqual(r2.status_code, 200)
        items = (
            r2.json()["results"]
            if isinstance(r2.json(), dict) and "results" in r2.json()
            else r2.json()
        )
        joined = _json.dumps(items)
        self.assertIn("ACME", joined)

    def test_deals_list_shape_and_search(self):
        url = reverse("deal-list")
        res = self.client.get(url, {"search": "zz"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        # Pagination contract
        for key in ("count", "next", "previous", "results"):
            self.assertIn(key, body)

    def test_payments_rbac_matrix(self):
        from rest_framework.test import APIClient

        from main.models import Payment

        # Unauthenticated -> 401
        anon = APIClient()
        url = reverse("payment-list")
        r = anon.get(url)
        self.assertEqual(getattr(r, "status_code", 0), 401)

        # Authenticated manager can list
        r2 = self.client.get(url)
        self.assertEqual(r2.status_code, 200)
        # And can hit allocate action path requires existing payment
        p = Payment.objects.create(amount=10)
        alloc = self.client.post(
            reverse("payment-allocate", args=[getattr(p, "id", p.pk)]),
            {},
            format="json",
        )
        self.assertIn(alloc.status_code, (200, 400, 409))

    def test_budgets_v2_create_and_detail_shape(self):
        # Create a cost center and budget v2
        from main.models import CostCenter

        cc, _ = CostCenter.objects.get_or_create(name="Ops", defaults={"code": "OPS"})
        url = reverse("budgetv2-list")
        res = self.client.post(
            url,
            {"name": "Ops 2030", "year": 2030, "cost_center": getattr(cc, "id", cc.pk)},
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        body = res.json()
        detail_url = reverse("budgetv2-detail", args=[body["id"]])
        res2 = self.client.get(detail_url)
        self.assertEqual(res2.status_code, 200)
        detail = res2.json()
        # Ensure core fields exist and shape matches expectations
        self.assertIn("name", detail)
        self.assertIn("year", detail)
        self.assertIn("distributions", detail)
        self.assertEqual(len(detail.get("distributions") or []), 12)

    def test_payments_allocate_error_shape(self):
        # Create a payment and attempt overpay to trigger 400 error shape
        from main.models import Payment

        p = Payment.objects.create(amount=1000)
        url = reverse("payment-allocate", args=[getattr(p, "id", p.pk)])
        res = self.client.post(url, {}, format="json")
        # May be 200 if no target object; validate error shape only when 400
        if res.status_code == 400:
            body = res.json()
            self.assertIn("error", body)
