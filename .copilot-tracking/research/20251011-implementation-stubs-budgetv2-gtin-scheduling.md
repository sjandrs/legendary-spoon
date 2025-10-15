<!-- markdownlint-disable-file -->
# Task Research Notes: Implementation Stubs (Budget v2, GTIN, Scheduling)

## Research Executed

### File Analysis
- main/models.py and main/serializers.py
  - Targets for new model (BudgetCategoryAccountMap), WarehouseItem.gtin field, and BudgetV2Serializer.
- main/admin.py, main/api_views.py, main/api_urls.py
  - Patterns for registering admin, APIViews, and URL routes.
- main/tests.py
  - DRF APITestCase patterns to mirror for minimal tests.

### Code Search Results
- mapping model/admin patterns; APIView + url routing.

### External Research
- #fetch:https://www.django-rest-framework.org/api-guide/serializers/
  - key_information_gathered: Nested serializers and validation approaches.
- #fetch:https://www.gs1.org/standards/id-keys/gtin
  - key_information_gathered: GTIN lengths 8/12/13/14 and modulo-10 check digit.

### Project Conventions
- Standards referenced: Draft-07 closed schemas; DRF ViewSet/APIView; role-based permissions.
- Instructions followed: research-only; copy-paste stubs with file paths indicated.

## Key Discoveries

### Project Structure
Implement in small steps: models→admin→serializers→views/urls→command→tests.

### Implementation Patterns
- Keep serializer validation close to input; heavier enforcement in services.
- Expose a tiny utility endpoint for GTIN check digits.

### Complete Examples
```python
# File: main/models.py
from django.db import models
from django.conf import settings

class BudgetCategoryAccountMap(models.Model):
    category_name = models.CharField(max_length=128)
    ledger_account = models.ForeignKey('main.LedgerAccount', on_delete=models.PROTECT)
    active = models.BooleanField(default=True)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Budget Category → Ledger Account Map'
        verbose_name_plural = 'Budget Category → Ledger Account Maps'
        indexes = [models.Index(fields=['category_name', 'active'])]

    def __str__(self):
        return f"{self.category_name} → {self.ledger_account}"

# Add to class WarehouseItem:
# gtin = models.CharField(max_length=14, blank=True, help_text="Digits-only GTIN (8/12/13/14)")
```

```python
# File: main/admin.py
from django.contrib import admin
from .models import BudgetCategoryAccountMap

@admin.register(BudgetCategoryAccountMap)
class BudgetCategoryAccountMapAdmin(admin.ModelAdmin):
    list_display = ('category_name', 'ledger_account', 'active', 'effective_from', 'effective_to')
    list_filter = ('active',)
    search_fields = ('category_name', 'ledger_account__name', 'ledger_account__code')
    readonly_fields = ('created_at', 'updated_at')
```

```python
# File: main/serializers.py
from rest_framework import serializers
from .models import WarehouseItem

class BudgetV2AccountSerializer(serializers.Serializer):
    ledger_account_id = serializers.IntegerField(min_value=1)
    budget_amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)

class BudgetV2Serializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(max_length=255)
    budget_against = serializers.ChoiceField(choices=["Cost Center", "Project"])  # align to schema
    dimension_id = serializers.IntegerField(min_value=1)
    year = serializers.IntegerField(min_value=1900, max_value=2100)
    monthly_distribution = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    accounts = BudgetV2AccountSerializer(many=True)
    created_by = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    def validate(self, attrs):
        if not attrs.get('accounts'):
            raise serializers.ValidationError({'accounts': 'At least one account is required.'})
        return attrs

    def create(self, validated_data):
        # TODO: delegate to service to create Budget v2 and related rows; set created_by from context.user
        raise NotImplementedError

    def update(self, instance, validated_data):
        # TODO: implement per business rules
        raise NotImplementedError

class WarehouseItemSerializer(serializers.ModelSerializer):
    gtin = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = WarehouseItem
        fields = '__all__'

    def validate_gtin(self, value: str):
        if value in (None, ''):
            return value
        digits = ''.join(ch for ch in value if ch.isdigit())
        if digits not in (digits) or digits == '':
            raise serializers.ValidationError('GTIN must contain digits only.')
        if len(digits) not in (8, 12, 13, 14):
            raise serializers.ValidationError('GTIN length must be 8, 12, 13, or 14 digits.')
        if not _is_valid_gtin(digits):
            raise serializers.ValidationError('Invalid GTIN check digit.')
        return digits

def _is_valid_gtin(digits: str) -> bool:
    return digits[-1] == _compute_check_digit(digits[:-1])

def _compute_check_digit(base: str) -> str:
    # GS1 modulo-10
    total = 0
    # right-to-left weighting 3,1,3,1...
    for i, ch in enumerate(reversed(base), start=1):
        n = ord(ch) - 48
        total += n * (3 if i % 2 == 1 else 1)
    mod = total % 10
    cd = (10 - mod) % 10
    return str(cd)
```

