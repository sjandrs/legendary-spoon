# META: Testing & Tooling Refinement Epic

**Labels:** epic, testing, quality

## Objective
Coordinate a cohesive refinement of frontend test reliability, network mocking fidelity, and lint/build resilience.

## Child Issues
1. 01-reinstate-msw.md
2. 02-shared-test-harness.md
3. 03-eslint-caught-errors-ignore.md
4. 04-codemod-regression-audit.md
5. 05-importmeta-stabilization.md
6. 06-extended-fetch-count-tests.md
7. 07-storybook-version-alignment.md
8. 08-msw-error-path-assertions.md

## Success Metrics
- Zero flaky network-related test failures over 2 consecutive CI runs.
- ≤ 5 open lint warnings (excluding intentional ignores) by completion.
- All fetch-count protected components remain single-fetch under unchanged user flows.

## Timeline (Indicative)
| Week | Focus |
|------|-------|
| 1 | Storybook alignment + MSW reinstatement |
| 2 | Shared harness + ESLint rule update |
| 3 | Codemod audit & import.meta docs/tests |
| 4 | Extended fetch-count tests + error path assertions |

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Scope creep | Strict acceptance criteria per issue |
| Hidden regressions | Add incremental PR checks & audit script |
| Team unfamiliarity with plugin | Document & add fixture test |

## Exit Criteria
All child issues closed; meta issue updated with final summary & outcomes.
