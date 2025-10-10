"""
Management command to generate periodic analytics snapshots.
This command should be run daily via cron/scheduled task to capture
scheduling and service metrics for historical analysis.
"""

import logging
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from main.models import (
    NotificationLog,
    ScheduledEvent,
    SchedulingAnalytics,
    Technician,
    WorkOrder,
)

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Generate analytics snapshot for scheduling and service metrics"

    def add_arguments(self, parser):
        parser.add_argument(
            "--date",
            type=str,
            help="Specific date to generate snapshot for (YYYY-MM-DD format)",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Regenerate snapshot even if one already exists for the date",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what metrics would be captured without saving",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        force = options["force"]
        date_str = options.get("date")

        # Determine target date
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                self.stdout.write(
                    self.style.ERROR("Invalid date format. Use YYYY-MM-DD format.")
                )
                return
        else:
            # Default to yesterday for end-of-day snapshots
            target_date = (timezone.now() - timedelta(days=1)).date()

        self.stdout.write(f"Generating analytics snapshot for {target_date}...")

        # Check if snapshot already exists
        if not force:
            existing_snapshot = SchedulingAnalytics.objects.filter(
                date=target_date
            ).first()

            if existing_snapshot:
                self.stdout.write(
                    self.style.WARNING(
                        f"Analytics snapshot already exists for {target_date}. "
                        "Use --force to regenerate."
                    )
                )
                return

        # Calculate date range for the target date
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())
        start_of_day = timezone.make_aware(start_of_day)
        end_of_day = timezone.make_aware(end_of_day)

        # Calculate metrics (returns display metrics plus model defaults)
        metrics = self.calculate_metrics(start_of_day, end_of_day)

        if dry_run:
            self.display_metrics(target_date, metrics)
            self.stdout.write(
                self.style.WARNING("\nThis was a DRY RUN - no data was saved.")
            )
            return

        # Save or update the analytics snapshot using only model field defaults
        defaults = metrics.get("defaults", {})
        snapshot, created = SchedulingAnalytics.objects.update_or_create(
            date=target_date, defaults=defaults
        )

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{action} analytics snapshot for {target_date}")
        )

        self.display_metrics(target_date, metrics)

    def calculate_metrics(self, start_of_day, end_of_day):
        """Calculate all metrics for the given date range.

        Returns a dict suitable for display that also contains a
        'defaults' sub-dict with keys matching SchedulingAnalytics fields
        for persistence.
        """

        # Scheduled events metrics
        scheduled_events = ScheduledEvent.objects.filter(
            start_time__gte=start_of_day, start_time__lte=end_of_day
        )

        total_appointments = scheduled_events.count()
        completed_appointments = scheduled_events.filter(status="completed").count()
        cancelled_appointments = scheduled_events.filter(status="cancelled").count()

        # Calculate completion rate
        completion_rate = (
            (completed_appointments / total_appointments * 100)
            if total_appointments > 0
            else 0
        )

        # Work orders metrics
        work_orders = WorkOrder.objects.filter(
            created_at__gte=start_of_day, created_at__lte=end_of_day
        )

        total_work_orders = work_orders.count()

        # Technician utilization
        active_technicians = (
            Technician.objects.filter(
                scheduled_events__start_time__gte=start_of_day,
                scheduled_events__start_time__lte=end_of_day,
            )
            .distinct()
            .count()
        )

        total_technicians = Technician.objects.filter(is_active=True).count()

        technician_utilization = (
            (active_technicians / total_technicians * 100)
            if total_technicians > 0
            else 0
        )

        # Average appointment duration
        completed_events = scheduled_events.filter(
            status="completed", end_time__isnull=False
        )

        if completed_events.exists():
            total_duration = sum(
                [
                    (event.end_time - event.start_time).total_seconds() / 3600
                    for event in completed_events
                ]
            )
            avg_appointment_duration = total_duration / completed_events.count()
        else:
            avg_appointment_duration = 0

        # Notification metrics
        notifications_sent = NotificationLog.objects.filter(
            sent_at__gte=start_of_day, sent_at__lte=end_of_day, status="sent"
        ).count()

        # Emergency/urgent appointments
        # Priority field may not exist on ScheduledEvent in current schema; default to 0
        urgent_appointments = 0

        # Build display metrics (legacy names used in tests/docs)
        display_metrics = {
            "total_appointments": total_appointments,
            "completed_appointments": completed_appointments,
            "cancelled_appointments": cancelled_appointments,
            "completion_rate": round(completion_rate, 2),
            "urgent_appointments": urgent_appointments,
            "total_work_orders": total_work_orders,
            "avg_appointment_duration": round(avg_appointment_duration, 2),
            "active_technicians": active_technicians,
            "technician_utilization": round(technician_utilization, 2),
            "notifications_sent": notifications_sent,
        }

        # Map to existing SchedulingAnalytics fields (for storage)
        defaults = {
            "total_scheduled_events": total_appointments,
            "completed_events": completed_appointments,
            "cancelled_events": cancelled_appointments,
            "rescheduled_events": 0,
            "total_technicians": total_technicians,
            "active_technicians": active_technicians,
            "average_utilization_rate": round(technician_utilization, 2),
            "on_time_completion_rate": round(completion_rate, 2),
            "average_travel_time_minutes": 0,
            "customer_satisfaction_score": 0,
        }

        display_metrics["defaults"] = defaults
        return display_metrics

    def display_metrics(self, date, metrics):
        """Display the calculated metrics in a formatted way."""

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(f"ANALYTICS SNAPSHOT - {date}")
        self.stdout.write("=" * 60)

        self.stdout.write(f"📅 Date: {date}")
        self.stdout.write("")

        self.stdout.write("📊 APPOINTMENT METRICS:")
        self.stdout.write(f"  • Total Appointments: {metrics['total_appointments']}")
        self.stdout.write(f"  • Completed: {metrics['completed_appointments']}")
        self.stdout.write(f"  • Cancelled: {metrics['cancelled_appointments']}")
        self.stdout.write(f"  • Completion Rate: {metrics['completion_rate']}%")
        self.stdout.write(f"  • Urgent Appointments: {metrics['urgent_appointments']}")
        self.stdout.write("")

        self.stdout.write("🔧 WORK ORDER METRICS:")
        self.stdout.write(f"  • New Work Orders: {metrics['total_work_orders']}")
        self.stdout.write(
            f"  • Avg Duration: {metrics['avg_appointment_duration']} hours"
        )
        self.stdout.write("")

        self.stdout.write("👨‍🔧 TECHNICIAN METRICS:")
        self.stdout.write(f"  • Active Technicians: {metrics['active_technicians']}")
        self.stdout.write(f"  • Utilization Rate: {metrics['technician_utilization']}%")
        self.stdout.write("")

        self.stdout.write("📱 COMMUNICATION METRICS:")
        self.stdout.write(f"  • Notifications Sent: {metrics['notifications_sent']}")
        self.stdout.write("")

        # Performance insights
        self.stdout.write("💡 INSIGHTS:")
        if metrics["completion_rate"] >= 95:
            self.stdout.write("  ✅ Excellent completion rate!")
        elif metrics["completion_rate"] >= 85:
            self.stdout.write("  🟡 Good completion rate")
        else:
            self.stdout.write("  🔴 Low completion rate - review scheduling processes")

        if metrics["technician_utilization"] >= 80:
            self.stdout.write("  ✅ High technician utilization")
        elif metrics["technician_utilization"] >= 60:
            self.stdout.write("  🟡 Moderate technician utilization")
        else:
            self.stdout.write("  🔴 Low technician utilization - consider optimization")

        self.stdout.write("=" * 60)
