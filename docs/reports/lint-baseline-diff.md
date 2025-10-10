# ESLint Baseline Diff
Generated: 2025-10-10 01:50:45

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
- (none)

## Top improvements since last snapshot (by rule)
- (none)

## Quality Gate Result
- status: PASS
- total delta vs main baseline: 6164 (allowed: 8000)
- per-rule max delta since last snapshot: 0 (allowed: 250)

## Invocation Parameters
- FrontendDir: C:\Users\sjand\ws\legendary-spoon\frontend
- ReportOut: C:\Users\sjand\ws\legendary-spoon\docs\reports\lint-baseline-diff.md
- SnapshotOut: C:\Users\sjand\ws\legendary-spoon\tools\..\docs\reports\lint-snapshot.json
- BaselineMain: C:\Users\sjand\ws\legendary-spoon\frontend\lint-baseline.json
- BaselineBatch: C:\Users\sjand\ws\legendary-spoon\frontend\lint-baseline-batch3.json
- MaxTotalDelta: 8000
- MaxRuleDelta: 250
- TopN: 10
