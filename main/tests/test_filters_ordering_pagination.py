import json

from django.contrib.auth.models import Group
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from main.models import Account, Contact, CustomUser, Deal, DealStage


def _parse(resp):
    try:
        raw = getattr(resp, "content", b"{}")
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8")
        return json.loads(raw or "{}")
    except Exception:
        return {}


class TestFiltersOrderingPagination(APITestCase):
    def setUp(self):
        # Manager user to bypass owner filtering for list views
        self.user = CustomUser.objects.create_user(
            username="mgr_filters", password="pass"
        )
        mgr, _ = Group.objects.get_or_create(name="Sales Manager")
        self.user.groups.add(mgr)
        self.c = APIClient()
        self.c.force_authenticate(user=self.user)

    def test_accounts_ordering_and_pagination(self):
        # Create accounts with distinct names
        Account.objects.create(name="Alpha", owner=self.user)
        Account.objects.create(name="Bravo", owner=self.user)
        Account.objects.create(name="Charlie", owner=self.user)

        # Default pagination keys and deterministic ordering by id
        r_def = self.c.get("/api/accounts/?page=1")
        self.assertEqual(getattr(r_def, "status_code", 0), 200)
        body_def = _parse(r_def)
        for key in ("count", "next", "previous", "results"):
            self.assertIn(key, body_def)
        names_default = [row.get("name") for row in body_def.get("results", [])]
        self.assertTrue({"Alpha", "Bravo", "Charlie"}.issubset(set(names_default)))

        # Explicit ordering by name descending
        r_ord = self.c.get("/api/accounts/?ordering=-name")
        self.assertEqual(getattr(r_ord, "status_code", 0), 200)
        body_ord = _parse(r_ord)
        ordered_names = [row.get("name") for row in body_ord.get("results", [])]
        # Ensure relative order: Charlie before Bravo before Alpha
        self.assertLess(ordered_names.index("Charlie"), ordered_names.index("Bravo"))
        self.assertLess(ordered_names.index("Bravo"), ordered_names.index("Alpha"))

    def test_contacts_filter_and_ordering(self):
        # Create two owners and contacts
        rep = CustomUser.objects.create_user(username="rep_x", password="p")
        acct = Account.objects.create(name="ACME", owner=self.user)
        Contact.objects.create(
            account=acct, first_name="Zed", last_name="Zulu", email="z@x.com", owner=rep
        )
        Contact.objects.create(
            account=acct,
            first_name="Ann",
            last_name="Alpha",
            email="a@x.com",
            owner=self.user,
        )

        # Filter by owner=rep
        r_owner = self.c.get(f"/api/contacts/?owner={getattr(rep, 'id', None)}")
        self.assertEqual(getattr(r_owner, "status_code", 0), 200)
        body_owner = _parse(r_owner)
        emails = [row.get("email") for row in body_owner.get("results", [])]
        self.assertIn("z@x.com", emails)
        self.assertNotIn("a@x.com", emails)

        # Ordering by last_name ascending (Alpha before Zulu)
        r_ord = self.c.get("/api/contacts/?ordering=last_name")
        self.assertEqual(getattr(r_ord, "status_code", 0), 200)
        body_ord2 = _parse(r_ord)
        last_names = [row.get("last_name") for row in body_ord2.get("results", [])]
        # Ensure Alpha appears before Zulu
        self.assertLess(last_names.index("Alpha"), last_names.index("Zulu"))

        # Search by email (Contacts supports search_fields)
        r_search = self.c.get("/api/contacts/?search=a@x.com")
        self.assertEqual(getattr(r_search, "status_code", 0), 200)
        body_search = _parse(r_search)
        emails_search = [row.get("email") for row in body_search.get("results", [])]
        self.assertIn("a@x.com", emails_search)

    def test_deals_filter_and_ordering_defaults(self):
        # Prepare stages and deals with different statuses and dates
        stg = DealStage.objects.create(name="Proposal", order=1)
        today = timezone.now().date()
        Deal.objects.create(
            title="D1",
            account=Account.objects.create(name="A1", owner=self.user),
            stage=stg,
            value=100,
            close_date=today,
            owner=self.user,
            status="in_progress",
        )
        Deal.objects.create(
            title="D2",
            account=Account.objects.create(name="A2", owner=self.user),
            stage=stg,
            value=200,
            close_date=today.replace(day=max(1, min(28, today.day - 1))),
            owner=self.user,
            status="won",
        )

        # Filter by status=in_progress
        r_status = self.c.get("/api/deals/?status=in_progress")
        self.assertEqual(getattr(r_status, "status_code", 0), 200)
        body_status = _parse(r_status)
        titles = [row.get("title") for row in body_status.get("results", [])]
        self.assertIn("D1", titles)
        self.assertNotIn("D2", titles)

        # Ordering by value descending puts D2 before D1
        r_ord = self.c.get("/api/deals/?ordering=-value")
        self.assertEqual(getattr(r_ord, "status_code", 0), 200)
        body_ord3 = _parse(r_ord)
        titles_ord = [row.get("title") for row in body_ord3.get("results", [])]
        self.assertLess(titles_ord.index("D2"), titles_ord.index("D1"))

        # Default ordering: -close_date (most recent first). D1 is today, D2 is a day earlier.
        r_def = self.c.get("/api/deals/")
        self.assertEqual(getattr(r_def, "status_code", 0), 200)
        body_def2 = _parse(r_def)
        titles_def = [row.get("title") for row in body_def2.get("results", [])]
        self.assertLess(titles_def.index("D1"), titles_def.index("D2"))
