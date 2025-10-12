# 010 – Phase 1: Canonical API Parity Baseline

Milestone: Phase 1 – Canonical API Parity

## Goals
- Reconcile existing endpoints and payloads with canonical spec.
- Enforce RBAC consistently across Finance/Staff/Operations.
- Standardize pagination and error shapes.

## Deliverables (Issues to file)
- [ ] API Audit Document: route-by-route diff vs canonical
- [ ] RBAC tests: representative endpoints (401/403/200)
- [ ] Pagination standardization (count/next/previous/results)
- [ ] Error schema standardization and docs update
- [ ] JSON Schema alias mapping in validator endpoint

## Acceptance Criteria
- [ ] All reconciled endpoints have unit + API tests
- [ ] Docs/API.md contains request/response examples and error payloads
- [ ] CI: lint/tests PASS; coverage unchanged or improved

## Links
- Plan: spec/spec-lineup-cannon-features-60.md
- Mapping: spec/spec-reqs-mapping-60.md
