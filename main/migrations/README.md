Migration 0032 — serializer_backcompat
=====================================

Purpose
-------
This migration copies legacy column values to the new model fields to preserve
backwards compatibility after renames:

- Account.phone_number -> Account.phone
- Deal.title -> Deal.name

Safety & runbook
----------------
1. Backup your production database.
2. Ensure your code (current branch) contains the models with both the old and
   new fields present if you expect to copy values. The migration is idempotent
   and will only copy when legacy columns exist.
3. Run migrations in a maintenance window (if needed):

   ```powershell
   .\venv\Scripts\Activate.ps1
   python manage.py migrate main 0032
   ```

4. Verify data: check a few records to ensure `phone`/`name` were populated.

5. Optional: remove legacy columns in a separate migration once you are
   confident no clients rely on them.

Notes
-----
- This migration performs minimal writes and uses Django ORM updates with
  `update_fields` for safer writes.
- The migration has a noop reverse. Restoring legacy values requires DB
  backups or custom reverse migration logic.
