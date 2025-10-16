<!-- markdownlint-disable-file -->
# Task Research Notes: Comprehensive Test Failure Analysis for 100% Pass Rate

## Research Executed

### Backend Test Analysis
- Backend test failures: 15 out of 139 tests failing (89.2% pass rate)
- Primary failure categories identified through test execution analysis

### Frontend Test Analysis
- Frontend test failures: 228 out of 1959 tests failing (88.3% pass rate)
- Major failure patterns in component tests and integration tests

### Code Analysis
- Model constraint issues requiring database schema fixes
- Missing URL patterns and API endpoint implementations
- Component functionality gaps in certification dashboard and other UI components

## Key Discoveries

### Backend Test Failures Analysis

#### Model Constraint Issues
1. **Deal.stage_id NOT NULL constraint failures** - Multiple tests failing because Deal objects created without required stage_id
2. **ScheduledEvent.technician_id NOT NULL constraint failures** - Event creation tests failing due to missing technician assignment
3. **DigitalSignature.content_type_id NOT NULL constraint failures** - Signature creation requires content type specification

#### API Endpoint Issues
1. **Missing 'send_invoice_email' URL pattern** - NoReverseMatch error in activity log tests
2. **Dev validator endpoints returning 501 Not Implemented** - JSON validation endpoints not fully implemented
3. **Account API authentication bypass** - Unauthenticated requests returning 200 instead of 401

#### Data Integrity Issues
1. **Budget V2 seed data missing** - Empty monthly distribution records causing assertion failures
2. **GTIN validation response format mismatch** - Error structure not matching expected format

### Frontend Test Failures Analysis

#### Component Functionality Gaps
1. **CertificationDashboard component** - Missing proper heading structure, accessibility issues
2. **Business workflow integration tests** - Component interaction failures
3. **Notification and blog post components** - State management and rendering issues

#### Test Infrastructure Issues
1. **MSW handler coverage gaps** - Some API endpoints not properly mocked
2. **Accessibility testing failures** - Screen reader compatibility and ARIA label issues
3. **Component mounting and state issues** - Async rendering and lifecycle problems

## Detailed Analysis and Solutions

### Backend Test Failures (15 failures)

#### 1. Deal.stage_id NOT NULL Constraint (7 failures)
**Root Cause**: Deal model save() method doesn't automatically assign stage_id when created in tests
**Files Affected**:
- main/tests/test_permissions_deeper.py (3 failures)
- main/tests/test_preview_migration_0032.py (1 failure)
- main/tests/test_search_and_routes.py (1 failure)
- main/tests/test_serializer_backcompat.py (1 failure)

**Solution**: Deal.save() method exists but stage assignment logic needs to be called consistently

```python
# In Deal.save() method (main/models.py line 434)
def save(self, *args, **kwargs):
    if not self.stage_id:
        # Ensure a stage is assigned - logic already exists but needs to be more robust
        try:
            first_stage = DealStage.objects.order_by("order").first()
            if not first_stage:
                first_stage = DealStage.objects.create(
                    name="Default",
                    order=1,
                    probability=0.5
                )
            self.stage = first_stage
        except Exception:
            pass
    super().save(*args, **kwargs)
```

#### 2. ScheduledEvent.technician_id NOT NULL Constraint (3 failures)
**Root Cause**: Tests create ScheduledEvent without required technician assignment
**Files Affected**:
- main/tests/test_activity_log.py (2 failures)
- main/tests/test_activity_log_projects_events.py (1 failure)

**Solution**: Fix test data setup to include technician or add defaults to model

#### 3. DigitalSignature.content_type_id NOT NULL Constraint (1 failure)
**Root Cause**: DigitalSignature.save() method sets object_id=0 but not content_type_id
**File Affected**: main/tests/test_activity_log.py

**Solution**: Enhance DigitalSignature.save() method to set default content_type

#### 4. Missing URL Pattern for 'send_invoice_email' (1 failure)
**Root Cause**: URL pattern exists as 'send-invoice-email' but test looks for 'send_invoice_email'
**File Affected**: main/tests/test_activity_log.py line 38

**Solution**: Fix test to use correct URL name 'send-invoice-email'

#### 5. Dev Validator Not Implemented (2 failures)
**Root Cause**: dev_validate_json returns 501 when jsonschema not installed
**File Affected**: main/tests/test_dev_validator.py

**Solution**: Install jsonschema dependency or mock the validator in tests

