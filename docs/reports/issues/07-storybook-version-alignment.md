# Storybook / MSW Version Alignment

**Labels:** dependency, tooling

## Summary
Peer dependency conflict (Storybook 8.x + 9.x mix) prevents installing `@mswjs/interceptors`.

## Options
1. Upgrade all Storybook packages to 9.x (preferred).
2. Or unify on latest 8.6.x.

## Steps
- Audit versions (`npm ls | findstr storybook`).
- Choose path & update `package.json`.
- Reinstall; verify zero peer warnings.
- Proceed with MSW reinstatement (# Reinstate MSW issue).

## Acceptance Criteria
Single major version, clean install, unblock MSW dependency.
