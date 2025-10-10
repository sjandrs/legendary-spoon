# Codemod Regression Audit (Undefined Symbol Scan)

**Labels:** codemod, tech-debt, reliability

## Summary
Unused import removal codemod occasionally pruned imports that were still referenced, producing `no-undef` errors. Need an automated audit.

## Plan
1. Script `scripts/audit/unused-import-regressions.cjs` parsing JS/JSX.
2. Collect identifiers lacking declarations.
3. Cross-reference codemod commit diff to surface likely regressions.
4. Output JSON + markdown report with restore suggestions.

## Acceptance Criteria
- Report generated with current `no-undef` plus latent candidates.
- ≤ minimal false positives (verify with 10 sample files).
- Action list of imports to restore or code to adjust.
