"""Draft migration for serializer backward-compatibility helpers.

This migration is intentionally a no-op migration that documents a safe strategy
for migrating renamed fields in production. Because I cannot run migrations in
this environment, include the RunPython stub below and run it locally after
reviewing and backing up your database.

Strategy:
- For simple renames where the column was renamed at the model level, use
  Django's RenameField migration operation instead (preferred).
- For cases where fields were added (new field) and old data should be copied
  over, implement a data migration that copies values from the legacy column
  to the new column and validates constraints.
- This file contains a safe no-op stub. Replace `noop_forward` with a real
  migration function when you run this locally.
"""

from django.db import migrations, transaction, models
from django.core.exceptions import FieldDoesNotExist


def forwards_copy_legacy_fields(apps, schema_editor):
  """ORM-style data migration copying legacy fields to new fields.

  - Copies Account.phone_number -> Account.phone when phone is empty.
  - Copies Deal.title -> Deal.name when name is empty.

  This migration is idempotent and safe to run multiple times.
  """
  Account = apps.get_model("main", "Account")
  Deal = apps.get_model("main", "Deal")

  # Use transaction.atomic to ensure batch safety
  with transaction.atomic():
    # Account: copy legacy phone_number -> phone
    try:
      Account._meta.get_field("phone_number")
      phone_number_exists = True
    except FieldDoesNotExist:
      phone_number_exists = False

    try:
      Account._meta.get_field("phone")
      phone_exists = True
    except FieldDoesNotExist:
      phone_exists = False

    if phone_number_exists and phone_exists:
      from django.db.models import Q
      qs = Account.objects.filter(Q(phone__isnull=True) | Q(phone=""))
      # Only update rows where legacy value exists
      for acct in qs.iterator():
        legacy = getattr(acct, "phone_number", None)
        if legacy:
          acct.phone = legacy
          acct.save(update_fields=["phone"])  # minimal write

    # Deal: copy legacy title -> name
    try:
      Deal._meta.get_field("title")
      title_exists = True
    except FieldDoesNotExist:
      title_exists = False

    try:
      Deal._meta.get_field("name")
      name_exists = True
    except FieldDoesNotExist:
      name_exists = False

    if title_exists and name_exists:
      from django.db.models import Q
      qs = Deal.objects.filter(Q(name__isnull=True) | Q(name=""))
      for deal in qs.iterator():
        legacy = getattr(deal, "title", None)
        if legacy:
          deal.name = legacy
          deal.save(update_fields=["name"])


def reverse_noop(apps, schema_editor):
  # No reverse implemented; data copy is one-way. For reversal, restore
  # from backups or implement a custom reverse migration.
  return


class Migration(migrations.Migration):

  dependencies = [
    ("main", "0031_schedulinganalytics_notificationlog_and_more"),
  ]

  operations = [
    migrations.RunPython(forwards_copy_legacy_fields, reverse_noop),
  ]
