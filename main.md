# Converge CRM – Master Specification (AI coding agent)

This file serves as the top-level, living specification for Converge CRM when working with AI coding agents. It complements the detailed specs in `spec/` and user-facing docs in `README.md` and `docs/`.

## Sources of Truth

- User-facing docs: `README.md`, `docs/`
- Detailed specifications: `spec/` (compiled via `tools/spec_compile.py` into `spec/COMPILED_SPEC.md`)
- Primary detailed spec: `spec/spec-design-master.md` (PRIORITY for implementation details)
- Repository instructions: `.github/copilot-instructions.md`

## Architecture Summary

- Backend: Django + Django REST Framework in `main/`
- Frontend: React + Vite in `frontend/`
- Auth: Custom token authentication (`main/api_auth_views.py`)
- Data model: CRM, Accounting, Workflow, Field Service; see `main/models.py`

## Development Rules

1. Follow established patterns:
   - DRF ModelViewSet + serializers + permissions
   - Role-based access (Sales Rep vs Sales Manager)
   - Activity logging on create/update
2. Update tests with any behavior change; keep tests green
3. Prefer incremental, small PRs
4. Keep documentation and specs in sync

## Implementation Focus

When extending functionality, prioritize:

- Backend models/APIs per `spec/*`
- Frontend components and navigation wiring
- Business workflows in `main/signals.py` and related services

## Build and Quality

- Use VS Code tasks to run tests and linters
- CI must pass: Spec Validation, Spec Compile, Spec Pages, Spec Release
