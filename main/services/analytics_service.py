"""
Analytics calculation service for Phase 5 Advanced Analytics.
Provides centralized analytics refresh and calculation functionality.
"""
import logging
from datetime import timedelta
from typing import Dict

from django.db import transaction
from django.utils import timezone

from main.models import (
    AnalyticsSnapshot,
    Contact,
    CustomerLifetimeValue,
    Deal,
    DealPrediction,
    RevenueForecast,
)

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Centralized analytics calculation and refresh service."""

    def __init__(self):
        self.results = {
            "snapshots_created": 0,
            "clv_updated": 0,
            "predictions_updated": 0,
            "forecasts_created": 0,
            "errors": [],
        }

    def refresh_all_analytics(self, force_recalculate: bool = False) -> Dict:
        """
        Refresh all analytics data with atomic operations.

        Args:
            force_recalculate: If True, recalculate even if recent data exists

        Returns:
            Dictionary with results and statistics
        """
        logger.info("Starting full analytics refresh")

        try:
            with transaction.atomic():
                # Refresh analytics snapshots
                self._refresh_analytics_snapshots()

                # Refresh customer lifetime values
                self._refresh_clv_data(force_recalculate)

                # Refresh deal predictions
                self._refresh_deal_predictions(force_recalculate)

                # Refresh revenue forecasts
                self._refresh_revenue_forecasts(force_recalculate)

            logger.info(f"Analytics refresh completed: {self.results}")

        except Exception as e:
            logger.error(f"Analytics refresh failed: {e}")
            self.results["errors"].append(str(e))
            raise

        return self.results

    def _refresh_analytics_snapshots(self) -> None:
        """Create or update daily analytics snapshots."""
        try:
            # Create snapshot for today
            snapshot = AnalyticsSnapshot.create_daily_snapshot()
            self.results["snapshots_created"] += 1
            logger.info(f"Created analytics snapshot for {snapshot.date}")

            # Optionally create snapshots for recent days if missing
            for days_ago in range(1, 8):  # Last 7 days
                date = timezone.now().date() - timedelta(days=days_ago)
                if not AnalyticsSnapshot.objects.filter(date=date).exists():
                    # Create historical snapshot (would need custom logic)
                    logger.info(
                        f"Missing snapshot for {date}, skipping historical creation"
                    )

        except Exception as e:
            error_msg = f"Failed to refresh analytics snapshots: {e}"
            logger.error(error_msg)
            self.results["errors"].append(error_msg)

    def _refresh_clv_data(self, force_recalculate: bool = False) -> None:
        """Refresh customer lifetime value calculations."""
        try:
            # Get contacts that have deals
            contacts_with_deals = Contact.objects.filter(deals__isnull=False).distinct()

            for contact in contacts_with_deals:
                try:
                    # Check if CLV needs refresh
                    existing_clv = CustomerLifetimeValue.objects.filter(
                        contact=contact
                    ).first()

                    should_update = (
                        force_recalculate
                        or not existing_clv
                        or self._is_clv_stale(existing_clv)
                    )

                    if should_update:
                        clv = CustomerLifetimeValue.calculate_for_contact(contact)
                        self.results["clv_updated"] += 1
                        logger.debug(
                            f"Updated CLV for {contact.first_name} "
                            f"{contact.last_name}: ${clv.predicted_clv}"
                        )

                except Exception as e:
                    error_msg = f"Failed to calculate CLV for contact {contact.id}: {e}"
                    logger.warning(error_msg)
                    self.results["errors"].append(error_msg)

        except Exception as e:
            error_msg = f"Failed to refresh CLV data: {e}"
            logger.error(error_msg)
            self.results["errors"].append(error_msg)

    def _refresh_deal_predictions(self, force_recalculate: bool = False) -> None:
        """Refresh deal outcome predictions."""
        try:
            # Get active deals that need predictions
            active_deals = Deal.objects.filter(
                status__in=["in_progress", "negotiation", "qualified"]
            )

            for deal in active_deals:
                try:
                    # Check if prediction needs refresh
                    existing_prediction = DealPrediction.objects.filter(
                        deal=deal
                    ).first()

                    should_update = (
                        force_recalculate
                        or not existing_prediction
                        or self._is_prediction_stale(existing_prediction)
                    )

                    if should_update:
                        prediction = self._calculate_deal_prediction(deal)
                        DealPrediction.objects.update_or_create(
                            deal=deal, defaults=prediction
                        )
                        self.results["predictions_updated"] += 1
                        logger.debug(f"Updated prediction for deal {deal.id}")

                except Exception as e:
                    error_msg = f"Failed to update prediction for deal {deal.id}: {e}"
                    logger.warning(error_msg)
                    self.results["errors"].append(error_msg)

        except Exception as e:
            error_msg = f"Failed to refresh deal predictions: {e}"
            logger.error(error_msg)
            self.results["errors"].append(error_msg)

    def _refresh_revenue_forecasts(self, force_recalculate: bool = False) -> None:
        """Refresh revenue forecast calculations."""
        try:
            forecast_periods = ["monthly", "quarterly", "annual"]
            forecast_methods = ["linear_regression", "moving_average"]

            for period in forecast_periods:
                for method in forecast_methods:
                    try:
                        # Check if forecast needs refresh
                        recent_forecast = RevenueForecast.objects.filter(
                            forecast_period=period,
                            forecast_method=method,
                            forecast_date__gte=timezone.now().date()
                            - timedelta(days=1),
                        ).first()

                        should_update = force_recalculate or not recent_forecast

                        if should_update:
                            forecast_data = self._calculate_revenue_forecast(
                                period, method
                            )
                            RevenueForecast.objects.create(**forecast_data)
                            self.results["forecasts_created"] += 1
                            logger.debug(f"Created {period} {method} forecast")

                    except Exception as e:
                        error_msg = f"Failed to create {period} {method} forecast: {e}"
                        logger.warning(error_msg)
                        self.results["errors"].append(error_msg)

        except Exception as e:
            error_msg = f"Failed to refresh revenue forecasts: {e}"
            logger.error(error_msg)
            self.results["errors"].append(error_msg)

    def _is_clv_stale(self, clv: CustomerLifetimeValue) -> bool:
        """Check if CLV data is stale and needs refresh."""
        # Refresh CLV if older than 7 days
        cutoff_date = timezone.now() - timedelta(days=7)
        return clv.updated_at < cutoff_date

    def _is_prediction_stale(self, prediction: DealPrediction) -> bool:
        """Check if deal prediction is stale and needs refresh."""
        # Refresh predictions if older than 3 days
        cutoff_date = timezone.now() - timedelta(days=3)
        return prediction.updated_at < cutoff_date

    def _calculate_deal_prediction(self, deal: Deal) -> Dict:
        """Calculate deal prediction based on deal characteristics."""
        # Simplified prediction logic (would use ML models in production)

        # Base prediction on deal value and stage duration
        if deal.value > 100000:
            predicted_outcome = "won"
            confidence = 0.80
        elif deal.value > 50000:
            predicted_outcome = "won" if deal.value > 75000 else "pending"
            confidence = 0.70
        elif deal.value > 10000:
            predicted_outcome = "pending"
            confidence = 0.60
        else:
            predicted_outcome = "lost"
            confidence = 0.65

        # Calculate predicted close date
        from django.utils import timezone

        predicted_close_date = timezone.now().date() + timedelta(days=30)

        factors = {
            "deal_value": float(deal.value),
            "deal_age_days": (timezone.now().date() - deal.created_at.date()).days,
            "has_contact": bool(deal.primary_contact),
            "calculation_method": "heuristic_v1",
        }

        return {
            "predicted_outcome": predicted_outcome,
            "confidence_score": confidence,
            "predicted_close_date": predicted_close_date,
            "factors": factors,
            "model_version": "heuristic_v1.0",
        }

    def _calculate_revenue_forecast(self, period: str, method: str) -> Dict:
        """Calculate revenue forecast for given period and method."""
        from django.db.models import Sum

        # Get historical revenue data
        recent_revenue = (
            Deal.objects.filter(
                status="won", close_date__gte=timezone.now().date() - timedelta(days=90)
            ).aggregate(total=Sum("value"))["total"]
            or 0
        )

        # Simple forecast calculation (would use time series analysis in production)
        if period == "monthly":
            base_forecast = recent_revenue / 3  # Last 3 months average
        elif period == "quarterly":
            base_forecast = recent_revenue
        else:  # annual
            base_forecast = recent_revenue * 4

        # Add method-specific adjustments
        if method == "moving_average":
            predicted_revenue = base_forecast
        else:  # linear_regression
            # Simple trend adjustment
            predicted_revenue = base_forecast * 1.1  # 10% growth assumption

        return {
            "forecast_date": timezone.now().date(),
            "forecast_period": period,
            "predicted_revenue": predicted_revenue,
            "confidence_interval_lower": predicted_revenue * 0.8,
            "confidence_interval_upper": predicted_revenue * 1.2,
            "forecast_method": method,
            "factors": {
                "historical_revenue_90d": float(recent_revenue),
                "calculation_method": f"{method}_v1",
            },
        }
