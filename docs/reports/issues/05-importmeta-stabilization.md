# import.meta Stabilization & Documentation

**Labels:** build, tooling, documentation

## Summary
Custom Babel plugin (`transform-import-meta.cjs`) neutralizes `import.meta` in Jest. Document rationale and guard against regressions.

## Tasks
- Add section to `FRONTEND_TESTING.md` detailing plugin purpose & danger of silent failures.
- Add fixture module referencing `import.meta.hot` + test ensuring no crash.
- Optional lint/codemod check flagging production usage outside Vite entry.

## Acceptance Criteria
- Docs updated.
- Fixture test passes; removing plugin causes expected failure locally.
