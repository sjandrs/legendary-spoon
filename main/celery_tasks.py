"""
Celery tasks for the Field Service Management Module.
These tasks handle periodic operations like sending appointment reminders,
processing recurrence rules, and generating analytics snapshots.
"""

import logging
from datetime import timedelta

from celery import shared_task
from django.core.management import call_command
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def send_daily_appointment_reminders():
    """
    Send appointment reminders for next-day appointments.
    This task should be scheduled to run daily at a specific time (e.g., 9 AM).
    """
    try:
        logger.info("Starting daily appointment reminder task")

        # Call the management command to send reminders
        call_command("send_appointment_reminders", "--days-ahead=1")

        logger.info("Daily appointment reminder task completed successfully")
        return "Appointment reminders sent successfully"

    except Exception as e:
        logger.error(f"Daily appointment reminder task failed: {str(e)}")
        raise


@shared_task
def process_recurring_appointments():
    """
    Process recurrence rules and generate future appointments.
    This task should be scheduled to run daily to ensure recurring appointments
    are created in advance.
    """
    try:
        logger.info("Starting recurring appointments processing task")

        # Call the management command to process recurrence rules
        call_command("process_recurrence_rules", "--days-ahead=30")

        logger.info("Recurring appointments processing task completed successfully")
        return "Recurring appointments processed successfully"

    except Exception as e:
        logger.error(f"Recurring appointments processing task failed: {str(e)}")
        raise


@shared_task
def generate_daily_analytics_snapshot():
    """
    Generate daily analytics snapshot for scheduling metrics.
    This task should be scheduled to run daily at the end of the day.
    """
    try:
        logger.info("Starting daily analytics snapshot generation task")

        # Call the management command to generate analytics snapshot
        call_command("generate_analytics_snapshot")

        logger.info("Daily analytics snapshot generation task completed successfully")
        return "Analytics snapshot generated successfully"

    except Exception as e:
        logger.error(f"Daily analytics snapshot generation task failed: {str(e)}")
        raise


@shared_task
def cleanup_old_notification_logs():
    """
    Clean up old notification logs to prevent database bloat.
    This task should be scheduled to run weekly.
    """
    try:
        from main.models import NotificationLog

        logger.info("Starting notification logs cleanup task")

        # Delete logs older than 90 days
        cutoff_date = timezone.now() - timedelta(days=90)
        deleted_count = NotificationLog.objects.filter(
            sent_at__lt=cutoff_date
        ).delete()[0]

        logger.info(f"Cleaned up {deleted_count} old notification logs")
        return f"Cleaned up {deleted_count} old notification logs"

    except Exception as e:
        logger.error(f"Notification logs cleanup task failed: {str(e)}")
        raise


@shared_task
def send_technician_assignment_notification(scheduled_event_id):
    """
    Send notification to technician when a work order is assigned.
    This is triggered by Django signals when a ScheduledEvent is created.
    """
    try:
        from main.models import ScheduledEvent
        from main.notification_service import get_notification_service

        logger.info(
            f"Sending technician assignment notification for event {scheduled_event_id}"
        )

        # Get the scheduled event
        try:
            event = ScheduledEvent.objects.get(id=scheduled_event_id)
        except ScheduledEvent.DoesNotExist:
            logger.error(f"ScheduledEvent {scheduled_event_id} not found")
            return "Event not found"

        # Send the notification
        notification_service = get_notification_service()
        success = notification_service.send_technician_assignment(event)

        if success:
            logger.info(
                f"Technician assignment notification sent successfully "
                f"for event {scheduled_event_id}"
            )
            return "Technician notification sent successfully"
        else:
            logger.error(
                f"Failed to send technician assignment notification for event {scheduled_event_id}"
            )
            return "Failed to send technician notification"

    except Exception as e:
        logger.error(f"Technician assignment notification task failed: {str(e)}")
        raise


@shared_task
def reserve_inventory_for_appointment(scheduled_event_id):
    """
    Reserve inventory items for a scheduled appointment.
    This is triggered by Django signals when a ScheduledEvent is created.
    """
    try:
        from main.inventory_service import get_inventory_service
        from main.models import ScheduledEvent

        logger.info(f"Reserving inventory for appointment {scheduled_event_id}")

        # Get the scheduled event
        try:
            event = ScheduledEvent.objects.get(id=scheduled_event_id)
        except ScheduledEvent.DoesNotExist:
            logger.error(f"ScheduledEvent {scheduled_event_id} not found")
            return "Event not found"

        # Reserve inventory items
        inventory_service = get_inventory_service()
        reservations = inventory_service.reserve_items_for_event(event)

        logger.info(
            f"Reserved {len(reservations)} inventory items for event {scheduled_event_id}"
        )
        return f"Reserved {len(reservations)} inventory items"

    except Exception as e:
        logger.error(f"Inventory reservation task failed: {str(e)}")
        raise


@shared_task
def process_post_appointment_workflow(work_order_id):
    """
    Process post-appointment workflow when a work order is completed.
    This includes sending final invoices and satisfaction surveys.
    This is triggered by Django signals when a WorkOrder status changes to completed.
    """
    try:
        from main.models import WorkOrder
        from main.notification_service import get_notification_service

        logger.info(
            f"Processing post-appointment workflow for work order {work_order_id}"
        )

        # Get the work order
        try:
            work_order = WorkOrder.objects.get(id=work_order_id)
        except WorkOrder.DoesNotExist:
            logger.error(f"WorkOrder {work_order_id} not found")
            return "Work order not found"

        # Send completion notifications
        get_notification_service()

        # Send final invoice (if invoice exists)
        if hasattr(work_order, "workorderinvoice"):
            success = work_order.workorderinvoice.send_email()
            if success:
                logger.info(f"Final invoice sent for work order {work_order_id}")
            else:
                logger.warning(
                    f"Failed to send final invoice for work order {work_order_id}"
                )

        # TODO: Send customer satisfaction survey
        # This would require implementing a survey system

        logger.info(
            f"Post-appointment workflow completed for work order {work_order_id}"
        )
        return "Post-appointment workflow completed"

    except Exception as e:
        logger.error(f"Post-appointment workflow task failed: {str(e)}")
        raise


# Celery Beat Schedule Configuration
# Add this to your Django settings.py:
"""
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'send-daily-appointment-reminders': {
        'task': 'main.celery_tasks.send_daily_appointment_reminders',
        'schedule': crontab(hour=9, minute=0),  # 9:00 AM daily
    },
    'process-recurring-appointments': {
        'task': 'main.celery_tasks.process_recurring_appointments',
        'schedule': crontab(hour=1, minute=0),  # 1:00 AM daily
    },
    'generate-daily-analytics-snapshot': {
        'task': 'main.celery_tasks.generate_daily_analytics_snapshot',
        'schedule': crontab(hour=23, minute=30),  # 11:30 PM daily
    },
    'cleanup-old-notification-logs': {
        'task': 'main.celery_tasks.cleanup_old_notification_logs',
        'schedule': crontab(hour=2, minute=0, day_of_week=0),  # 2:00 AM every Sunday
    },
}
"""