```python
# File: main/api_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

class GTINCheckDigitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        base = request.data.get('base', '')
        if not base.isdigit():
            return Response({'error': 'Base must be digits-only.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(base) not in (7, 11, 12, 13):
            return Response({'error': 'Invalid base length (must be 7, 11, 12, or 13).'}, status=status.HTTP_400_BAD_REQUEST)
        check_digit = _compute_check_digit(base)
        return Response({'base': base, 'check_digit': check_digit, 'gtin': base + check_digit})

# Ensure _compute_check_digit is imported or duplicated here.
```

```python
# File: main/api_urls.py
from django.urls import path
from .api_views import GTINCheckDigitView

urlpatterns += [
    path('utils/gtin/check-digit/', GTINCheckDigitView.as_view(), name='gtin-check-digit'),
]
```

```python
# File: main/management/commands/migrate_budgets_v2.py
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Migrate Budget v1 records to Budget v2 using the mapping table.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **options):
        dry = options['dry_run']
        # TODO: load mapping, iterate v1 budgets, determine dimension (default General Operations),
        # translate categories→accounts, create MonthlyDistribution if needed, create v2 via service.
        self.stdout.write(self.style.SUCCESS('Migration completed (stub). Dry-run=%s' % dry))
```

```python
# File: main/tests.py (additions)
from rest_framework.test import APITestCase
from rest_framework import status

class WarehouseItemGTINTests(APITestCase):
    def test_gtin_valid(self):
        # arrange valid payload with gtin
        # act: POST /api/warehouse-items/
        # assert: 201 and stored normalized
        pass

    def test_gtin_invalid_length(self):
        # act: POST with 9-digit gtin
        # assert: 400
        pass

class GTINHelperTests(APITestCase):
    def test_check_digit(self):
        # act: POST /api/utils/gtin/check-digit/ with base
        # assert: 200 and expected check_digit
        pass

class BudgetV2ApiTests(APITestCase):
    def test_create_budget_v2_cost_center(self):
        # arrange: user, ledger accounts, cost center, monthly distribution
        # act: POST /api/budgets-v2/
        # assert: 201, created_by, accounts persisted
        pass

    def test_create_budget_v2_missing_accounts(self):
        # assert 400
        pass
```
```

### API and Schema Documentation
- Budget v2 & MonthlyDistribution, WarehouseItem (gtin), scheduling schemas remain sources of truth.

### Configuration Examples
```json
{ "base": "0123456789012" }
```

### Technical Requirements
- Align implementations exactly to serializer contracts and research defaults.

## Recommended Approach
Copy these stubs into their respective files and incrementally replace TODOs with service integrations and validations.

## Implementation Guidance
- Objectives: Provide ready-to-paste scaffolding for fast iteration.
- Key Tasks: Paste stubs; wire URLs; run makemigrations/migrate; implement service-backed create for Budget v2; write tests per minimal plan.
- Dependencies: LedgerAccount, Cost Center/Project, MonthlyDistribution.
- Success Criteria: Builds, migrations, and minimal tests pass; endpoints operational.
