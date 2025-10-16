from django.contrib.auth import get_user_model
from django.core.exceptions import FieldDoesNotExist
from django.core.management import call_command
from django.test import TestCase

from main.models import Account, Deal

User = get_user_model()


class PreviewMigration0032Tests(TestCase):
    def setUp(self):
        self.user, _ = User.objects.get_or_create(username="tester")
        if not self.user.has_usable_password():
            self.user.set_password("pass")
            self.user.save()
        # Skip tests if legacy columns are not present in this schema
        try:
            Account._meta.get_field("phone_number")
            has_phone_number = True
        except FieldDoesNotExist:
            has_phone_number = False

        try:
            Deal._meta.get_field("title")
            has_title = True
        except FieldDoesNotExist:
            has_title = False

        if not (has_phone_number or has_title):
            self.skipTest(
                "Legacy legacy columns missing (phone_number/title); skipping preview migration tests."  # noqa: E501
            )

    def test_preview_reports_accounts_and_deals(self):
        # create accounts: one with phone_number but empty phone
        a1 = Account.objects.create(
            name="A1", owner=self.user, phone="", phone_number="+1-555-0001"
        )
        # Second account not needed for assertions; removed to satisfy flake8 F841

        # deals: one with title and empty name
        d1 = Deal.objects.create(
            title="Old Deal",
            account=a1,
            value=100,
            close_date="2025-12-31",
            owner=self.user,
        )
        # Second deal not needed for assertions; removed (flake8 F841)

        out = self._call_command_capture("preview_migration_0032")
        # The output should mention 1 account and 1 deal
        self.assertIn("1 account(s)", out)
        self.assertIn("1 deal(s)", out)
        # Samples must include the created ids
        self.assertIn(str(a1.id), out)
        self.assertIn(str(d1.id), out)

    def test_fail_if_changes_exits_nonzero(self):
        Account.objects.create(
            name="A1", owner=self.user, phone="", phone_number="+1-555-0001"
        )
        with self.assertRaises(SystemExit) as cm:
            call_command("preview_migration_0032", fail_if_changes=True)
        self.assertEqual(cm.exception.code, 2)

    def _call_command_capture(self, *args, **kwargs):
        from io import StringIO

        out = StringIO()
        call_command(*args, stdout=out, **kwargs)
        return out.getvalue()
