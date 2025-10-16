"""
Celery tasks for analytics refresh and background processing.
Implements Phase 5: Advanced Analytics scheduled task integration.
"""
import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def refresh_analytics_task(self, force_recalculate=False):
    """
    Celery task for periodic analytics refresh.

    Args:
        force_recalculate: Whether to force recalculation of all analytics

    Returns:
        dict: Results of the analytics refresh operation
    """
    try:
        from main.services.analytics_service import AnalyticsService

        logger.info(f"Starting scheduled analytics refresh (force={force_recalculate})")

        analytics_service = AnalyticsService()
        results = analytics_service.refresh_all_analytics(force_recalculate)

        # Log results
        total_operations = sum(
            [
                results["snapshots_created"],
                results["clv_updated"],
                results["predictions_updated"],
                results["forecasts_created"],
            ]
        )

        logger.info(
            f"Analytics refresh completed: {total_operations} operations, "
            f"{len(results['errors'])} errors"
        )

        # Send alert email if errors occurred
        if results["errors"] and hasattr(settings, "ANALYTICS_ALERT_EMAIL"):
            send_analytics_alert_email(results)

        return results

    except Exception as exc:
        logger.error(f"Analytics refresh task failed: {exc}")

        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            # Retry after 60, 120, 240 seconds
            retry_delay = 60 * (2**self.request.retries)
            logger.info(f"Retrying analytics refresh in {retry_delay} seconds")
            raise self.retry(countdown=retry_delay, exc=exc)
        else:
            # Send failure notification after all retries
            if hasattr(settings, "ANALYTICS_ALERT_EMAIL"):
                send_analytics_failure_email(str(exc))
            raise


@shared_task
def daily_analytics_refresh():
    """Daily analytics refresh task (standard refresh)."""
    return refresh_analytics_task.delay(force_recalculate=False)


@shared_task
def weekly_analytics_refresh():
    """Weekly analytics refresh task (forced recalculation)."""
    return refresh_analytics_task.delay(force_recalculate=True)


@shared_task
def cleanup_old_analytics():
    """Clean up old analytics data to maintain performance."""
    try:
        from datetime import timedelta

        from main.models import AnalyticsSnapshot, RevenueForecast

        # Keep analytics snapshots for 1 year
        cutoff_date = timezone.now().date() - timedelta(days=365)
        old_snapshots = AnalyticsSnapshot.objects.filter(date__lt=cutoff_date)
        deleted_snapshots = old_snapshots.count()
        old_snapshots.delete()

        # Keep forecasts for 90 days
        forecast_cutoff = timezone.now().date() - timedelta(days=90)
        old_forecasts = RevenueForecast.objects.filter(
            forecast_date__lt=forecast_cutoff
        )
        deleted_forecasts = old_forecasts.count()
        old_forecasts.delete()

        logger.info(
            f"Cleaned up {deleted_snapshots} old snapshots and "
            f"{deleted_forecasts} old forecasts"
        )

        return {
            "snapshots_deleted": deleted_snapshots,
            "forecasts_deleted": deleted_forecasts,
        }

    except Exception as e:
        logger.error(f"Analytics cleanup failed: {e}")
        raise


def send_analytics_alert_email(results):
    """Send alert email when analytics refresh encounters errors."""
    try:
        error_count = len(results["errors"])
        error_summary = "\n".join(results["errors"][:5])  # First 5 errors

        subject = f"Analytics Refresh Alert - {error_count} Errors Encountered"
        message = f"""
Analytics refresh completed with {error_count} errors at {timezone.now()}.

Summary:
- Snapshots created: {results['snapshots_created']}
- CLV updated: {results['clv_updated']}
- Predictions updated: {results['predictions_updated']}
- Forecasts created: {results['forecasts_created']}

Recent errors:
{error_summary}

Please check the analytics system for issues.
        """.strip()

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.ANALYTICS_ALERT_EMAIL],
            fail_silently=False,
        )

    except Exception as e:
        logger.error(f"Failed to send analytics alert email: {e}")


def send_analytics_failure_email(error_message):
    """Send email when analytics refresh task fails completely."""
    try:
        subject = "Analytics Refresh Failed - Immediate Attention Required"
        message = f"""
Analytics refresh task has failed completely after all retry attempts at {timezone.now()}.

Error: {error_message}

Please investigate the analytics system immediately.
        """.strip()

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.ANALYTICS_ALERT_EMAIL],
            fail_silently=False,
        )

    except Exception as e:
        logger.error(f"Failed to send analytics failure email: {e}")


# Task scheduling configuration (add to celery beat schedule)
ANALYTICS_SCHEDULE = {
    "daily-analytics-refresh": {
        "task": "main.tasks.daily_analytics_refresh",
        "schedule": 3600.0,  # Run every hour during business hours
        "options": {"expires": 3300},  # Expire after 55 minutes
    },
    "weekly-full-analytics-refresh": {
        "task": "main.tasks.weekly_analytics_refresh",
        "schedule": 604800.0,  # Run weekly (7 days)
        "options": {"expires": 86400},  # Expire after 24 hours
    },
    "analytics-cleanup": {
        "task": "main.tasks.cleanup_old_analytics",
        "schedule": 86400.0,  # Run daily
        "options": {"expires": 7200},  # Expire after 2 hours
    },
}
