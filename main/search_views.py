import json

from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .search_models import BulkOperation, GlobalSearchIndex, SavedSearch
from .search_service import BulkOperationService, SearchService
from .serializers import (
    BulkOperationSerializer,
    GlobalSearchIndexSerializer,
    SavedSearchSerializer,
    SearchResultSerializer,
)


class SearchAPIView(APIView):
    """Main search API endpoint"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Perform search based on query parameters"""
        query = request.query_params.get("q", "").strip()
        search_type = request.query_params.get("type", "global")
        sort_by = request.query_params.get("sort_by", "created_at")
        sort_order = request.query_params.get("sort_order", "desc")
        offset = int(request.query_params.get("offset", 0))
        limit = int(request.query_params.get("limit", 50))

        # Extract filters from query parameters
        filters = {}
        for key, value in request.query_params.items():
            if key.startswith("filter_"):
                filter_key = key.replace("filter_", "")

                # Parse JSON values for complex filters
                try:
                    if value.startswith("{") or value.startswith("["):
                        filters[filter_key] = json.loads(value)
                    else:
                        filters[filter_key] = value
                except json.JSONDecodeError:
                    filters[filter_key] = value

        search_service = SearchService(request.user)

        try:
            if search_type == "global":
                results = search_service.global_search(query, filters, limit)
                total_count = sum(len(v) for v in results.values())
                return Response(
                    {
                        "results": results,
                        "total_count": total_count,
                        "query": query,
                        "type": search_type,
                    }
                )
            else:
                results, total_count = search_service.advanced_search(
                    search_type, query, filters, sort_by, sort_order, offset, limit
                )

                # Serialize results
                serialized_results = []
                for result in results:
                    serialized_results.append(
                        search_service._serialize_search_result(result)
                    )

                return Response(
                    {
                        "results": serialized_results,
                        "total_count": total_count,
                        "offset": offset,
                        "limit": limit,
                        "query": query,
                        "type": search_type,
                    }
                )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SearchSuggestionsAPIView(APIView):
    """API endpoint for search suggestions"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get search suggestions"""
        query = request.query_params.get("q", "").strip()
        entity_type = request.query_params.get("type", None)
        limit = int(request.query_params.get("limit", 10))

        search_service = SearchService(request.user)
        suggestions = search_service.get_search_suggestions(query, entity_type, limit)

        return Response({"suggestions": suggestions, "query": query})


class SavedSearchViewSet(viewsets.ModelViewSet):
    """ViewSet for managing saved searches"""

    serializer_class = SavedSearchSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["search_type", "is_public"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at", "last_used", "use_count"]
    ordering = ["-last_used", "-created_at"]

    def get_queryset(self):
        """Get saved searches for current user or public searches"""
        return SavedSearch.objects.filter(
            Q(user=self.request.user) | Q(is_public=True)
        ).distinct()

    def perform_create(self, serializer):
        """Set user when creating saved search"""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def execute(self, request, pk=None):
        """Execute a saved search"""
        saved_search = self.get_object()
        offset = int(request.data.get("offset", 0))
        limit = int(request.data.get("limit", 50))

        search_service = SearchService(request.user)

        try:
            results, total_count = search_service.execute_saved_search(
                saved_search.id, offset, limit
            )

            return Response(
                {
                    "results": results,
                    "total_count": total_count,
                    "saved_search": SavedSearchSerializer(saved_search).data,
                }
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """Get recently used saved searches"""
        recent_searches = (
            self.get_queryset()
            .filter(last_used__isnull=False)
            .order_by("-last_used")[:10]
        )

        serializer = self.get_serializer(recent_searches, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def popular(self, request):
        """Get most popular saved searches"""
        popular_searches = (
            self.get_queryset()
            .filter(is_public=True, use_count__gt=0)
            .order_by("-use_count")[:10]
        )

        serializer = self.get_serializer(popular_searches, many=True)
        return Response(serializer.data)


class BulkOperationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing bulk operations"""

    serializer_class = BulkOperationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["operation_type", "status", "entity_type"]
    ordering_fields = ["created_at", "completed_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Get bulk operations for current user"""
        return BulkOperation.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Cancel a pending bulk operation"""
        bulk_operation = self.get_object()

        if bulk_operation.status in ["pending", "running"]:
            bulk_operation.status = "cancelled"
            bulk_operation.completed_at = timezone.now()
            bulk_operation.save()

            return Response({"message": "Bulk operation cancelled successfully"})
        else:
            return Response(
                {"error": "Cannot cancel completed operation"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class BulkUpdateAPIView(APIView):
    """API endpoint for bulk update operations"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Perform bulk update"""
        entity_type = request.data.get("entity_type")
        filters = request.data.get("filters", {})
        update_data = request.data.get("update_data", {})
        batch_size = int(request.data.get("batch_size", 100))

        if not entity_type or not update_data:
            return Response(
                {"error": "entity_type and update_data are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        bulk_service = BulkOperationService(request.user)

        try:
            bulk_operation = bulk_service.bulk_update(
                entity_type, filters, update_data, batch_size
            )

            return Response(
                {
                    "bulk_operation": BulkOperationSerializer(bulk_operation).data,
                    "message": "Bulk update operation started",
                }
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SearchFiltersAPIView(APIView):
    """API endpoint for getting available search filters"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get available filters for each entity type"""
        entity_type = request.query_params.get("entity_type", "all")

        filters_config = {
            "accounts": {
                "text_filters": ["name", "website", "email", "phone"],
                "choice_filters": {
                    "industry": [
                        "Technology",
                        "Finance",
                        "Healthcare",
                        "Manufacturing",
                        "Other",
                    ]
                },
                "date_filters": ["created_at", "updated_at"],
                "number_filters": [],
            },
            "contacts": {
                "text_filters": [
                    "first_name",
                    "last_name",
                    "email",
                    "phone",
                    "title",
                    "company",
                ],
                "choice_filters": {},
                "date_filters": ["created_at", "updated_at"],
                "number_filters": [],
            },
            "tasks": {
                "text_filters": ["title", "description"],
                "choice_filters": {
                    "status": ["pending", "in_progress", "completed", "cancelled"],
                    "priority": ["low", "medium", "high", "urgent"],
                    "task_type": [
                        "call",
                        "email",
                        "meeting",
                        "follow_up",
                        "research",
                        "other",
                    ],
                },
                "date_filters": ["due_date", "created_at", "updated_at"],
                "number_filters": [],
            },
            "deals": {
                "text_filters": ["name", "description"],
                "choice_filters": {
                    "stage": []  # Will be populated dynamically from DealStage
                },
                "date_filters": ["close_date", "created_at", "updated_at"],
                "number_filters": ["value"],
            },
            "quotes": {
                "text_filters": ["quote_number", "notes"],
                "choice_filters": {"status": ["draft", "sent", "accepted", "rejected"]},
                "date_filters": ["valid_until", "created_at", "updated_at"],
                "number_filters": ["total"],
            },
            "invoices": {
                "text_filters": ["invoice_number", "notes"],
                "choice_filters": {"status": ["draft", "sent", "paid", "overdue"]},
                "date_filters": ["due_date", "created_at", "updated_at"],
                "number_filters": ["total"],
            },
        }

        if entity_type == "all":
            return Response(filters_config)
        elif entity_type in filters_config:
            return Response({entity_type: filters_config[entity_type]})
        else:
            return Response(
                {"error": f"Entity type {entity_type} not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
