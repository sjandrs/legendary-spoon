# ESLint Caught Errors Ignore Pattern

**Labels:** lint, quality

## Summary
Catch parameters renamed to `_err` still trigger `no-unused-vars`. Adjust rule to ignore leading underscore for caught errors.

## Proposed Rule Update
```
'no-unused-vars': ['error', {
  varsIgnorePattern: '^[A-Z_]|^_',
  argsIgnorePattern: '^_',
  caughtErrors: 'all',
  caughtErrorsIgnorePattern: '^_'
}]
```

## Acceptance Criteria
- Lint shows zero `_err` unused warnings.
- Spot-check confirms no legitimate misses suppressed.
