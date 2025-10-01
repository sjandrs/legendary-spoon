import re
from typing import Any, Dict, List, Tuple

from django.db.models import Q

from ..models import Account, Contact, Deal, Invoice, Project, Quote
from .base import BaseSearchProvider


class DatabaseSearchProvider(BaseSearchProvider):
    """
    A search provider that uses the Django ORM to perform searches
    against the database.
    """

    SEARCHABLE_MODELS = {
        "accounts": Account,
        "contacts": Contact,
        "projects": Project,
        "deals": Deal,
        "quotes": Quote,
        "invoices": Invoice,
    }

    def __init__(self, user):
        super().__init__(user)

    def advanced_search(
        self, entity_type, query, filters, sort_by, sort_order, offset, limit
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Perform a search against the database, applying filters and sorting.
        """
        if entity_type not in self.SEARCHABLE_MODELS:
            raise ValueError(f"Entity type '{entity_type}' not supported")

        model = self.SEARCHABLE_MODELS[entity_type]
        queryset = self._get_user_queryset(model, self.user)

        if query and len(query.strip()) >= 2:
            search_terms = self._extract_search_terms(query)
            queryset = self._search_in_model(queryset, search_terms, model)

        if filters:
            queryset = self.apply_filters(queryset, filters, model)

        total_count = queryset.count()

        if sort_by:
            order = f"-{sort_by}" if sort_order == "desc" else sort_by
            queryset = queryset.order_by(order)

        results = queryset[offset : offset + limit]

        # Serialize results
        serialized_results = [self._serialize_result(obj) for obj in results]

        return serialized_results, total_count

    def get_search_suggestions(
        self, query: str, entity_type: str = None, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get search suggestions from the database."""
        if len(query.strip()) < 2:
            return []

        if not entity_type or entity_type not in self.SEARCHABLE_MODELS:
            return []

        model = self.SEARCHABLE_MODELS[entity_type]
        queryset = self._get_user_queryset(model, self.user)

        search_fields = self._get_search_fields(model)
        q_object = Q()
        for field in search_fields:
            q_object |= Q(**{f"{field}__icontains": query})

        results = queryset.filter(q_object)[:limit]

        suggestions = []
        for item in results:
            suggestions.append(
                {
                    "id": item.pk,
                    "name": str(item),
                    "type": model.__name__,
                }
            )
        return suggestions

    def _get_user_queryset(self, model, user):
        """Get queryset filtered by user permissions"""
        if not user or not user.is_authenticated:
            return model.objects.none()

        if user.groups.filter(name__in=["Sales Manager", "Admin"]).exists():
            return model.objects.all()

        queryset = model.objects.all()
        if hasattr(model, "owner"):
            queryset = queryset.filter(owner=user)
        elif hasattr(model, "user"):
            queryset = queryset.filter(user=user)
        elif hasattr(model, "assigned_to"):
            queryset = queryset.filter(Q(assigned_to=user) | Q(created_by=user))

        return queryset

    def _extract_search_terms(self, query: str) -> List[str]:
        """Extract search terms from query string"""
        clean_query = re.sub(r"[^\w\s]", " ", query)
        terms = [term.strip() for term in clean_query.split() if len(term.strip()) >= 2]
        return terms

    def _search_in_model(self, queryset, search_terms: List[str], model):
        """Apply search terms to a model queryset"""
        if not search_terms:
            return queryset

        search_fields = self._get_search_fields(model)
        query = Q()

        for term in search_terms:
            term_query = Q()
            for field in search_fields:
                term_query |= Q(**{f"{field}__icontains": term})
            query &= term_query

        return queryset.filter(query).distinct()

    def _get_search_fields(self, model) -> List[str]:
        """Get searchable fields for a model"""
        search_fields_map = {
            "Account": ["name", "website", "notes", "phone_number", "address"],
            "Contact": ["first_name", "last_name", "email", "phone_number", "title"],
            "Project": ["title", "description"],
            "Deal": ["title", "description"],
            "Quote": [],  # Quote model has no direct text fields to search
            "Invoice": [],  # Invoice model has no direct text fields to search
        }
        fields = search_fields_map.get(model.__name__, ["name"])
        # If fields is empty, fallback to 'id' to avoid query errors
        return fields if fields else ["id"]

    def apply_filters(self, queryset, filters: Dict[str, Any], model):
        """Apply filters to queryset"""
        filter_kwargs = {}
        for field, value in filters.items():
            if value is None or value == "":
                continue

            if isinstance(value, dict):
                for operator, filter_value in value.items():
                    if operator in ["gte", "lte", "gt", "lt"]:
                        filter_kwargs[f"{field}__{operator}"] = filter_value
            elif isinstance(value, list):
                filter_kwargs[f"{field}__in"] = value
            elif field.endswith("_date") or field in ["due_date", "created_at"]:
                if isinstance(value, str) and " to " in value:
                    start_date, end_date = value.split(" to ", 1)
                    filter_kwargs[f"{field}__gte"] = start_date
                    filter_kwargs[f"{field}__lte"] = end_date
                else:
                    filter_kwargs[field] = value
            else:
                filter_kwargs[f"{field}__icontains"] = value

        if filter_kwargs:
            queryset = queryset.filter(**filter_kwargs)
        return queryset

    def _serialize_result(self, obj: Any) -> Dict[str, Any]:
        """Serializes a model object into a dictionary."""
        model_name = obj.__class__.__name__
        data = {
            "id": obj.pk,
            "type": model_name,
            "name": str(obj),
        }
        if model_name == "Contact":
            data["first_name"] = obj.first_name
            data["last_name"] = obj.last_name
            data["email"] = obj.email
        elif model_name == "Account":
            data["industry"] = obj.industry
            data["website"] = obj.website
        return data
