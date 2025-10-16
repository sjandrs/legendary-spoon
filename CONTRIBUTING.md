# Contributing to Converge

Thank you for contributing! This guide covers the spec-driven workflow guardrails and how to get fast, reliable feedback locally and in CI.

## Spec Validation (required)

Our repo enforces a spec-driven development workflow. A lightweight validator ensures that core design artifacts exist and remain structurally sound.

- What it checks:
  - Presence of rules: `.github/spec-driven-workflow-v1.instructions.md`
  - Key specs under `spec/` including `spec-design-master.md` and phase specs
  - Front matter keys in design specs: `title`, `version`, `last_updated`
  - Core master headings: Introduction; Requirements, Constraints & Guidelines; Interfaces & Data Contracts; Error Handling (numeric prefixes allowed)
  - Required artifacts present anywhere in repo: `requirements.md`, `design.md`, `tasks.md`

- How to run locally:
  - Python (inside venv recommended):
    - `python tools/spec_validate.py`

- Pre-commit:
  - Runs automatically on commit (hook id: `spec-validate`)
  - You can skip in emergencies with `git commit --no-verify` (not recommended)

- CI workflow:
  - GitHub Actions: “Spec Validation” runs on push and pull_request
  - Branch protection is **enabled** on `master` and `Development` branches requiring this check to pass before merge
    - Settings: `strict=false` (allows merge with out-of-date branch), `enforce_admins=false`
    - Pull requests will be blocked if Spec Validation fails

### Common failures and fixes

- Missing rules file
  - Ensure `.github/spec-driven-workflow-v1.instructions.md` exists

- Design spec missing front matter keys
  - At top of file add:
    ```
    ---
    title: <Human-friendly title>
    version: 1.0
    last_updated: 2025-10-10
    ---
    ```

- Master spec missing headings
  - Ensure the following headings (numeric prefixes like `## 3. Introduction` are fine):
    - `## Introduction`
    - `## Requirements, Constraints & Guidelines`
    - `## Interfaces & Data Contracts`
    - `## Error Handling`

- Required artifacts missing
  - Add minimal `spec/requirements.md`, `spec/design.md`, and `spec/tasks.md`

## Tests & Quality Gates

- Backend tests (pre-push): run automatically for Python changes
- Frontend tests (pre-push): run automatically for frontend changes
- Linting: Python (flake8), JS/TS (ESLint/Prettier) via pre-commit and CI

## Development tips

- Use `start-dev` VS Code task to run backend + frontend in parallel
- Seed data: `py manage.py migrate` then `py manage.py seed_data`

---

Reach out in PR if spec validator flags something that seems incorrect—we tune the validator to be strict but pragmatic.
