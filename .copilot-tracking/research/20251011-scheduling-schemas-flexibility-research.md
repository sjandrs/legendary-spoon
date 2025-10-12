<!-- markdownlint-disable-file -->
# Task Research Notes: Scheduling Schemas Flexibility Decision

## Research Executed

### File Analysis
- ./.copilot-tracking/research/20251011-scheduled-event.schema.json
  - Draft-07 closed schema authored previously; aligns to ScheduledEvent model fields; recurrence_rule is a string aligned to RFC5545 semantics.
- ./.copilot-tracking/research/20251011-notificationlog.schema.json
  - Draft-07 closed schema with broad string fields; status/channel enums exist but minimal to reduce drift.
- ./.copilot-tracking/research/20251011-appointmentrequest.schema.json
  - Draft-07 closed schema with minimal enums; timestamps and reviewer metadata included.
- ./.copilot-tracking/research/20251011-digitalsignature.schema.json
  - Draft-07 closed schema with readOnly integrity fields and content_object linkage.

### Code Search Results
- ScheduledEvent, NotificationLog, AppointmentRequest, DigitalSignature
  - actual_matches_found: Definitions in main/models.py and serializers in main/serializers.py; enums may evolve, so schemas should avoid over-constraining.

### External Research
- #fetch:https://datatracker.ietf.org/doc/html/rfc5545
  - key_information_gathered: iCalendar RRULE syntax complexity; practical choice is to keep schemas permissive (string) and validate RRULE server-side.

### Project Conventions
- Standards referenced: Draft-07 primary schemas; closed by default; enums conservative to avoid drift.
- Instructions followed: research-only documentation; template sections complete.

## Key Discoveries

### Project Structure
Scheduling entities have evolving business semantics (statuses, channels, priorities). Overly strict json-schema enums create churn and drift against serializers.

### Implementation Patterns
- Keep key fields typed but flexible (string/integer) with minimal enums.
- Enforce deeper business rules in serializers/domain logic.

### Complete Examples
```json
{
  "account": 3,
  "contact": 8,
  "requested_start_time": "2025-10-13T14:00:00Z",
  "requested_end_time": "2025-10-13T15:00:00Z",
  "work_description": "WiFi signal issues",
  "priority": "medium",
  "status": "pending"
}
```

### API and Schema Documentation
- Primary: 20251011-scheduled-event.schema.json, 20251011-notificationlog.schema.json, 20251011-appointmentrequest.schema.json, 20251011-digitalsignature.schema.json

### Configuration Examples
```json
{
  "channel": "email",
  "status": "sent"
}
```

### Technical Requirements
- Maintain schema compatibility with serializer-led enums; prefer schema flexibility.
- Validate complex rules (RRULE correctness, transitions) in server-side domain logic.
 - RRULE validation: parse/validate RFC5545 strings; reject unsupported/unsafe rules; apply business constraints (e.g., max duration, business hours, technician availability windows).
 - State transitions: enforce allowed transitions (e.g., pending→approved→scheduled) and side effects (notifications, conflicts) in services, not schemas.

## Recommended Approach
Keep scheduling schemas flexible to match serializers: minimal enums, typed fields, closed schemas. Perform strict validation server-side where rules are complex or evolving.

## Implementation Guidance
- Objectives: Avoid spec/serializer drift; reduce schema churn; move complex validation to code.
- Key Tasks: Limit enums; document server-side validations; keep schemas closed but permissive within types.
- Dependencies: Serializer/domain logic to enforce business rules.
- Success Criteria: Changes in serializers do not force schema rework; API remains consistent with evolving business semantics.
