# ESLint Baseline Diff
Generated: 2025-10-09 22:29:56

## Current Summary
- totalProblems: 7755
- errors: 7728
- warnings: 27

## Comparison
- Against main baseline: total=7755 (delta 6201, REGRESSED), errors=7728 (delta 6195), warnings=27 (delta 6)
- Against batch3 baseline: total=7755 (delta 7639, REGRESSED), errors=7728 (delta 7626), warnings=27 (delta 13)

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
- no-undef: 7585
- no-unused-vars: 104
- react-refresh/only-export-components: 28
- react-hooks/exhaustive-deps: 27
- import/no-extraneous-dependencies: 4
- no-empty: 3
- no-useless-escape: 2
- no-case-declarations: 1
- no-useless-catch: 1

## Quality Gate Result
- status: FAIL
- total delta vs main baseline: 6201 (allowed: 0)
- per-rule max delta since last snapshot: (no previous snapshot)

## Invocation Parameters
- FrontendDir: C:\Users\sjand\ws\legendary-spoon\frontend
- ReportOut: C:\Users\sjand\ws\legendary-spoon\docs\reports\lint-baseline-diff.md
- SnapshotOut: C:\Users\sjand\ws\legendary-spoon\tools\..\docs\reports\lint-snapshot.json
- BaselineMain: C:\Users\sjand\ws\legendary-spoon\frontend\lint-baseline.json
- BaselineBatch: C:\Users\sjand\ws\legendary-spoon\frontend\lint-baseline-batch3.json
- MaxTotalDelta: 0
- MaxRuleDelta: 0
- TopN: 10
