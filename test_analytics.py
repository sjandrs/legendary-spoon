#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

# Create test client
client = APIClient()

# Get test user
User = get_user_model()
user = User.objects.filter(is_active=True).first()
if not user:
    print('No active users found')
    exit(1)

# Get or create token
token, created = Token.objects.get_or_create(user=user)
client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)

# Test analytics endpoint
response = client.get('/api/analytics/dashboard-v2/')
print(f'Status: {response.status_code}')
if response.status_code == 200:
    print('✅ Analytics API working!')
    print('Response data:')
    import json
    print(json.dumps(response.data, indent=2))
else:
    print(f'❌ Error: {response.content.decode()}')
