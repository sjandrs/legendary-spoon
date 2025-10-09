# Issue: Lint Automation & Codemods

## Objective
Automate mechanical lint fixes (unused imports/vars, error param normalization) to accelerate technical debt burn-down without manual churn.

## Targets
- Unused Imports Pruner
- Unused Variable Safe Prefixer (for catch params / args)
- Hook Justification Audit Script

## Tooling Plan
1. Codemod (jscodeshift) - remove unused imported identifiers via usage scan.
2. ESLint Custom Rule or Script - find `catch (err)` where `err` not referenced -> rename to `_err`.
3. HOOK-JUSTIFY Auditor - grep for `HOOK-JUSTIFY(` and produce a JSON map: component -> justifications.
4. Baseline Snapshot - capture pre-clean counts into `lint-baseline.json`.

## CI Integration
- Add a job `lint-autofix` that runs codemods in dry-run, fails if diff exceeds threshold (e.g., >50 new unused occurrences) to protect against regression.

## Acceptance Criteria
- Scripts live under `scripts/lint/` with README.
- Running `npm run lint:codemod` performs safe modifications (idempotent).
- Documentation updated in `FRONTEND_TESTING.md` (Lint Automation section).

## Commands (Proposed)
```jsonc
// package.json excerpt
{
  "scripts": {
    "lint:codemod": "node scripts/lint/run-codemods.js",
    "lint:audit:hooks": "node scripts/lint/audit-hooks.js"
  }
}
```

## Phased Delivery
| Phase | Deliverable |
|-------|-------------|
| 1 | Unused import pruner |
| 2 | Catch param prefixer |
| 3 | HOOK-JUSTIFY auditor |
| 4 | CI dry-run integration |

## Risks
- False positives deleting dynamic requires (mitigate by ignoring non-static import patterns).
- Developer unfamiliarity (mitigate with clear README examples).

## Next Step
Scaffold `scripts/lint/` directory with placeholder scripts and open follow-up issues for each phase.

---
Owner: Frontend Tooling Initiative
Priority: Medium-High
