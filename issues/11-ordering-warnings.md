# Issue 11: DRF UnorderedObjectListWarning on list endpoints

DRF warns that pagination may yield inconsistent results when QuerySets are unordered. We see warnings for:
- Account
- Technician
- Certification
- CoverageArea
- TechnicianAvailability

## Impact
- Pagination order may change between requests under concurrent writes.
- Test logs are noisy; could mask real issues.

## Proposed Fixes (choose per endpoint)
1) Set stable ordering on the model
```python
class Account(models.Model):
    class Meta:
        ordering = ("name", "id")
```
2) Or set ordering on the ViewSet
```python
class AccountViewSet(ModelViewSet):
    ordering_fields = ("name", "id", "created_at")
    ordering = ("name", "id")
```
3) Add/expand index coverage for chosen ordering fields if large datasets.

## Acceptance Criteria
- No UnorderedObjectListWarning in test runs.
- Deterministic ordering asserted in minimal list tests.
- Pagination behavior verified on at least one endpoint with > page_size records.

## Notes
- Prefer ViewSet.ordering if domain-specific sort differs per endpoint; prefer Model.Meta.ordering if global consistency is desired.
- Ensure default ordering matches common UI expectations (e.g., alpha by name).
