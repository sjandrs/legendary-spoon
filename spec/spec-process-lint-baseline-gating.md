---
title: Process Spec — ESLint Baseline Diff, Per-Rule Deltas, and Quality Gate
version: 1.0
date_created: 2025-10-10
last_updated: 2025-10-10
owner: Engineering
tags: [process, quality, lint, ci, javascript, powershell]
---

# Introduction

This specification defines the process, tooling, and quality gates for tracking ESLint status against legacy baselines, computing per-rule deltas, and enforcing non-regression in developer workflows and CI. It standardizes how lint debt is measured, reported, and gated to ensure continuous improvement without blocking daily work unnecessarily.

## 1. Purpose & Scope

- Purpose: Provide a deterministic, automated mechanism to compare current ESLint results to established baselines, surface per-rule changes, and fail builds on regressions beyond configured thresholds.
- Scope:
  - Frontend code under `frontend/src` (TypeScript/JavaScript/JSX/TSX).
  - Windows-first local execution (PowerShell 5.1) with cross-platform CI compatibility via Node/ESLint/npx.
  - Artifacts generated under `docs/reports/` for auditability.
- Audience: Frontend engineers, QA, DevOps/CI maintainers, team leads.
- Assumptions: Node and ESLint are installed via the frontend workspace; developers use VS Code tasks or PowerShell to run tools.

## 2. Definitions

- ESLint: JavaScript/TypeScript linter for static analysis of code quality and style.
- Baseline: A JSON file capturing the accepted legacy ESLint violations at a point in time (e.g., `frontend/lint-baseline.json`).
- Snapshot: A JSON file (`docs/reports/lint-snapshot.json`) recording the most recent run’s per-rule counts for delta computation over time.
- Per-rule Delta: The difference in count for a specific ESLint rule between the current run and the previous snapshot.
- Quality Gate: A policy that fails the execution (non-zero exit) when thresholds (total or per-rule) are exceeded.
- CI Parity: Running ESLint locally with the same configuration and scope as CI to ensure consistent results.

## 3. Requirements, Constraints & Guidelines

- REQ-001: The system shall produce a Markdown report at `docs/reports/lint-baseline-diff.md` comparing current ESLint results against one or more baselines.
- REQ-002: The system shall compute per-rule counts and write a snapshot to `docs/reports/lint-snapshot.json` for future delta comparisons.
- REQ-003: The system shall support thresholds `MaxTotalDelta` and `MaxRuleDelta` to enforce a quality gate by exiting with a non-zero code on regression.
- REQ-004: The system shall run on Windows PowerShell 5.1 without requiring policy changes beyond the documented task command.
- REQ-005: The system shall attempt robust ESLint resolution (npx on Windows, fallback to local `.bin`) and gracefully fail with actionable messaging if ESLint is unavailable.
- REQ-006: The system shall parse ESLint JSON output; if unavailable, it shall extract totals from text output as a fallback.
- REQ-007: The report shall include: current totals, baseline comparisons, per-rule top regressions/improvements, and gate result (PASS/FAIL) with reasons.
- REQ-008: The system shall not require network access; all analysis must be local.
- REQ-009: The system shall avoid non-ASCII symbols in PowerShell output strings (e.g., use "delta" instead of the Unicode Δ symbol).
- SEC-001: The tooling shall not collect or transmit source code or secrets; only lint summary data is stored in artifacts.
- CON-001: Analysis scope is limited to `frontend/src` matching extensions `.js,.jsx,.ts,.tsx` unless explicitly configured otherwise.
- GUD-001: Default thresholds should be strict (`0`) in gate tasks to prevent regressions; teams may relax for transitional phases.
- PAT-001: Prefer minimal, deterministic text output in CI; put human-readable detail in Markdown artifacts.

## 4. Interfaces & Data Contracts

4.1 VS Code Tasks

- lint: ci-parity
  - cwd: `frontend`
  - command: `npx eslint --max-warnings=0 --ext .js,.jsx,.ts,.tsx src`
  - outcome: Runs ESLint with local config; fails on any warnings/errors.

- lint: baseline-diff
  - command: `powershell -NoProfile -ExecutionPolicy Bypass -File "${workspaceFolder}\tools\lint_baseline_diff.ps1"`
  - outcome: Generates `docs/reports/lint-baseline-diff.md` and `docs/reports/lint-snapshot.json`; returns 0 regardless of deltas by default.

- lint: gate-baseline
  - command: `powershell -NoProfile -ExecutionPolicy Bypass -File "${workspaceFolder}\tools\lint_baseline_diff.ps1" -MaxTotalDelta 0 -MaxRuleDelta 0`
  - outcome: Same as baseline-diff but fails (non-zero) if total or any rule delta > 0.

4.2 Script Interface (PowerShell)

- Entrypoint: `tools/lint_baseline_diff.ps1`
- Parameters (examples):
  - `-SnapshotOut "docs/reports/lint-snapshot.json"` (optional; defaults to path in the script)
  - `-MaxTotalDelta 0` (optional; default may be relaxed for reporting-only runs)
  - `-MaxRuleDelta 0` (optional)
  - `-TopN 10` (optional; how many top regressions/improvements to show)