#### 6. Account API Authentication Bypass (1 failure)
**Root Cause**: Unauthenticated requests return 200 instead of 401
**File Affected**: main/tests/test_api_error_shapes.py

**Solution**: Fix Account API permissions to require authentication

#### 7. Budget V2 Seed Data Missing (1 failure)
**Root Cause**: BudgetV2 model has seed_default_distribution() method but it's not called automatically
**File Affected**: main/tests/test_budget_v2.py

**Solution**: Add post_save signal to call seed_default_distribution()

### Frontend Test Failures (228 failures)

#### 1. CertificationDashboard Component Issues (Multiple failures)
**Root Cause**: Component structure doesn't match test expectations for headings and accessibility
**Primary Issues**:
- Missing "Overview" heading (test expects h2 with "Overview")
- Accessibility issues with status indicators
- Screen reader compatibility problems

**Solution**: Add missing heading structure to CertificationDashboard.jsx

#### 2. MSW Handler Coverage Gaps
**Root Cause**: Some API endpoints not properly mocked in test setup
**Solution**: Expand MSW handlers in frontend/src/__tests__/utils/msw-handlers.js

#### 3. Component State Management Issues
**Root Cause**: Async rendering and lifecycle problems in various components
**Solution**: Improve test patterns with proper waitFor and async handling

## Recommended Implementation Plan

### Phase 1: Critical Backend Model Fixes
1. **Fix Deal.stage_id assignment** - Ensure stage assignment logic is robust
2. **Add Technician defaults** - Create test technician or fix test data setup
3. **Fix DigitalSignature content_type** - Set default content type in save method
4. **Add BudgetV2 post_save signal** - Automatically seed distributions
5. **Fix URL name mismatch** - Correct test to use 'send-invoice-email'

### Phase 2: Backend API & Authentication
1. **Install jsonschema dependency** - Fix dev validator endpoints
2. **Fix Account API permissions** - Enforce authentication properly

### Phase 3: Frontend Component Structure
1. **Add Overview heading** - Fix CertificationDashboard heading structure
2. **Improve accessibility** - Fix ARIA labels and screen reader support
3. **Expand MSW handlers** - Cover missing API endpoints

### Phase 4: Test Infrastructure Polish
1. **Enhance test data factories** - Better constraint handling
2. **Improve async test patterns** - Better waitFor usage
3. **Component lifecycle optimization** - Fix mounting/unmounting issues

## Complete Solutions

### Backend Fix Examples

```python
# 1. BudgetV2 auto-seeding (add to main/signals.py)
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import BudgetV2

@receiver(post_save, sender=BudgetV2)
def seed_budget_distributions(sender, instance, created, **kwargs):
    if created:
        instance.seed_default_distribution()

# 2. DigitalSignature content_type fix (main/models.py)
def save(self, *args, **kwargs):
    if not getattr(self, "object_id", None):
        self.object_id = 0
    if not getattr(self, "content_type", None):
        # Set default content_type to WorkOrder if available
        from django.contrib.contenttypes.models import ContentType
        try:
            self.content_type = ContentType.objects.get_for_model(WorkOrder)
        except:
            pass
    if not getattr(self, "ip_address", None):
        self.ip_address = "127.0.0.1"
    super().save(*args, **kwargs)

# 3. Test fixes (main/tests/test_activity_log.py)
url = reverse("send-invoice-email", kwargs={"invoice_id": inv_id})  # Fixed name
```

### Frontend Fix Examples

```jsx
// CertificationDashboard.jsx - Add Overview heading
<div className="certification-dashboard space-y-6">
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Certification Dashboard</h1>
      <p className="text-gray-600">All technician certifications</p>
    </div>
  </div>

  {/* Add Overview section */}
  <div className="overview-section">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
    {/* Status cards here */}
  </div>

  {/* Certifications section */}
  <div className="certifications-section">
    <h2 className="text-lg font-semibold text-gray-900">Certifications ({statusCounts.total})</h2>
    {/* Table here */}
  </div>
</div>
```

## Implementation Guidance
- **Objectives**: Achieve 100% test pass rate for both backend (139/139) and frontend (1959/1959)
- **Key Tasks**: Fix 15 backend failures (mainly model constraints) and 228 frontend failures (component structure)
- **Dependencies**: Django signals, jsonschema library, component accessibility improvements
- **Success Criteria**: All tests passing with proper error handling and accessibility compliance
