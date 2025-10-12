<!-- markdownlint-disable-file -->
# Task Research Notes: Parts (WarehouseItem) Schemas

## Research Executed

### File Analysis
- main/models.py → WarehouseItem fields confirmed.
- main/serializers.py → WarehouseItemSerializer alignment confirmed.

### External Research
- #fetch:https://www.gs1.org/standards/id-keys/gtin
  - key_information_gathered: GTIN semantics and allocation rules; potential future field for item identity.

### Project Conventions
- Standards referenced: draft-07 closed schema aligned to serializer; no extra fields beyond implementation.

## Key Discoveries
GTIN could be added in a future iteration; current schema aligns to model to avoid drift.

## Recommended Approach
Use created WarehouseItem draft-07 schema + variants; consider adding optional gtin field in a later spec version after model alignment.

## Implementation Guidance
- Objectives: Publish accurate item schema; plan GTIN integration research.
- Key Tasks: Keep schema in sync with serializer; document GS1 reference.
- Success Criteria: Schema matches API; examples valid.
