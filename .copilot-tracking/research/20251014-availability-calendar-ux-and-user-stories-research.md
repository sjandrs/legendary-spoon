<!-- markdownlint-disable-file -->
# Task Research Notes: Availability Calendar UX and User Stories

## Research Executed

### File Analysis
- frontend/src/components/AvailabilityCalendar.jsx
  - Presents a FullCalendar-based weekly/monthly/day view for technician availability with drag/drop/resize; CRUD via modal using API functions (get/create/update/deleteTechnicianAvailability). Lacks recurrence UI, bulk edit, explicit availability_type labelling/colors, timezone labels, and some a11y affordances mentioned in tests.
- frontend/src/components/SchedulePage.jsx
  - Field Service scheduling with FullCalendar; supports creation via modal, RRULE text input for recurrence, drag/resize -> PATCH, and route optimization via /api/scheduling/optimize-route/. Provides a pattern for recurrence and event formatting by status.
- frontend/src/components/accessibility/FieldServiceAccessibility.js
  - Centralized a11y utilities: dialog focus trap guidance, live region announcements, calendar ARIA labeling, high-contrast CSS, skip links, focus indicators. Confirms project-level a11y standards for calendar UIs and dialogs.
- frontend/src/api.js
  - Confirms availability CRUD API: getTechnicianAvailability, getTechnicianAvailabilityById, createTechnicianAvailability, updateTechnicianAvailability, deleteTechnicianAvailability; also endpoints for scheduled-events and technicians, aligning with SchedulePage.
- frontend/src/__tests__/components/AvailabilityCalendar.test.jsx
  - Expectations identified: labeled technician selector; event titles with availability_type (e.g., “Available (Work)” / “Unavailable (Vacation)”) and distinct colors; create/update flows with payload shape; validation that end > start; recurring setup UI with day-of-week checkboxes, time inputs, effective_from date; recurring_pattern object; bulk edit mode with apply-to-selected; timezone labels/messages (EST/EDT, PST/PDT) and conversion messaging; a11y (tabbable events, role/aria-label; form live region). Also performance expectations (avoid unnecessary re-renders).

### Code Search Results
- "FullCalendar|AvailabilityCalendar|SchedulePage"
  - Availability and scheduling components rely on FullCalendar dayGrid/timeGrid/interaction; SchedulePage includes recurrence text field (RRULE). AvailabilityCalendar currently synthesizes 4 weeks of repeating events per day_of_week/time.
- "technician-availability|scheduled-events|optimize-route"
  - API functions exist and are referenced in components; mocks may need MSW handlers for availability and scheduled-events to support tests.

### External Research
- #githubRepo:"fullcalendar/fullcalendar RRULE timezone accessibility"
  - Found patterns using rrule plugin with dtstart/until; accessibility notes on eventInteractive and aria attributes; examples of businessHours, background events, and constraints for availability overlays.
- #fetch:https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
  - Key guidance: role="dialog", aria-modal="true", focus trap within dialog, initial focus placement rules, Esc closes, return focus to invoker, aria-labelledby/aria-label, optional aria-describedby only for concise content. Do not mark modal unless inertness is enforced.
- #fetch:https://help.servicetitan.com/how-to/dispatch-board
  - Dispatch board UX concepts (industry standard): technician lanes, drag-drop appointments, status colors, skill filters, time-off/blocks visibility, and timezone considerations; reinforces need for clear availability types and blocked time visualization.
- #githubRepo:"jquense/react-big-calendar drag and drop resources"
  - Alternative calendar interaction patterns: resource lanes, onEventDrop/onEventResize; useful for future resource-grouped availability (multi-tech) views.

### Project Conventions
- Standards referenced: React component conventions, a11y utilities in FieldServiceAccessibility.js, REST API patterns in docs/API.md, DRF-style pagination in MSW handlers, frontend testing with RTL/MSW and jest-axe.
- Instructions followed: Use semantic headings/landmarks; accessible modals; aria-live regions for form status; distinct event colors by semantic type; role-based data access considered server-side.

## Key Discoveries

### Project Structure
Field Service UIs split responsibilities: AvailabilityCalendar manages technician time windows; SchedulePage manages customer appointments with possible recurrence (RRULE) and route optimization. AvailabilityCalendar currently lacks test-required features for recurrence UI, bulk edit, and timezone labeling.

