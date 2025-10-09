import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "web.settings")
django.setup()

from django.contrib.auth import get_user_model
from main.models import Account, Deal
from django.core.management import call_command
from io import StringIO
from django.db import connection
from django.db.utils import IntegrityError


def run_preview_sample():
    # Ensure database schema is up-to-date for this local environment
    call_command("migrate", "--noinput")

    User = get_user_model()
    user, _ = User.objects.get_or_create(username="tester")
    if not user.has_usable_password():
        user.set_password("pass")
        user.save()

    # Create accounts/deals depending on whether legacy DB columns exist
    acct_kwargs = {"name": "A1", "owner": user, "phone": ""}
    # Check DB table columns directly for legacy `phone_number`
    def column_exists(table_name, column_name):
        with connection.cursor() as cursor:
            desc = connection.introspection.get_table_description(cursor, table_name)
        return any(col.name == column_name for col in desc)

    def get_column_info(table_name, column_name):
        """Return (exists, notnull) for a column using PRAGMA table_info."""
        with connection.cursor() as cursor:
            cursor.execute(f"PRAGMA table_info({table_name})")
            rows = cursor.fetchall()
        for r in rows:
            # PRAGMA table_info returns: cid, name, type, notnull, dflt_value, pk
            if r[1] == column_name:
                return True, bool(r[3])
        return False, False

    phone_exists, phone_notnull = get_column_info("main_account", "phone_number")
    if phone_exists:
        acct_kwargs["phone_number"] = "+1-555-0001"

    # Split kwargs into model-known fields and legacy DB-only columns
    model_field_names = {f.name for f in Account._meta.get_fields() if getattr(f, "concrete", True) and not f.many_to_many}
    model_kwargs = {k: v for k, v in acct_kwargs.items() if k in model_field_names}
    legacy_kwargs = {k: v for k, v in acct_kwargs.items() if k not in model_field_names}

    # If legacy phone_number exists and is NOT NULL, do a raw INSERT including it to avoid
    # SQLite NOT NULL constraint failures. Otherwise create via ORM and update legacy cols.
    if phone_exists and phone_notnull:
        # Build column list for INSERT using model concrete fields plus legacy columns
        cols = ["name", "owner_id", "created_at", "updated_at"]
        vals = [model_kwargs.get("name"), user.pk, "datetime('now')", "datetime('now')"]
        # Include phone_number explicitly
        cols.insert(2, "phone_number")
        vals.insert(2, acct_kwargs.get("phone_number", ""))
        placeholders = ", ".join("?" for _ in vals)
        col_list = ", ".join(cols)
        sql = f"INSERT INTO main_account ({col_list}) VALUES ({placeholders})"
        with connection.cursor() as cursor:
            cursor.execute(sql, vals)
        a1 = Account.objects.order_by("id").last()
    else:
        a1 = Account.objects.create(**model_kwargs)
        if legacy_kwargs:
            cols = []
            vals = []
            for col, val in legacy_kwargs.items():
                if column_exists("main_account", col):
                    cols.append(col)
                    vals.append(val)
            if cols:
                set_clause = ", ".join(f"{c} = ?" for c in cols)
                sql = f"UPDATE main_account SET {set_clause}, updated_at = datetime('now') WHERE id = ?"
                with connection.cursor() as cursor:
                    cursor.execute(sql, vals + [a1.pk])

    acct2_kwargs = {"name": "A2", "owner": user, "phone": "12345"}
    phone2_exists, phone2_notnull = get_column_info("main_account", "phone_number")
    if phone2_exists:
        acct2_kwargs["phone_number"] = "+1-555-0002"

    model_kwargs2 = {k: v for k, v in acct2_kwargs.items() if k in model_field_names}
    legacy_kwargs2 = {k: v for k, v in acct2_kwargs.items() if k not in model_field_names}

    if phone2_exists and phone2_notnull:
        cols = ["name", "owner_id", "phone_number", "created_at", "updated_at"]
        vals = [model_kwargs2.get("name"), user.pk, acct2_kwargs.get("phone_number", ""), "datetime('now')", "datetime('now')"]
        placeholders = ", ".join("?" for _ in vals)
        col_list = ", ".join(cols)
        sql = f"INSERT INTO main_account ({col_list}) VALUES ({placeholders})"
        with connection.cursor() as cursor:
            cursor.execute(sql, vals)
        a2 = Account.objects.order_by("id").last()
    else:
        a2 = Account.objects.create(**model_kwargs2)
        if legacy_kwargs2:
            cols = []
            vals = []
            for col, val in legacy_kwargs2.items():
                if column_exists("main_account", col):
                    cols.append(col)
                    vals.append(val)
            if cols:
                set_clause = ", ".join(f"{c} = ?" for c in cols)
                sql = f"UPDATE main_account SET {set_clause}, updated_at = datetime('now') WHERE id = ?"
                with connection.cursor() as cursor:
                    cursor.execute(sql, vals + [a2.pk])

    deal_kwargs1 = {"name": "", "account": a1, "value": 100, "close_date": "2025-12-31", "owner": user}
    deal_kwargs2 = {"name": "New", "account": a1, "value": 200, "close_date": "2025-12-31", "owner": user}
    if hasattr(Deal, "_meta"):
        try:
            Deal._meta.get_field("title")
            deal_kwargs1["title"] = "Old Deal"
            deal_kwargs2["title"] = "New Deal"
        except Exception:
            pass

    d1 = Deal.objects.create(**deal_kwargs1)
    d2 = Deal.objects.create(**deal_kwargs2)

    out = StringIO()
    call_command("preview_migration_0032", stdout=out)
    print("--- preview output ---")
    print(out.getvalue())

    # test fail_if_changes behavior
    try:
        call_command("preview_migration_0032", fail_if_changes=True)
        print("fail_if_changes did not raise SystemExit")
    except SystemExit as se:
        print(f"fail_if_changes raised SystemExit with code: {se.code}")


if __name__ == "__main__":
    run_preview_sample()
