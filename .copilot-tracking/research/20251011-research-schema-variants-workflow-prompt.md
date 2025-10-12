<!-- markdownlint-disable-file -->
# Task Research Notes: Research → Schema → Variants → Evidence Workflow

## Research Executed

### File Analysis
- ./.copilot-tracking/research/*schema.json
  - Primary draft-07 closed schemas align with DRF serializers and project conventions; variants mirror properties minimally with $schema updated.

### Code Search Results
- serializer alignment
  - actual_matches_found: serializers present for each entity in main/serializers.py; models in main/models.py.

### External Research
- #githubRepo:"json-schema-org/json-schema-spec 2019-09 2020-12"
  - actual_patterns_examples_found: Correct $schema URIs; annotations vs assertions guidance.
- #fetch:https://json-schema.org/draft/2019-09/json-schema-core.html
  - key_information_gathered: Vocabulary, annotations behavior; unknown keywords tolerated as annotations.
- #fetch:https://json-schema.org/draft/2020-12/json-schema-core.html
  - key_information_gathered: Dialect/$dynamicRef; unevaluatedProperties guidance for closed shapes.

### Project Conventions
- Standards referenced: Converge Development Guide, draft-07 as enforcement; readOnly/writeOnly; additionalProperties: false.
- Instructions followed: Research-only edits; date-prefixed naming.

## Key Discoveries

### Project Structure
Draft-07 remains the enforcement schema for compatibility; newer drafts are informational to avoid local validator limitations.

### Implementation Patterns
- Process steps:
  1) Analyze models/serializers for ground truth.
  2) Author draft-07 closed schema (additionalProperties: false; readOnly/writeOnly annotations).
  3) Create 2019-09 and 2020-12 variants as annotations-only wrappers with minimal properties and examples; include $comment caveats.
  4) Record evidence via #githubRepo and #fetch callouts.
  5) Provide example payloads and edge cases.

### Complete Examples
```json
{
  "$schema": "https://json-schema.org/draft/2019-09/schema#",
  "$id": "https://converge.local/schemas/payment.schema.json",
  "title": "Payment",
  "$comment": "Annotations-only informational variant",
  "type": "object",
  "properties": {"id": {"type": "integer"}, "amount": {"type":"number"}}
}
```

### API and Schema Documentation
Keep $id stable across drafts; variants should not enforce required. Closed enforcement belongs to draft-07 primary.

### Configuration Examples
```json
{"$schema": "http://json-schema.org/draft-07/schema#", "additionalProperties": false}
```

### Technical Requirements
- Date-prefixed filenames; research folder only; no code/config edits.

## Recommended Approach
Standardize on the above workflow for all new entity contracts (scheduling, custom fields, parts, staff/technicians) to accelerate schema production while maintaining compatibility.

## Implementation Guidance
- Objectives: Repeatable, evidence-based schema authoring with multi-draft variants.
- Key Tasks: Models/serializers analysis; draft-07 closed schema; variants; examples; evidence log.
- Dependencies: DRF serializers; JSON Schema specifications.
- Success Criteria: Primary schema validates; variants added; evidence documented; examples present.
