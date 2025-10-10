# Draft: Prevent duplicated/concatenated test artifacts

- Status: Draft
- Created: 2025-10-08
- Owner: TBD

## Summary
A test file (`UserRoleManagement.test.jsx`) became corrupted with concatenated content and nested import blocks during iterative edits, leading to parse failures and blocked migrations.

## Impact
- Test suite parse failures
- Lost time debugging syntax errors
- Risk of committing corrupted files

## Reproduction
- Overlapping edits introduced duplicated imports and describe blocks

## Proposed Guardrails
- Use atomic file replacements for large refactors
- Add a simple pre-commit check that rejects test files containing multiple `import React` lines or nested `import` statements not at file top
- Consider a script to validate balanced braces in test files
- Encourage focused Jest after each edit (`--runInBand`), per-file

## Acceptance Criteria
- Pre-commit hook fails if nested imports are detected in test files
- Documented recovery procedure (delete and recreate from minimal smoke test)

## Notes
- Reference: `.github/copilot-instructions.md` testing infra guidance.
