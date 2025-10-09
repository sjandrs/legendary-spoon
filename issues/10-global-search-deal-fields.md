# Issue 10: Global Search Uses Invalid Deal Fields

Severity: High
Type: Bug
Status: Open

## Summary
`GlobalSearchView` queries the `Deal` model using `name` and `description` fields which do not exist; the model defines `title` only (and no `description`).

## Impact
- Runtime `FieldError` when executing search queries including deals.
- Incomplete search results leading to degraded user experience.

## Acceptance Criteria
1. Deal search uses only valid fields (`title`, optionally related `account__name`).
2. Updated unit test verifying search executes without errors and returns expected deal snippet.
3. Remove or conditionally handle non-existent fields.

## Proposed Fix
- Replace `Q(name__icontains=...) | Q(description__icontains=...)` with `Q(title__icontains=...)`.
- Adjust result mapping (`deal.name` -> `deal.title`).

## Risks
Minimal; low scope change. Must ensure no frontend dependency on `name` key returning in search response.

## Next Steps
- [ ] Patch view.
- [ ] Add regression test.
- [ ] Confirm frontend expectations; update if necessary.