### Implementation Patterns
- FullCalendar configuration: timeGridWeek/dayGridMonth with interaction plugin for selectable/editable/resize; businessHours used for baseline hours. Availability events generated from persisted day_of_week + start/end, repeated across four weeks.
- Modals: custom modal with backdrop; needs dialog semantics per APG guidance and live region messaging.
- API contracts: Availability expects fields technician, day_of_week, start_time, end_time, is_available, notes; tests also expect availability_type and recurring_pattern for batch creation.

### Complete Examples
```jsx
// Source: SchedulePage.jsx (internal)
<input id="event-recurrence" type="text" value={eventForm.recurrenceRule}
  onChange={(e) => setEventForm({...eventForm, recurrenceRule: e.target.value})}
  placeholder="e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR" />
```

### API and Schema Documentation
Availability CRUD (frontend/src/api.js):
- GET /api/technician-availability/?technician={id}
- POST /api/technician-availability/
- PATCH /api/technician-availability/{id}/
- DELETE /api/technician-availability/{id}/
Tests expect recurring_pattern support for batch creation; backend schema not yet confirmed, so frontend should compose a recurring_pattern object client-side and submit to POST when present.

### Configuration Examples
```json
// Event color mapping (derived from tests and industry patterns)
{
  "Work": "#10b981",
  "Overtime": "#2563eb",
  "On Call": "#f59e0b",
  "Vacation": "#ef4444",
  "Sick": "#f97316"
}
```

### Technical Requirements
- Accessibility: Modal dialog must follow APG; events focusable with descriptive aria-labels; form has aria-live region for status; keyboard support for calendar actions.
- Recurrence UI: Weekly pattern setup with day-of-week checkboxes, time inputs, and effective_from date; produces recurring_pattern sent to API.
- Bulk Edit: Bulk mode to apply time windows to multiple selected days at once for the current technician.
- Timezone: Show local timezone label (e.g., EST/EDT) and conversion messaging when applicable.
- Event semantics: Event titles include status, e.g., “Available (Work)” or “Unavailable (Vacation)”; colors by availability_type.
- Validation: End time strictly greater than start time; clear error surfaced in live region.
- Performance: Avoid unnecessary re-renders; memoize event generation.

## Recommended Approach
Adopt a focused enhancement of AvailabilityCalendar to match tests and industry UX while leveraging existing patterns from SchedulePage and FieldServiceAccessibility utilities:
- Add availability_type with controlled options [Work, Overtime, On Call, Vacation, Sick] that influences title and color mapping.
- Implement a “Setup Recurring Availability” modal that produces a recurring_pattern object: { effective_from, days_of_week[], start_time, end_time, availability_type, is_available } and submits to POST; on success, refetch and announce via aria-live.
- Add “Bulk Edit Mode” with multi-select day checkboxes in the modal; apply to selected days in a single POST per day or a consolidated recurring_pattern when possible.
- Insert timezone label beside calendar (derived from Intl.DateTimeFormat().resolvedOptions().timeZone and localized abbreviation) and a note when converting times.
- Upgrade modal semantics per APG: role="dialog", aria-modal="true", aria-labelledby; focus trap and Esc close; return focus to invoker.
- Make events tabbable with role="button" and aria-label like: `Availability: Work, Monday 9:00 AM to 5:00 PM`.
- Memoize events with useMemo based on [availability, selectedDate] and avoid re-creation of handlers with useCallback.

## Implementation Guidance
- Objectives: Meet test assertions for availability titles/colors, recurrence UI with recurring_pattern, bulk edit, timezone labels, a11y live regions and focusable events; keep performance within expectations.
- Key Tasks:
  - Extend form schema to include availability_type; map colors; adjust event title format.
  - Introduce RecurringSetupModal with day-of-week checkboxes, time inputs, effective_from; build recurring_pattern; POST and refresh.
  - Add Bulk Edit Mode within the same modal or a dedicated panel; batch apply.
  - Add timezone label and conversion message; ensure tests can query text.
  - Apply APG dialog semantics and focus management from FieldServiceAccessibility.
  - Add aria-live region to modal and error surfaces; ensure events are keyboard reachable.
  - Optimize with useMemo/useCallback; avoid regenerating events unnecessarily.
- Dependencies: FullCalendar already present; api.js availability endpoints exist; MSW may need handlers for batch/recurring POST if tests simulate it; FieldServiceAccessibility utilities for modal behaviors.
- Success Criteria: Frontend tests for AvailabilityCalendar pass; accessibility checks via jest-axe pass; no new lint/type errors; performance-related tests pass.
