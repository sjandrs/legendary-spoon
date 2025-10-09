import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "web.settings")
django.setup()

from rest_framework.test import APIClient
from django.utils import timezone
from datetime import timedelta
from main.models import CustomUser, DealStage, Account, Contact

# Setup test data
User = CustomUser
sales_manager, _ = User.objects.get_or_create(username="sales_mgr")
if not sales_manager.has_usable_password():
    sales_manager.set_password("testpass123")
    sales_manager.save()

# Ensure deal stages
proposal_stage, _ = DealStage.objects.get_or_create(name="Proposal", defaults={"order": 1})
negotiation_stage, _ = DealStage.objects.get_or_create(name="Negotiation", defaults={"order": 2})
closed_won_stage, _ = DealStage.objects.get_or_create(name="Closed Won", defaults={"order": 3})

# Create account and contact
account = Account.objects.create(name="Deal Test Corp", owner=sales_manager)
contact = Contact.objects.create(account=account, first_name="Jane", last_name="Doe", email="jane@dealtester.com", owner=sales_manager)

client = APIClient()
client.force_authenticate(user=sales_manager)

deal_data = {
    "title": "Enterprise Software License",
    "account": account.id,
    "primary_contact": contact.id,
    "stage": proposal_stage.id,
    "value": "50000.00",
    "close_date": (timezone.now().date() + timedelta(days=30)).isoformat(),
    "owner": sales_manager.id,
    "status": "in_progress",
}

resp = client.post("/api/deals/", deal_data, format='json')
print('status', resp.status_code)
print('data', resp.data)

if resp.status_code >= 400:
    # Print serializer errors or raw response content
    try:
        import json
        print('json:', json.dumps(resp.data, indent=2))
    except Exception:
        print('raw', resp.content)
