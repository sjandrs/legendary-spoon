# Lint Script Documentation

This folder centralizes documentation related to the repository's linting scripts and workflows.

- Origin: content relocated from `frontend/scripts/lint/README.md`
- Scope: notes, guides, and references for running and maintaining lint tasks

## What this covers
- How linting is invoked in the project (frontend and backend)
- Where the primary configuration lives
	- Frontend ESLint config: `frontend/eslint.config.js`
	- Frontend package scripts: `frontend/package.json` (e.g., `npm run lint`)
	- Backend linting (flake8): configured via `.flake8` at repo root
- Any lint baseline files or exception lists used to manage adoption over time

## Usage (summary)
- Frontend: run ESLint via the package script (from `frontend/`): `npm run lint`
- Backend: run flake8 from the repo root (see VS Code task "run-lint-backend")

## Maintenance
- When lint rules or scripts change, update this documentation and reference files above
- Keep links and paths accurate if files move

## Related docs
- `docs/DEVELOPMENT.md` — development workflow and quality gates
- `docs/reports/` — broader testing and quality reports

## Lint baselines & technical debt controls

These resources help increase reliability while safely reducing technical debt over time:

- Frontend ESLint baselines
	- `frontend/lint-baseline.json` — current baseline for legacy issues captured during adoption
	- `frontend/lint-baseline-batch3.json` — staged reduction set for incremental cleanup
	- Purpose: enable progressive rule adoption without blocking work; shrink these files as violations are fixed

- Backend Python linting (flake8)
	- Configuration file: `.flake8` (repo root)
	- Guidance: keep `exclude`/`ignore` targeted and reduce them as code is modernized

- Tracking & roadmap docs
	- `docs/reports/LINT_REDUCTION_ROADMAP.md` — plan for removing baseline entries and tightening rules
	- `docs/reports/ISSUE-frontend-lint-reduction-tracking.md` — active tracking of remaining ESLint items
	- `docs/reports/HOOK_DEPENDENCY_REMEDIATION.md` — related remediation that can surface lint issues

### Suggested usage
- Run via VS Code tasks:
	- Frontend: "run-lint-frontend" (executes `npm run lint` in `frontend/`)
	- Backend: "run-lint-backend" (executes flake8 using `.flake8`)
	- CI parity lint: "lint: ci-parity" (runs ESLint with `--max-warnings=0` against `frontend/src`)
	- Baseline diff report: "lint: baseline-diff" (generates `docs/reports/lint-baseline-diff.md` and snapshot JSON)
	- Baseline quality gate: "lint: gate-baseline" (fails on regression vs baseline thresholds)
- When fixing warnings, prefer removing entries from the baseline files over adding new suppressions
- Avoid blanket `/* eslint-disable */` or `# noqa` — scope rule disables narrowly and include a short rationale with a TODO/issue link
- Periodically regenerate or audit baselines to verify they still reflect only legacy debt
# Lint Automation Scripts

## Overview
These scripts provide incremental, reviewable automation for reducing lint noise (unused imports/vars) and auditing hook justification annotations.

## Scripts
| Script | Purpose | Write Mode |
|--------|---------|------------|
| prune-unused-imports.js | Detect & optionally remove unused named imports | --write |
| prefix-unused-catch.js | Rename unused catch param `err` -> `_err` | --write |
| audit-hooks.js | Report HOOK-JUSTIFY usage & heuristic hook warnings | read-only |
| run-codemods.js | Orchestrate codemods (imports + catch) | --dry-run to preview |

## NPM Commands
- `npm run lint:codemod:dry` – Show prospective changes (JSON reports) without modifying files.
- `npm run lint:codemod` – Apply codemods (`--write`).
- `npm run lint:audit:hooks` – Output JSON audit of hook justifications.

## Workflow Recommendation
1. Run dry preview: `npm run lint:codemod:dry`.
2. Review diff (git diff) for safety.
3. Apply: `npm run lint:codemod`.
4. Run ESLint: `npm run lint` to confirm reduction.
5. Commit with conventional message: `chore(lint): prune unused imports batch 1`.

## Limitations
- Import parser is regex-based (heuristic). Complex re-export patterns may be skipped.
- Does not currently handle TypeScript type-only imports specially (future improvement).

## Future Enhancements
- AST (babel) parsing for higher accuracy.
- Add unused variable transformation for top-level consts (safe subset).
- Integrate baseline regression guard in CI.

## Specifications
- See `spec/spec-process-lint-baseline-gating.md` for the formal process spec covering baseline diffs, per-rule deltas, and the quality gate tasks.