4.3 Snapshot JSON Schema (stable contract)

```json
{
  "timestamp": "YYYY-MM-DDTHH:MM:SS",
  "totalProblems": 0,
  "errors": 0,
  "warnings": 0,
  "ruleCounts": {
    "rule-name-1": 123,
    "rule-name-2": 4
  }
}
```

4.4 Markdown Report Structure (machine-readable anchors)

- Title: "ESLint Baseline Diff"
- Sections (in this order):
  1. Current Totals
  2. Baseline Comparisons (vs each known baseline)
  3. Per-Rule Changes
     - Top Regressions (N)
     - Top Improvements (N)
  4. Quality Gate Result
  5. Invocation Parameters (echo)

## 5. Acceptance Criteria

- AC-001: Given no changes vs baseline, when `lint: gate-baseline` runs, then exit code is 0 and report marks status as "NO CHANGE".
- AC-002: Given one new ESLint violation, when `lint: gate-baseline` runs with `MaxTotalDelta 0`, then exit code is non-zero and report includes a "REGRESSED" status and lists the rule in Top Regressions.
- AC-003: Given improvements (negative deltas) and no regressions, when `lint: gate-baseline` runs, then exit code is 0 and the report highlights improvements with negative deltas.
- AC-004: Given ESLint is not installed, when any lint task runs, then a clear error message is emitted explaining how to install or run from `frontend/`, and exit code is non-zero.
- AC-005: Given ESLint JSON output is unavailable, when the script runs, then totals are derived from text output and a report is still generated.

## 6. Test Automation Strategy

- Test Levels: Script-level integration tests; lightweight unit tests for helper functions (optional).
- Frameworks: Pester 5 for PowerShell script tests; Jest for verifying ESLint configuration integrity (optional).
- Test Data Management: Use a small fixture project (subset of `frontend/src`) to generate deterministic lint outputs for CI tests.
- CI/CD Integration: Add a CI job that runs `lint: ci-parity` (fail-fast) and `lint: gate-baseline` (artifact + gate). Store `docs/reports/lint-baseline-diff.md` and `lint-snapshot.json` as build artifacts.
- Coverage Requirements: Not applicable for scripts; ensure Pester asserts cover success, regression, fallback parsing, and missing-ESLint cases.
- Performance Testing: Ensure script completes within 2 minutes on typical developer machines for the full `frontend/src`.

## 7. Rationale & Context

Lint baselines enable teams to adopt stricter rules without blocking progress. However, without automated gates, debt can silently grow. This spec defines a measured approach: report deltas, preserve visibility with artifacts, and enforce non-regression through configurable thresholds. Per-rule deltas add precision by identifying which rules trend in the wrong direction.

## 8. Dependencies & External Integrations

### External Systems
- EXT-001: None.

### Third-Party Services
- SVC-001: None.

### Infrastructure Dependencies
- INF-001: Node.js + npm available in the developer environment and CI agents.

### Data Dependencies
- DAT-001: Baseline files: `frontend/lint-baseline.json`, `frontend/lint-baseline-batch3.json`.
- DAT-002: Snapshot artifact path: `docs/reports/lint-snapshot.json`.

### Technology Platform Dependencies
- PLT-001: PowerShell 5.1 on Windows for local execution.
- PLT-002: ESLint, executed via `npx` with repo-local configuration `frontend/eslint.config.js`.

### Compliance Dependencies
- COM-001: None.

## 9. Examples & Edge Cases

```powershell
# Reporting only (no gate), default snapshot path
powershell -NoProfile -ExecutionPolicy Bypass -File \
  .\tools\lint_baseline_diff.ps1

# Strict gate: fail on any regression in totals or per-rule
powershell -NoProfile -ExecutionPolicy Bypass -File \
  .\tools\lint_baseline_diff.ps1 -MaxTotalDelta 0 -MaxRuleDelta 0

# Custom snapshot output and top-5 summaries
powershell -NoProfile -ExecutionPolicy Bypass -File \
  .\tools\lint_baseline_diff.ps1 -SnapshotOut .\docs\reports\lint-snapshot.json -TopN 5
```

Edge cases:
- ESLint not found (npx missing): emit guidance and exit non-zero.
- ESLint JSON output formatting changes: fallback text parsing yields totals; per-rule deltas are omitted with a warning.
- Unicode in console output: use ASCII-safe strings (e.g., "delta") to avoid PowerShell formatting errors.

## 10. Validation Criteria

- The tasks `lint: ci-parity`, `lint: baseline-diff`, and `lint: gate-baseline` are present and runnable in VS Code.
- Running `lint: baseline-diff` creates both `docs/reports/lint-baseline-diff.md` and `docs/reports/lint-snapshot.json`.
- Running `lint: gate-baseline` fails with non-zero exit on any regression with thresholds set to 0.
- Reports consistently show per-rule top regressions/improvements when ESLint JSON is available.
- On machines without ESLint, the task fails fast with a clear remediation message.

## 11. Related Specifications / Further Reading

- docs/reports/scripts/README.md — Lint scripts documentation and workflows
- docs/DEVELOPMENT.md — Development workflow and quality gates
- docs/reports/LINT_REDUCTION_ROADMAP.md — Progressive plan to reduce lint debt
