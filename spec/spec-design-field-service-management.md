---
title: Field Service Management Specification (Stub)
version: 0.1-draft
date_created: 2025-10-10
last_updated: 2025-10-10
owner: Converge Product Team
tags: [design, field-service, scheduling, signatures]
---

# Field Service Management

Authoritative specification for scheduling, notifications, paperwork, customer appointment requests, digital signatures, inventory reservations, and scheduling analytics.

## 1. Purpose & Scope
Deliver a complete Field Service capability integrated with Projects/WorkOrders: technician scheduling (with recurrence), customer communications (reminders and on-my-way), paperwork with signatures, inventory reservation/consumption, and scheduling analytics.

## 2. Requirements & Constraints
- Must integrate with existing WorkOrder and Project models.
- Scheduling supports recurrence via RRULE strings and parent/child instances.
- Notifications are auditable in a systemwide `NotificationLog` with status lifecycle.
- Paperwork templates allow HTML with conditional logic; optional signatures required.
- Digital signatures store integrity metadata (document_hash, is_valid) for verification.
- Inventory is reserved at scheduling time and consumed upon completion.
- Scheduling analytics recorded daily with KPIs for utilization and completion.

## 3. Domain Models (source of truth: main/models.py)

### ScheduledEvent
- Fields: work_order (FK), technician (FK), start_time, end_time, recurrence_rule (RRULE), parent_event (self FK), status (scheduled|in_progress|completed|cancelled|rescheduled), notes, timestamps.
- Manager: ScheduledEventManager supports legacy kwargs (project, appointment_date, string times) and auto-creates WorkOrder for a Project.
- Behavior: duration_hours, is_overdue; ordering by start_time.

### NotificationLog
- Generic link to any object; recipient, channel (email|sms|push), subject, message, status (pending|sent|failed|delivered|bounced), sent_at/delivered_at, error_message, external_id.
- Purpose: Audit trail for all auto-sent messages.

### PaperworkTemplate
- name (unique), description, content (HTML with Django template syntax), is_active, requires_signature, created_by, timestamps.

### AppointmentRequest
- account, contact, requested_start_time/end_time, work_description, priority, status (pending|approved|denied|scheduled), reviewed_by/at, review_notes, scheduled_event (OneToOne), timestamps.

### DigitalSignature
- Generic link to target (e.g., WorkOrder); signature_data (base64), signer_name/email, document_name, paperwork_template?, ip_address, user_agent, signed_at, is_valid, document_hash.

### InventoryReservation
- scheduled_event, warehouse_item, quantity_reserved, quantity_consumed, status (reserved|allocated|consumed|released), reserved_by, timestamps; unique together (scheduled_event, warehouse_item).

### SchedulingAnalytics
- date (unique), totals (technicians, active_technicians, total_scheduled_events, completed/cancelled/rescheduled), metrics (on_time_completion_rate, average_travel_time_minutes), customer_satisfaction_score; daily snapshot creator.

## 4. API Endpoints (source: main/api_urls.py)

Resource ViewSets
- /api/scheduled-events/
- /api/notification-logs/
- /api/paperwork-templates/
- /api/appointment-requests/
- /api/digital-signatures/
- /api/inventory-reservations/
- /api/scheduling-analytics/

Scheduling helpers
- POST /api/scheduling/route-optimization/
- GET  /api/scheduling/availability-check/

Notifications
- POST /api/notifications/send-reminder/
- POST /api/notifications/send-on-way/

Assignment (Phase 4 linkage)
- POST /api/work-orders/{id}/find-technicians/
- POST /api/work-orders/{id}/assign-technician/
- GET  /api/technicians/available/

## 5. Frontend Components

### SchedulePage.jsx
- Calendar view (FullCalendar or equivalent), drag-and-drop scheduling, recurrence editing.
- Filters: technician, status, date range. Inline creation of ScheduledEvent.
- Actions: reschedule, mark completed, cancel; invokes notifications where applicable.

### PaperworkTemplateManager.jsx
- CRUD for templates; live preview of HTML with variable insertion; toggle requires_signature.

### CustomerPortal.jsx
- Appointment request form with account/contact linkage; available slot preview; submits to /api/appointment-requests/.

### AppointmentRequestQueue.jsx
- Manager view to approve/deny requests; on approve, creates ScheduledEvent and links; records reviewer and notes.

### DigitalSignaturePad.jsx
- Capture signature as base64, store metadata; verify and persist document_hash and is_valid.

### SchedulingDashboard.jsx
- Visualize SchedulingAnalytics: utilization, completion rates, counts per day; trend charts.

### WorkOrderList.jsx (enhancement)
- "On My Way" button triggering /api/notifications/send-on-way/ for the next event.

## 6. Business Rules
- Assignment must honor WorkOrderCertificationRequirement; block or warn when unmet.
- Technicians must be available and within a valid coverage area; route optimization endpoint can suggest efficient sequencing.
- Paperwork marked requires_signature cannot be completed until a valid DigitalSignature exists.
- Inventory reservations created at scheduling; consumption on completion; release on cancellation.

## 6A. Schema Posture & Validation
- Schema enums: Keep client-facing JSON Schemas minimally constrained (avoid brittle enumerations for statuses beyond core values) to allow operational flexibility and provider changes.
- RRULE validation: Accept RRULE strings in API; perform server-side expansion/validation, including timezone considerations and exception dates.
- State transitions: Validate transitions (scheduled→in_progress→completed|cancelled|rescheduled) on the server; reject invalid transitions with clear errors.
- Auditability: All validations and transition outcomes must be activity-logged for traceability.

## 7. Acceptance Criteria and Test Links
- AC-FS-001: Create single and recurring ScheduledEvent; duration and overdue behave correctly.
	- Tests: main/test_phase2.py (recurrence, notifications); main/tests.py (ScheduledEvent behaviors)
- AC-FS-002: Approving AppointmentRequest creates a ScheduledEvent and links it.
	- Tests: main/tests.py (appointment request flows, if present)
- AC-FS-003: Sending reminders and on-my-way logs NotificationLog entries with correct channels/status.
	- Tests: main/test_phase2.py::test_send_technician_assignment_notification; main/tests.py (notification log behaviors)
- AC-FS-004: DigitalSignature persists integrity fields and links to paperwork/work orders.
	- Tests: main/tests.py (DigitalSignature model and API)
- AC-FS-005: InventoryReservation enforces unique pairs, supports release and consume flows.
	- Tests: main/tests.py (inventory reservation flows)
- AC-FS-006: SchedulingAnalytics daily snapshots compute KPI fields.
	- Tests: main/tests.py (SchedulingAnalytics.create_daily_snapshot)
- AC-FS-007: Route optimization and availability check endpoints respond and validate inputs.
	- Tests: main/tests/test_search_and_routes.py (optimize- routes)

## 8. Security & Permissions
- RBAC: Managers see all; reps limited; sensitive actions (approve, assign, send notifications) restricted by role.
- Audit: All create/update actions activity-logged; NotificationLog is immutable history.

## 9. Error Handling
- Consistent DRF errors for validation and permission issues; provide user-friendly messages in UI for failed notifications and scheduling conflicts.

## 10. Observability
- Store artifacts for route optimization runs and notification attempts in logs; surface aggregated metrics via SchedulingAnalytics.
