# DevEx: Post lint baseline summary as PR comment/status

Date: 2025-10-10
Labels: tooling, linting, DX, github-actions

## Summary
On pull_request events, post (and update) a single comment summarizing lint baseline results with links to artifacts.

## Motivation
Give reviewers immediate signal on lint regressions/improvements within a PR without downloading artifacts.

## Scope
- Trigger on `pull_request` job(s) after baseline generation.
- Create/update a comment identified by a unique marker: `<!-- lint-baseline-summary -->`.
- Include: totals, delta vs main baseline, worst per-rule delta, thresholds in effect, artifact links.
- Avoid duplicate comments across runs.

## Implementation outline
- Use `actions/github-script` or `gh api` to:
  - Search for an existing comment by the bot user containing the marker.
  - Create or update with new body.
- Parse `docs/reports/lint-baseline-diff.md` (top ~60 lines) for data.

## Acceptance criteria
- A single PR comment exists with the latest summary and artifact links; subsequent runs update it in place.
- Runs only on PR events; skipped on branch pushes.

## Risks & mitigations
- Duplicate comments → use a stable marker and idempotent update logic.
- Large diffs → keep the comment succinct; point to artifacts.

## Definition of done
- Workflow updated; verified on a test PR.
- Comment update works across multiple pushes to the same PR.
