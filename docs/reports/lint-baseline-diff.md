# ESLint Baseline Diff
Generated: 2025-10-10 01:21:42

## Current Summary
- totalProblems: 7718
- errors: 7693
- warnings: 25

## Comparison
- Against main baseline: total=7718 (delta 6164, REGRESSED), errors=7693 (delta 6160), warnings=25 (delta 4)
- Against batch3 baseline: total=7718 (delta 7602, REGRESSED), errors=7693 (delta 7591), warnings=25 (delta 11)

### Batch3 Hook Warning Buckets (baseline reference)
- ActivityTimeline.jsx: loadActivities missing dependency
- AnalyticsSnapshots.jsx: fetchSnapshots missing dependency
- InteractionList.jsx: fetchInteractions missing dependency
- PageForm.jsx: fetchPage & isEdit missing dependencies
- ProjectTemplateForm.jsx: fetchTemplate missing dependency
- TaskAdministration.jsx: formData.default_task_type dependency
- TechnicianPayroll.jsx: fetchPayrollData missing dependency
- CertificationForm.jsx: fetchCertification missing dependency

## Per-rule counts (top 10)
- no-undef: 7574
- no-unused-vars: 79
- react-refresh/only-export-components: 28
- react-hooks/exhaustive-deps: 25
- no-empty: 6
- import/no-extraneous-dependencies: 2
- no-useless-escape: 2
- no-case-declarations: 1
- no-useless-catch: 1

## Top regressions since last snapshot (by rule)
- no-empty: +3 (prev 3 -> curr 6)

## Top improvements since last snapshot (by rule)
- no-unused-vars: -25 (prev 104 -> curr 79)
- no-undef: -11 (prev 7585 -> curr 7574)
- react-hooks/exhaustive-deps: -2 (prev 27 -> curr 25)
- import/no-extraneous-dependencies: -2 (prev 4 -> curr 2)

## Quality Gate Result
- status: FAIL
- total delta vs main baseline: 6164 (allowed: 0)
- per-rule max delta since last snapshot: 3 (allowed: 0)

## Invocation Parameters
- FrontendDir: C:\Users\sjand\ws\legendary-spoon\frontend
- ReportOut: C:\Users\sjand\ws\legendary-spoon\docs\reports\lint-baseline-diff.md
- SnapshotOut: .\docs\reports\lint-snapshot.json
- BaselineMain: C:\Users\sjand\ws\legendary-spoon\frontend\lint-baseline.json
- BaselineBatch: C:\Users\sjand\ws\legendary-spoon\frontend\lint-baseline-batch3.json
- MaxTotalDelta: 0
- MaxRuleDelta: 0
- TopN: 10


