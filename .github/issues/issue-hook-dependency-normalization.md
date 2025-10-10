# Issue: React Hook Dependency Normalization

## Summary
A subset of components still produce `react-hooks/exhaustive-deps` warnings after orchestrator & calendar refactors. These warnings hide genuine dependency errors and create uncertainty around data freshness.

## Remaining Warning Categories
| Component | Warning Example | Likely Fix |
|-----------|-----------------|-----------|
| AccountDetail | missing `loadAccountDetails` | Wrap fetcher in `useCallback` & add dep |
| AccountForm | missing `isEditMode`, `loadAccount` | Derive `isEditMode` via state/memo OR justify one-time bootstrap |
| AccountList | missing `loadAccounts` | `useCallback` + dependency add |
| ActivityTimeline | missing `loadActivities` | Same pattern |
| AnalyticsSnapshots | missing `fetchSnapshots` | `useCallback` or HOOK-JUSTIFY (snapshot static on mount?) |
| AppointmentRequestQueue | missing `applyFilter` | Stabilize filter function + deps |
| CertificationForm | missing `fetchCertification` | `useCallback` |
| InteractionList | missing `fetchInteractions` | `useCallback` |
| PageForm | missing `fetchPage`, `isEdit` | Similar to AccountForm |
| ProjectTemplateForm | missing `fetchTemplate` | `useCallback` |
| QuoteForm | missing `fetchQuoteData`, `isEditMode` | As above |
| QuoteList | missing `fetchQuotes` | `useCallback` |
| Reports | missing `fetchReports` | `useCallback` |
| RevenueForecast | missing `fetchForecast` | `useCallback` + memo of params |
| TaskAdministration | missing `formData.default_task_type` | HOOK-JUSTIFY (initial default seed) |
| TaxReport | missing `fetchTaxData` | `useCallback` |
| TechnicianPayroll | missing `fetchPayrollData` | `useCallback` |
| InteractionList | missing `fetchInteractions` | `useCallback` |

## Standard Patterns
1. Data Loader Wrapper: `const loadX = useCallback(async () => { ... }, [/* stable deps */])`
2. Bootstrap Effect: `useEffect(() => { loadX(); }, [loadX]); // HOOK-JUSTIFY(id)`
3. Reactive Effect: Split parameter-building `useMemo` from fetch `useEffect`.
4. Justification Format:
   ```
   // HOOK-JUSTIFY(Component:bootstrap)
   // Reason: Data loaded once; no reactive inputs. Edits handled via explicit refetch.
   ```

## Proposed Workflow
| Phase | Goal | Effort |
|-------|------|--------|
| 1 | Apply loader pattern to list/detail components | 0.5 day |
| 2 | Normalize edit-mode forms (AccountForm, QuoteForm, PageForm) | 0.5 day |
| 3 | Add/Refine HOOK-JUSTIFY comments & doc section | 0.25 day |
| 4 | Lint Gate: treat new hook warnings as errors | 0.25 day |

## Acceptance Criteria
- Zero hook warnings OR 100% covered by HOOK-JUSTIFY with documented rationale.
- Added section in `FRONTEND_TESTING.md` describing dependency strategy.
- New components follow template snippet added to `/frontend/src/__tests__/README.md`.

## Metrics
- Baseline warnings: 21 (current lint run).
- Target warnings: 0 (or fully justified).

| Date | PR | Remaining Warnings | Notes |
|------|----|--------------------|-------|
| (baseline) | — | 21 | Initial capture |

## Risks & Mitigations
- Accidental over-fetching after adding missing deps: use fetch-count tests to guard.
- Developer confusion about HOOK-JUSTIFY usage: provide quick-reference doc.

## Next Action
Refactor `AccountDetail.jsx` & `AccountList.jsx` as first exemplar and update this issue with pattern diff.

---
Owner: Frontend Reliability Initiative
Priority: High
