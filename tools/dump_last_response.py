import os
import django
import sys

# Ensure repository root is on sys.path so 'web' settings module can be imported
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

# Ensure Django settings are available when running this helper directly
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "web.settings")
django.setup()

from rest_framework.test import APIClient
from django.utils import timezone
from datetime import timedelta
from main.models import CustomUser, DealStage, Account, Contact

# Setup
# Create or reuse a test user without causing UNIQUE constraint errors on repeated runs
try:
    sales_manager = CustomUser.objects.get(username='sales_mgr2')
except CustomUser.DoesNotExist:
    sales_manager = CustomUser.objects.create_user(username='sales_mgr2', password='pass')

# Ensure DealStage entries exist (idempotent)
proposal_stage, _ = DealStage.objects.get_or_create(name='Proposal', defaults={'order': 1})
negotiation_stage, _ = DealStage.objects.get_or_create(name='Negotiation', defaults={'order': 2})

# Create or reuse Account and Contact to avoid duplicate inserts across runs
account, _ = Account.objects.get_or_create(name='DumpCorp', defaults={'owner': sales_manager})
contact, _ = Contact.objects.get_or_create(
    email='jane2@dump.com',
    defaults={'account': account, 'first_name': 'Jane', 'last_name': 'Doe', 'owner': sales_manager},
)

client = APIClient()
client.force_authenticate(user=sales_manager)

deal_data = {
    'title': 'Enterprise Software License',
    'account': account.id,
    'primary_contact': contact.id,
    'stage': proposal_stage.name,  # try passing string form
    'value': '50000.00',
    'close_date': (timezone.now().date() + timedelta(days=30)).isoformat(),
    'owner': sales_manager.id,
    'status': 'in_progress',
}
resp = client.post('/api/deals/', deal_data, format='json')
print('status', resp.status_code)
print('data', resp.data)
