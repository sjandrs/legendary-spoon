# Issue 16: Accounting Domain Modeling Limits Extensibility

Severity: Medium
Type: Domain Modeling / Tech Debt
Status: Open

## Summary
`JournalEntry` combines debit and credit into a single row instead of traditional double-entry lines. Limits support for multi-line entries, partial allocations, and balancing validation.

## Impact
- Difficult to represent complex transactions (e.g., split expense allocations).
- Cannot easily validate that total debits == total credits across lines.

## Acceptance Criteria
1. Introduce `JournalEntry` (header) + `JournalEntryLine` (lines) structure.
2. Enforce balancing rule at save time.
3. Migration path provided (derive two lines from existing single-row entries).
4. Update reports to aggregate via line items.

## Proposed Approach
- New model `JournalEntryLine(journal_entry, account, is_debit, amount)`.
- Data migration splitting existing rows.

## Risks
Migration complexity; reporting code refactor.

## Next Steps
- [ ] Draft new models & migration.
- [ ] Update reporting service.
- [ ] Add balancing tests.
