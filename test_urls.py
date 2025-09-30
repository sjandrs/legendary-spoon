import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web.settings')
import django
django.setup()

from main import api_urls

print('=== URLPATTERNS DEBUG ===')
print(f'Total patterns: {len(api_urls.urlpatterns)}')
for pattern_index, pattern in enumerate(api_urls.urlpatterns):
    pattern_str = str(getattr(pattern, 'pattern', getattr(pattern, 'regex', pattern)))
    if 'analytics' in pattern_str:
        name = getattr(pattern, 'name', 'no name')
        print(f'{pattern_index}: {pattern_str} -> {name}')

print('\n=== ROUTER URLS DEBUG ===')
for url in api_urls.router.urls:
    if 'analytics' in str(url.pattern):
        print(f'{url.pattern} -> {url.name}')