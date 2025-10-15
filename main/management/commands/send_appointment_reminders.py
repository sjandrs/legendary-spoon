"""
Management command to send appointment reminders to customers.
This command should be run daily via cron/scheduled task to send reminders
for appointments scheduled for the next day.
"""

import logging
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from main.models import NotificationLog, ScheduledEvent
from main.notification_service import NotificationService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Send appointment reminders to customers for next-day appointments"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be sent without actually sending notifications",
        )
        parser.add_argument(
            "--days-ahead",
            type=int,
            default=1,
            help="Number of days ahead to send reminders for (default: 1)",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Send reminders even if already sent today",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        days_ahead = options["days_ahead"]
        force = options["force"]

        self.stdout.write(
            ("Processing appointment reminders for " f"{days_ahead} day(s) ahead...")
        )

        # Calculate the target date range
        now = timezone.now()
        target_date = now.date() + timedelta(days=days_ahead)
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())

        # Make datetime objects timezone-aware
        start_of_day = timezone.make_aware(start_of_day)
        end_of_day = timezone.make_aware(end_of_day)

        # Find scheduled events for the target date
        scheduled_events = ScheduledEvent.objects.filter(
            start_time__gte=start_of_day,
            start_time__lte=end_of_day,
            status="scheduled",
        ).select_related("work_order", "technician")

        if not scheduled_events:
            self.stdout.write(
                self.style.SUCCESS(f"No scheduled appointments found for {target_date}")
            )
            return

        notification_service = NotificationService()
        sent_count = 0
        already_sent_count = 0
        error_count = 0

        for event in scheduled_events:
            # Check if reminder was already sent today (unless forced)
            if not force:
                # We don't have typed fields for event/type; heuristically match only
                # customer reminder emails
                existing_reminder = (
                    NotificationLog.objects.filter(
                        content_type__model="scheduledevent",
                        object_id=event.id,
                        status="sent",
                        sent_at__date=now.date(),
                        channel="email",
                    )
                    .filter(
                        # limit to the specific reminder subject used by NotificationService
                        subject__icontains="Service Appointment Reminder"
                    )
                    .exists()
                )

                if existing_reminder:
                    already_sent_count += 1
                    self.stdout.write(
                        (
                            f"Reminder already sent for appointment {event.id} "
                            f"({event.work_order.description})"
                        )
                    )
                    continue

            try:
                if dry_run:
                    self.stdout.write(
                        f"[DRY RUN] Would send reminder for appointment {event.id}:"
                    )
                    contact = (
                        event.work_order.project.contact
                        if event.work_order and event.work_order.project
                        else None
                    )
                    if contact:
                        self.stdout.write(
                            f"  - Customer: {contact.first_name} {contact.last_name}"
                        )
                    self.stdout.write(f"  - Service: {event.work_order.description}")
                    self.stdout.write(
                        f"  - Time: {event.start_time.strftime('%Y-%m-%d %H:%M')}"
                    )
                    self.stdout.write(
                        (
                            f"  - Technician: {event.technician.first_name} "
                            f"{event.technician.last_name}"
                        )
                    )
                    sent_count += 1
                else:
                    # Send the actual reminder
                    contact = (
                        event.work_order.project.contact
                        if event.work_order and event.work_order.project
                        else None
                    )
                    success = notification_service.send_customer_reminder(event)

                    if success:
                        sent_count += 1
                        if contact:
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f"Sent reminder for appointment {event.id} "
                                    f"to {contact.email}"
                                )
                            )
                    else:
                        error_count += 1
                        self.stdout.write(
                            self.style.ERROR(
                                f"Failed to send reminder for appointment {event.id}"
                            )
                        )

            except Exception as e:
                error_count += 1
                logger.error(
                    "Error sending reminder for appointment %s: %s",
                    event.id,
                    str(e),
                )
                self.stdout.write(
                    self.style.ERROR(
                        f"Error sending reminder for appointment {event.id}: {str(e)}"
                    )
                )

        # Summary
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write("APPOINTMENT REMINDER SUMMARY")
        self.stdout.write("=" * 50)
        self.stdout.write(f"Target Date: {target_date}")
        self.stdout.write(f"Total Appointments: {len(scheduled_events)}")
        self.stdout.write(f"Reminders Sent: {sent_count}")
        self.stdout.write(f"Already Sent Today: {already_sent_count}")
        self.stdout.write(f"Errors: {error_count}")

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "\nThis was a DRY RUN - no actual notifications were sent."
                )
            )
        elif sent_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nSuccessfully processed {sent_count} appointment reminders."
                )
            )

        if error_count > 0:
            self.stdout.write(
                self.style.ERROR(
                    f"\n{error_count} errors occurred. Check logs for details."
                )
            )
