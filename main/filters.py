import django_filters
from django.utils import timezone
from datetime import timedelta

from .models import AnalyticsSnapshot, BudgetV2, Deal


class DealFilter(django_filters.FilterSet):
    class Meta:
        model = Deal
        fields = ["stage", "owner", "status"]


class BudgetV2Filter(django_filters.FilterSet):
    year = django_filters.NumberFilter(field_name="year", lookup_expr="exact")
    cost_center = django_filters.NumberFilter(
        field_name="cost_center", lookup_expr="exact"
    )

    class Meta:
        model = BudgetV2
        fields = ["year", "cost_center"]


class AnalyticsSnapshotFilter(django_filters.FilterSet):
    """Enhanced filtering for analytics snapshots with date ranges and performance optimization."""
    
    date_from = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="date", lookup_expr="lte")
    
    # Convenience filters for common date ranges
    last_7_days = django_filters.BooleanFilter(method="filter_last_7_days")
    last_30_days = django_filters.BooleanFilter(method="filter_last_30_days")
    last_90_days = django_filters.BooleanFilter(method="filter_last_90_days")
    
    # Value range filters for performance metrics
    revenue_min = django_filters.NumberFilter(field_name="total_revenue", lookup_expr="gte")
    revenue_max = django_filters.NumberFilter(field_name="total_revenue", lookup_expr="lte")
    
    class Meta:
        model = AnalyticsSnapshot
        fields = [
            "date",
            "date_from",
            "date_to",
            "last_7_days",
            "last_30_days",
            "last_90_days",
            "revenue_min",
            "revenue_max",
        ]
    
    def filter_last_7_days(self, queryset, name, value):
        """Filter to last 7 days if value is True."""
        if value:
            cutoff_date = timezone.now().date() - timedelta(days=7)
            return queryset.filter(date__gte=cutoff_date)
        return queryset
    
    def filter_last_30_days(self, queryset, name, value):
        """Filter to last 30 days if value is True."""
        if value:
            cutoff_date = timezone.now().date() - timedelta(days=30)
            return queryset.filter(date__gte=cutoff_date)
        return queryset
    
    def filter_last_90_days(self, queryset, name, value):
        """Filter to last 90 days if value is True."""
        if value:
            cutoff_date = timezone.now().date() - timedelta(days=90)
            return queryset.filter(date__gte=cutoff_date)
        return queryset
