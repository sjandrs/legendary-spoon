# ADR-001: User Model Consolidation (CustomUser vs EnhancedUser)

Date: 2025-10-09
Status: Proposed
Deciders: Engineering Team

## Context

The codebase contains both `CustomUser` (Django auth user extension) and `EnhancedUser` (Phase 4 hierarchical user model). This duplication creates:
- Confusion and data drift risk (two user stores)
- Boilerplate joins/cross-links (EnhancedUser.technician, manager relationships)
- Permission checks spread across both types
- Increased complexity in serializers and API contracts

Existing usage:
- `CustomUser` used broadly across CRM entities (owner, submitted_by, created_by)
- `EnhancedUser` introduces org hierarchy, job attributes (department, job_title) and subordinate relations

## Decision

Consolidate to a single primary user model with hierarchical fields. Two viable options:

1) Merge EnhancedUser fields into CustomUser (preferred)
- Add `department`, `job_title`, `manager` self-FK, `technician` FK fields to `CustomUser`
- Migrate data from `EnhancedUser` into `CustomUser`
- Replace references to `EnhancedUser` with `CustomUser`
- Drop `EnhancedUser` model after a deprecation window

2) Replace CustomUser usage with EnhancedUser
- Make `EnhancedUser` the AUTH_USER_MODEL
- Migrate all foreign keys from `CustomUser` to `EnhancedUser`

We choose Option 1 to minimize disruptions: `CustomUser` is already pervasive across models and auth.

## Consequences

Pros:
- Single source of truth for users
- Simpler permissions, queries, and serializers
- Reduced cognitive load and maintenance

Cons:
- One-time migration complexity and data backfill
- Temporary dual-write or mapping during transition

## Implementation Plan

Phase A: Schema preparation
- Add fields to `CustomUser`: `department`, `job_title`, `manager` (nullable self-FK), `technician` (nullable FK)
- Add indexes for common filters (is_active, department)

Phase B: Data migration
- Create migration to copy data from `EnhancedUser` to `CustomUser` by matching on username or email
- For each EnhancedUser: set department, job_title, link manager via lookup, attach technician
- Validate subordinate relationships via manager mappings

Phase C: Code migration
- Update queries to use `CustomUser` everywhere
- Replace `EnhancedUser` serializers/viewsets with `CustomUser` equivalents
- Keep a read-only `EnhancedUser` view for a short period (feature flag)

Phase D: Cleanup
- Remove `EnhancedUser` model and related endpoints after validation window
- Remove compatibility code and feature flag

## Risks and Mitigations
- Orphaned relationships: add integrity checks in migration; log anomalies
- Permission regressions: add unit tests for manager/subordinate access paths
- API contract changes: provide deprecation notes and maintain field compatibility

## Alternatives Considered
- Keep both indefinitely: rejected due to long-term complexity
- Use proxy models: partial benefit; still leaves two models

## Testing Strategy
- Migration dry-run on staging with realistic data
- Unit tests: role checks, subordinate hierarchy, technician linking
- API tests: list/filter by department, manager hierarchy, auth flows

## Rollback Plan
- Maintain EnhancedUser table for one release while read-only
- If issues occur, switch feature flag to read EnhancedUser paths and backfill fixes
