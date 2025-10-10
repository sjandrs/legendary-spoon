# Notifications: Post weekly lint baseline summary to Slack

Date: 2025-10-10
Labels: tooling, linting, DX, notifications

## Summary
Post a concise summary of the weekly lint baseline report to a Slack channel every Monday after the scheduled `lint-gates` job completes.

## Motivation
Make lint deltas and tightening cadence visible to the team without needing to open artifacts.

## Scope
- Trigger on schedule runs (`cron: Monday 12:00 UTC`) in the `lint-gates` job.
- Message includes: current totals (problems/errors/warnings), delta vs main baseline, worst per-rule delta since last snapshot, current thresholds in effect, and next tightening target.
- Provide links to artifacts:
  - `docs/reports/lint-baseline-diff.md`
  - `docs/reports/lint-snapshot.json`

## Implementation outline
- Secrets: add `SLACK_WEBHOOK_URL` (or Slack App token) to repo secrets.
- In `.github/workflows/ci-cd.yml` under `lint-gates`:
  - After baseline step, parse `docs/reports/lint-baseline-diff.md` (top ~60 lines) to extract key metrics.
  - Build Slack payload (blocks or text) with metrics and artifact links.
  - Post via `curl` to `$SLACK_WEBHOOK_URL`.
- Ensure posting runs only on scheduled events; skip on PR runs.

## Acceptance criteria
- A Slack message posts each Monday on success with required fields and links.
- Failures to post do not fail the pipeline; errors are logged succinctly.
- Secrets are masked; no sensitive data in logs.

## Risks & mitigations
- Secret leakage → rely on masked secrets and avoid echoing payloads.
- Missing artifacts → send a minimal message indicating artifacts not found.

## Definition of done
- PR merged with workflow step and secret configured.
- Test run verified in a dry-run or using a non-prod channel.
- Short README note or comment in workflow documents the setup.
