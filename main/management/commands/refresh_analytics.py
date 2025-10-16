"""
Analytics refresh management command for Phase 5 Advanced Analytics.
Provides comprehensive analytics data refresh with progress tracking.
"""
import time

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from main.services.analytics_service import AnalyticsService


class Command(BaseCommand):
    help = "Refresh all analytics data including CLV, predictions, forecasts, and snapshots"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force recalculation even if recent data exists",
        )
        parser.add_argument(
            "--verbose",
            action="store_true",
            help="Enable verbose output with detailed progress",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be updated without making changes",
        )

    def handle(self, *args, **options):
        force_recalculate = options["force"]
        verbose = options["verbose"]
        dry_run = options["dry_run"]

        start_time = time.time()

        if dry_run:
            self.stdout.write(
                self.style.WARNING("DRY RUN MODE - No data will be modified")
            )

        self.stdout.write(f"Starting analytics refresh at {timezone.now()}")

        if force_recalculate:
            self.stdout.write("Force recalculation enabled")

        try:
            if not dry_run:
                # Initialize analytics service
                analytics_service = AnalyticsService()

                # Perform full refresh
                results = analytics_service.refresh_all_analytics(
                    force_recalculate=force_recalculate
                )

                # Report results
                self._report_results(results, verbose)

            else:
                self._perform_dry_run(force_recalculate, verbose)

            # Calculate execution time
            execution_time = time.time() - start_time

            self.stdout.write(
                self.style.SUCCESS(
                    f"Analytics refresh completed in {execution_time:.2f} seconds"
                )
            )

        except Exception as e:
            raise CommandError(f"Analytics refresh failed: {e}")

    def _report_results(self, results, verbose=False):
        """Report refresh results to user."""
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write("ANALYTICS REFRESH RESULTS")
        self.stdout.write("=" * 50)

        # Success metrics
        self.stdout.write(
            self.style.SUCCESS(
                f"✓ Analytics snapshots created: {results['snapshots_created']}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(f"✓ CLV calculations updated: {results['clv_updated']}")
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"✓ Deal predictions updated: {results['predictions_updated']}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"✓ Revenue forecasts created: {results['forecasts_created']}"
            )
        )

        # Error reporting
        if results["errors"]:
            self.stdout.write(
                self.style.WARNING(f"⚠ Errors encountered: {len(results['errors'])}")
            )

            if verbose:
                self.stdout.write("\nError details:")
                for i, error in enumerate(results["errors"], 1):
                    self.stdout.write(f"  {i}. {error}")
        else:
            self.stdout.write(self.style.SUCCESS("✓ No errors encountered"))

        # Summary
        total_updates = sum(
            [
                results["snapshots_created"],
                results["clv_updated"],
                results["predictions_updated"],
                results["forecasts_created"],
            ]
        )

        self.stdout.write(f"\nTotal operations completed: {total_updates}")

    def _perform_dry_run(self, force_recalculate, verbose):
        """Simulate analytics refresh without making changes."""
        from main.models import (
            Contact,
            CustomerLifetimeValue,
            Deal,
            DealPrediction,
            RevenueForecast,
        )

        self.stdout.write("\nDRY RUN ANALYSIS:")
        self.stdout.write("-" * 30)

        # Analyze snapshots
        snapshots_to_create = 1  # Today's snapshot
        self.stdout.write(f"Analytics snapshots to create: {snapshots_to_create}")

        # Analyze CLV updates needed
        contacts_with_deals = (
            Contact.objects.filter(deals__isnull=False).distinct().count()
        )

        if force_recalculate:
            clv_to_update = contacts_with_deals
        else:
            # Count stale CLV records
            from datetime import timedelta

            cutoff_date = timezone.now() - timedelta(days=7)
            clv_to_update = CustomerLifetimeValue.objects.filter(
                updated_at__lt=cutoff_date
            ).count()

        self.stdout.write(f"CLV calculations to update: {clv_to_update}")

        # Analyze predictions
        active_deals = Deal.objects.filter(
            status__in=["in_progress", "negotiation", "qualified"]
        ).count()

        if force_recalculate:
            predictions_to_update = active_deals
        else:
            # Count stale predictions
            cutoff_date = timezone.now() - timedelta(days=3)
            predictions_to_update = DealPrediction.objects.filter(
                updated_at__lt=cutoff_date,
                deal__status__in=["in_progress", "negotiation", "qualified"],
            ).count()

        self.stdout.write(f"Deal predictions to update: {predictions_to_update}")

        # Analyze forecasts
        forecast_combinations = 6  # 3 periods × 2 methods
        if not force_recalculate:
            # Check for recent forecasts
            recent_forecasts = (
                RevenueForecast.objects.filter(
                    forecast_date__gte=timezone.now().date() - timedelta(days=1)
                )
                .values("forecast_period", "forecast_method")
                .distinct()
                .count()
            )
            forecasts_to_create = max(0, forecast_combinations - recent_forecasts)
        else:
            forecasts_to_create = forecast_combinations

        self.stdout.write(f"Revenue forecasts to create: {forecasts_to_create}")

        total_operations = (
            snapshots_to_create
            + clv_to_update
            + predictions_to_update
            + forecasts_to_create
        )

        self.stdout.write(f"\nTotal operations planned: {total_operations}")
