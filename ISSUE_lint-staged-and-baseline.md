# Adopt lint-staged and Relax ESLint Baseline Gate

Date: 2025-10-10
Owner: Frontend Platform
Labels: tooling, linting, DX, backlog

## Summary
Introduce lint-staged to run ESLint/Prettier only on staged files in pre-commit for fast feedback and improved developer experience, while keeping full ESLint in CI. Temporarily relax the ESLint baseline diff gate thresholds to avoid blocking commits while we work down the legacy backlog.

## Motivation
- Pre-commit hooks currently run full-project checks, causing friction and blocking small commits due to legacy lint.
- We want to maintain high standards in CI while making local commits fast and focused on changed files.

## Scope
- Configure lint-staged for `frontend/` JS/TS and formatting of CSS/JSON/MD.
- Integrate Prettier hook for consistent formatting.
- Relax lint baseline diff thresholds (VS Code task + CI) temporarily; re-tighten as backlog decreases.

## Acceptance Criteria
- Pre-commit runs lint-staged and formats/lints only staged files.
- CI continues to run full ESLint and fails on violations beyond relaxed baseline gate.
- Document remediation plan and target dates for tightening thresholds.

## Implementation
- Add prettier and lint-staged to pre-commit config.
- Add `lint-staged` config to `frontend/package.json`.
- Update `lint: gate-baseline` task to allow temporary deltas (MaxTotalDelta=8000, MaxRuleDelta=250).

## Rollback/Tightening Plan
- Week 1: MaxTotalDelta 8000 → 5000
- Week 2: 5000 → 2500
- Week 3: 2500 → 500
- Week 4: 500 → 0 (restore strict gate)

## Risks
- Inconsistent formatting outside `frontend/` sub-tree.
- Partial improvements stall and thresholds remain relaxed.

## Mitigations
- Weekly dashboard on lint deltas from `tools/lint_baseline_diff.ps1` artifacts.
- Assign owners for top 5 rule regressions.

## Tasks
- [x] Add lint-staged to pre-commit
- [x] Add Prettier hook
- [x] Add lint-staged config to `frontend/package.json`
- [x] Relax baseline gate thresholds in VS Code task
- [ ] Mirror threshold changes in CI workflow (if applicable)
- [ ] Update `FRONTEND_TESTING.md` with lint-staged usage

