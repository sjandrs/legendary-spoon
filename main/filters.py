import django_filters

from .models import Deal


class DealFilter(django_filters.FilterSet):
    class Meta:
        model = Deal
        fields = ["stage", "owner", "status"]
