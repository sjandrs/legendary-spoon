# Lint Automation Scripts

## Overview
These scripts provide incremental, reviewable automation for reducing lint noise (unused imports/vars) and auditing hook justification annotations.

## Scripts
| Script | Purpose | Write Mode |
|--------|---------|------------|
| prune-unused-imports.js | Detect & optionally remove unused named imports | --write |
| prefix-unused-catch.js | Rename unused catch param `err` -> `_err` | --write |
| audit-hooks.js | Report HOOK-JUSTIFY usage & heuristic hook warnings | read-only |
| run-codemods.js | Orchestrate codemods (imports + catch) | --dry-run to preview |

## NPM Commands
- `npm run lint:codemod:dry` – Show prospective changes (JSON reports) without modifying files.
- `npm run lint:codemod` – Apply codemods (`--write`).
- `npm run lint:audit:hooks` – Output JSON audit of hook justifications.

## Workflow Recommendation
1. Run dry preview: `npm run lint:codemod:dry`.
2. Review diff (git diff) for safety.
3. Apply: `npm run lint:codemod`.
4. Run ESLint: `npm run lint` to confirm reduction.
5. Commit with conventional message: `chore(lint): prune unused imports batch 1`.

## Limitations
- Import parser is regex-based (heuristic). Complex re-export patterns may be skipped.
- Does not currently handle TypeScript type-only imports specially (future improvement).

## Future Enhancements
- AST (babel) parsing for higher accuracy.
- Add unused variable transformation for top-level consts (safe subset).
- Integrate baseline regression guard in CI.
