<!-- markdownlint-disable-file -->
# Task Research Notes: Scheduling Schemas (ScheduledEvent first)

## Research Executed

### File Analysis
- main/models.py → ScheduledEvent, InventoryReservation, SchedulingAnalytics
  - Confirmed fields: work_order, technician, start_time, end_time, recurrence_rule, parent_event, status, notes, created/updated.
- main/serializers.py → ScheduledEventSerializer
  - Noted divergence (priority, estimated_duration, recurrence_pattern) vs model; schema follows model as ground truth.

### Code Search Results
- ScheduledEvent classes/serializers found in main; viewsets present for CRUD.

### External Research
- #fetch:https://fullcalendar.io/docs
  - Key_information_gathered: event/resource/time semantics to inform UI; not directly changing API schema.
- #fetch:https://www.rfc-editor.org/rfc/rfc5545
  - Key_information_gathered: RRULE syntax for recurrence; aligns with recurrence_rule string.

### Project Conventions
- Standards referenced: draft-07 closed schema; readOnly for timestamps; alignment with models; additionalProperties: false.

## Key Discoveries
Model is the source of truth for scheduling fields; recurrence uses RRULE text; status enum matches model.

## Recommended Approach
Use the created ScheduledEvent draft-07 schema (primary) and add variants. Extend later with NotificationLog/AppointmentRequest/DigitalSignature as needed, aligning strictly to models.

## Implementation Guidance
- Objectives: Provide a stable ScheduledEvent contract; note serializer mismatch as a follow-up implementation fix.
- Key Tasks: Add additional scheduling entity schemas in subsequent iterations.
- Dependencies: WorkOrder, Technician models.
- Success Criteria: Schemas align with models; examples reflect real objects; RRULE documented.
