import os
import django
import sys
import unittest

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "web.settings")
django.setup()

def run_test_file(pattern="test_preview_migration_0032.py"):
    loader = unittest.TestLoader()
    suite = loader.discover("main/tests", pattern=pattern)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    pattern = sys.argv[1] if len(sys.argv) > 1 else "test_preview_migration_0032.py"
    sys.exit(run_test_file(pattern))
