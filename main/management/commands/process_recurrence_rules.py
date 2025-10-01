"""
Management command to process recurrence rules and generate future ScheduledEvents.
This command should be run periodically (e.g., daily) to ensure recurring appointments
are properly generated in advance.
"""

import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from main.models import ScheduledEvent

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Process recurrence rules and generate future ScheduledEvents"

    def add_arguments(self, parser):
        parser.add_argument(
            "--days-ahead",
            type=int,
            default=30,
            help="Number of days ahead to generate recurring events (default: 30)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what events would be created without actually creating them",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force regeneration even if events already exist",
        )

    def handle(self, *args, **options):
        days_ahead = options["days_ahead"]
        dry_run = options["dry_run"]
        force = options["force"]

        self.stdout.write(f"Processing recurrence rules for {days_ahead} days ahead...")

        # Get all parent events with recurrence patterns
        parent_events = ScheduledEvent.objects.filter(
            recurrence_pattern__isnull=False,
            parent_event__isnull=True,  # Only parent events, not generated ones
        ).exclude(recurrence_pattern="")

        if not parent_events:
            self.stdout.write(
                self.style.SUCCESS("No recurring events found to process.")
            )
            return

        now = timezone.now()
        end_date = now + timedelta(days=days_ahead)

        total_created = 0
        total_skipped = 0
        total_errors = 0

        for parent_event in parent_events:
            try:
                # Check if we should stop generating (if recurrence_end_date is set)
                if (
                    parent_event.recurrence_end_date
                    and parent_event.recurrence_end_date < now.date()
                ):
                    continue

                created, skipped, errors = self.process_single_recurrence(
                    parent_event, end_date, dry_run, force
                )
                total_created += created
                total_skipped += skipped
                total_errors += errors

            except Exception as e:
                total_errors += 1
                logger.error(
                    f"Error processing recurrence for event {parent_event.id}: {str(e)}"
                )
                self.stdout.write(
                    self.style.ERROR(
                        f"Error processing event {parent_event.id}: {str(e)}"
                    )
                )

        # Summary
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write("RECURRENCE PROCESSING SUMMARY")
        self.stdout.write("=" * 50)
        self.stdout.write(f"Parent Events Processed: {len(parent_events)}")
        self.stdout.write(f"Events Created: {total_created}")
        self.stdout.write(f"Events Skipped: {total_skipped}")
        self.stdout.write(f"Errors: {total_errors}")

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "\nThis was a DRY RUN - no actual events were created."
                )
            )
        elif total_created > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nSuccessfully created {total_created} recurring events."
                )
            )

    def process_single_recurrence(self, parent_event, end_date, dry_run, force):
        """Process recurrence for a single parent event"""
        created = 0
        skipped = 0
        errors = 0

        # Parse recurrence pattern (simple implementation)
        pattern = parent_event.recurrence_pattern.lower()

        if pattern == "daily":
            interval = timedelta(days=1)
        elif pattern == "weekly":
            interval = timedelta(weeks=1)
        elif pattern == "monthly":
            interval = timedelta(days=30)  # Simplified monthly
        elif pattern == "yearly":
            interval = timedelta(days=365)  # Simplified yearly
        else:
            # Try to parse custom patterns like "weekly:2" (every 2 weeks)
            if ":" in pattern:
                freq, multiplier = pattern.split(":")
                multiplier = int(multiplier)

                if freq == "daily":
                    interval = timedelta(days=multiplier)
                elif freq == "weekly":
                    interval = timedelta(weeks=multiplier)
                elif freq == "monthly":
                    interval = timedelta(days=30 * multiplier)
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Unknown recurrence pattern: {pattern} for event {parent_event.id}"
                        )
                    )
                    return 0, 0, 1
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"Unknown recurrence pattern: {pattern} for event {parent_event.id}"
                    )
                )
                return 0, 0, 1

        # Generate future events
        current_date = parent_event.start_time

        # Start from the next occurrence after the parent event
        current_date += interval

        while current_date <= end_date:
            # Check if this event should be created
            if (
                parent_event.recurrence_end_date
                and current_date.date() > parent_event.recurrence_end_date
            ):
                break

            # Check if event already exists (unless forced)
            if not force:
                existing_event = ScheduledEvent.objects.filter(
                    parent_event=parent_event,
                    start_time__date=current_date.date(),
                    start_time__time=current_date.time(),
                ).exists()

                if existing_event:
                    skipped += 1
                    current_date += interval
                    continue

            try:
                if dry_run:
                    self.stdout.write(
                        f"[DRY RUN] Would create event for "
                        f"{current_date.strftime('%Y-%m-%d %H:%M')} "
                        f"(Parent: {parent_event.id})"
                    )
                    created += 1
                else:
                    # Calculate end time
                    duration = parent_event.end_time - parent_event.start_time
                    end_time = current_date + duration

                    # Create the recurring event
                    ScheduledEvent.objects.create(
                        work_order=parent_event.work_order,
                        technician=parent_event.technician,
                        start_time=current_date,
                        end_time=end_time,
                        status="scheduled",
                        priority=parent_event.priority,
                        estimated_duration=parent_event.estimated_duration,
                        notes=f"Recurring appointment (Pattern: {parent_event.recurrence_pattern})",
                        parent_event=parent_event,
                    )

                    created += 1
                    self.stdout.write(
                        f"Created recurring event for {current_date.strftime('%Y-%m-%d %H:%M')} "
                        f"(Parent: {parent_event.id})"
                    )

            except Exception as e:
                errors += 1
                logger.error(f"Error creating recurring event: {str(e)}")
                self.stdout.write(
                    self.style.ERROR(
                        f"Error creating event for {current_date}: {str(e)}"
                    )
                )

            current_date += interval

        return created, skipped, errors
