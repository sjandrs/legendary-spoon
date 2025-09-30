import io
import logging
import os

from django.conf import settings
from django.contrib.auth.models import Group
from django.db import models
from django.db.models import Avg, Count, F, Q, Sum
from django.http import FileResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Account,
    ActivityLog,
    AnalyticsSnapshot,
    Budget,
    Contact,
    CustomField,
    CustomFieldValue,
    CustomUser,
    CustomerLifetimeValue,
    Deal,
    DealPrediction,
    DealStage,
    DefaultWorkOrderItem,
    Expense,
    Interaction,
    Invoice,
    InvoiceItem,
    JournalEntry,
    LedgerAccount,
    LineItem,
    Payment,
    Post,
    Project,
    ProjectTemplate,
    ProjectType,
    Quote,
    QuoteItem,
    RevenueForecast,
    Tag,
    TimeEntry,
    Warehouse,
    WarehouseItem,
    WorkOrder,
    WorkOrderInvoice,
)
from .serializers import (
    AccountSerializer,
    AccountWithCustomFieldsSerializer,
    ActivityLogSerializer,
    AnalyticsSnapshotSerializer,
    BudgetSerializer,
    BulkOperationSerializer,
    ContactSerializer,
    ContactWithCustomFieldsSerializer,
    CustomFieldSerializer,
    CustomFieldValueSerializer,
    CustomUserSerializer,
    CustomerLifetimeValueSerializer,
    DealPredictionSerializer,
    DealSerializer,
    DealStageSerializer,
    DefaultWorkOrderItemSerializer,
    ExpenseSerializer,
    GlobalSearchIndexSerializer,
    InteractionSerializer,
    InvoiceItemSerializer,
    InvoiceSerializer,
    JournalEntrySerializer,
    LedgerAccountSerializer,
    LineItemSerializer,
    PaymentSerializer,
    PostSerializer,
    ProjectSerializer,
    ProjectTemplateSerializer,
    ProjectTypeSerializer,
    QuoteItemSerializer,
    QuoteSerializer,
    RevenueForecastSerializer,
    SavedSearchSerializer,
    SearchResultSerializer,
    TagSerializer,
    TimeEntrySerializer,
    UserSerializer,
    WarehouseItemSerializer,
    WarehouseSerializer,
    WorkOrderInvoiceSerializer,
    WorkOrderSerializer,
)

logger = logging.getLogger(__name__)


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all().order_by("name")
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]


class PostViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows posts to be viewed or edited.
    """

    queryset = Post.objects.filter(status="published").order_by("-created_at")
    serializer_class = PostSerializer
    permission_classes = [
        viewsets.ModelViewSet.permission_classes[0]
    ]  # IsAuthenticatedOrReadOnly
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["categories__slug", "tags__slug", "author__username"]
    search_fields = ["title", "content", "rich_content"]
    ordering_fields = ["created_at", "updated_at", "title"]
    ordering = ["-created_at"]


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AccountWithCustomFieldsSerializer
        return AccountSerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="Sales Manager").exists():
            # Sales managers can see all accounts
            return Account.objects.all()
        else:
            # Sales reps can only see their own accounts
            return Account.objects.filter(owner=user)

    def perform_create(self, serializer):
        # Automatically set the owner to the current user
        serializer.save(owner=self.request.user)

        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action="create",
            content_object=serializer.instance,
            description=f"Created account: {serializer.instance.name}",
        )

    def perform_update(self, serializer):
        serializer.save()

        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action="update",
            content_object=serializer.instance,
            description=f"Updated account: {serializer.instance.name}",
        )


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["owner", "account"]
    search_fields = ["first_name", "last_name", "email", "account__name"]
    ordering_fields = ["last_name", "first_name", "created_at"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ContactWithCustomFieldsSerializer
        return ContactSerializer

    def get_queryset(self):
        # Return all contacts for any authenticated user
        return Contact.objects.all()

    def perform_create(self, serializer):
        # Automatically set the owner to the current user
        serializer.save(owner=self.request.user)

        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action="create",
            content_object=serializer.instance,
            description=f"Created contact: {serializer.instance.first_name} {serializer.instance.last_name}",
        )

    def perform_update(self, serializer):
        serializer.save()

        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action="update",
            content_object=serializer.instance,
            description=f"Updated contact: {serializer.instance.first_name} {serializer.instance.last_name}",
        )


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = [
        "status",
        "priority",
        "project_type",
        "assigned_to",
        "deal",
        "account",
        "contact",
    ]
    search_fields = ["title", "description"]
    ordering_fields = ["due_date", "created_at", "priority"]
    ordering = ["due_date"]

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="Sales Manager").exists():
            # Sales managers can see all projects
            return Project.objects.all()
        else:
            # Sales reps can only see their own projects (assigned_to or created_by)
            return Project.objects.filter(
                Q(assigned_to=user) | Q(created_by=user)
            ).distinct()

    def perform_create(self, serializer):
        # Set created_by to current user and save
        instance = serializer.save(created_by=self.request.user)

        # If 'assigned_to' is not in the request data, assign it to the creator
        if "assigned_to" not in self.request.data:
            instance.assigned_to = self.request.user
            instance.save()

        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action="create",
            content_object=instance,
            description=f"Created project: {instance.title}",
        )

    def perform_update(self, serializer):
        # Check if project was marked as completed
        old_instance = self.get_object()
        old_status = old_instance.status
        serializer.save()

        if old_status != serializer.instance.status:
            if serializer.instance.status == "completed":
                ActivityLog.objects.create(
                    user=self.request.user,
                    action="complete",
                    content_object=serializer.instance,
                    description=f"Completed project: {serializer.instance.title}",
                )
            else:
                ActivityLog.objects.create(
                    user=self.request.user,
                    action="update",
                    content_object=serializer.instance,
                    description=f"Updated project status to {serializer.instance.get_status_display()}: {serializer.instance.title}",
                )
        else:
            ActivityLog.objects.create(
                user=self.request.user,
                action="update",
                content_object=serializer.instance,
                description=f"Updated project: {serializer.instance.title}",
            )

    @action(detail=False, methods=["get"])
    def my_projects(self, request):
        """Get projects assigned to the current user"""
        projects = self.get_queryset().filter(assigned_to=request.user)
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def overdue(self, request):
        """Get overdue projects"""
        projects = [
            project for project in self.get_queryset().all() if project.is_overdue
        ]
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        """Get projects due in the next 7 days"""
        from datetime import date, timedelta

        upcoming_date = date.today() + timedelta(days=7)
        projects = self.get_queryset().filter(
            due_date__lte=upcoming_date,
            due_date__gte=date.today(),
            status__in=["pending", "in_progress"],
        )
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)


class DealStageViewSet(viewsets.ModelViewSet):
    queryset = DealStage.objects.all()
    serializer_class = DealStageSerializer


from .filters import DealFilter


class DealViewSet(viewsets.ModelViewSet):
    queryset = Deal.objects.all()
    serializer_class = DealSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = DealFilter  # Use the custom filter class
    search_fields = ["name", "description", "account__name"]
    ordering_fields = ["name", "value", "expected_close_date"]
    ordering = ["-expected_close_date"]

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="Sales Manager").exists():
            # Sales managers can see all deals
            return Deal.objects.all()
        else:
            # Sales reps can only see their own deals
            return Deal.objects.filter(owner=user)

    @action(detail=True, methods=["post"])
    def update_stage(self, request, pk=None):
        deal = self.get_object()
        stage_id = request.data.get("stage_id")
        try:
            new_stage = DealStage.objects.get(id=stage_id)
            deal.stage = new_stage
            deal.save()
            return Response(self.get_serializer(deal).data)
        except DealStage.DoesNotExist:
            return Response(
                {"error": "Stage not found"}, status=status.HTTP_404_NOT_FOUND
            )


class InteractionViewSet(viewsets.ModelViewSet):
    queryset = Interaction.objects.all().order_by("-interaction_date")
    serializer_class = InteractionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["contact", "account"]


class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer

    @action(detail=True, methods=["get"])
    def download_pdf(self, request, pk=None):
        quote = self.get_object()
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)

        p.drawString(100, 750, f"Quote for: {quote.deal.name}")
        p.drawString(100, 735, f"Account: {quote.deal.account.name}")
        p.drawString(100, 720, f"Valid Until: {quote.valid_until}")

        p.drawString(100, 680, "Items:")
        y = 660
        for item in quote.items.all():
            p.drawString(
                120, y, f"- {item.description}: {item.quantity} x ${item.unit_price}"
            )
            y -= 15

        total = sum(item.quantity * item.unit_price for item in quote.items.all())
        p.drawString(100, y - 20, f"Total: ${total}")

        p.showPage()
        p.save()
        buffer.seek(0)
        return FileResponse(
            buffer, as_attachment=True, filename=f"quote_{quote.id}.pdf"
        )


class QuoteItemViewSet(viewsets.ModelViewSet):
    queryset = QuoteItem.objects.all()
    serializer_class = QuoteItemSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

    @action(detail=True, methods=["get"])
    def download_pdf(self, request, pk=None):
        invoice = self.get_object()
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)

        p.drawString(100, 750, f"Invoice for: {invoice.deal.name}")
        p.drawString(100, 735, f"Account: {invoice.deal.account.name}")
        p.drawString(100, 720, f"Due Date: {invoice.due_date}")

        p.drawString(100, 680, "Items:")
        y = 660
        for item in invoice.items.all():
            p.drawString(
                120, y, f"- {item.description}: {item.quantity} x ${item.unit_price}"
            )
            y -= 15

        total = sum(item.quantity * item.unit_price for item in invoice.items.all())
        p.drawString(100, y - 20, f"Total: ${total}")

        p.showPage()
        p.save()
        buffer.seek(0)
        return FileResponse(
            buffer, as_attachment=True, filename=f"invoice_{invoice.id}.pdf"
        )


class InvoiceItemViewSet(viewsets.ModelViewSet):
    queryset = InvoiceItem.objects.all()
    serializer_class = InvoiceItemSerializer


class CustomFieldViewSet(viewsets.ModelViewSet):
    queryset = CustomField.objects.all()
    serializer_class = CustomFieldSerializer


class CustomFieldValueViewSet(viewsets.ModelViewSet):
    queryset = CustomFieldValue.objects.all()
    serializer_class = CustomFieldValueSerializer


class DashboardStatsView(APIView):
    """
    A view to provide statistics for the main dashboard.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Data for Deals by Stage Chart
        deals_by_stage = list(
            Deal.objects.values("stage__id", "stage__name")
            .annotate(count=Count("id"))
            .order_by("stage__name")
        )

        # Data for Sales Performance Doughnut Chart - More explicit queries
        won_count = Deal.objects.filter(status="won").count()
        lost_count = Deal.objects.filter(status="lost").count()
        in_progress_count = Deal.objects.filter(status="in_progress").count()

        status_counts = {
            "won": won_count,
            "lost": lost_count,
            "in_progress": in_progress_count,
        }

        # Fetch recent interactions
        recent_activities = Interaction.objects.select_related("contact").order_by(
            "-interaction_date"
        )[:5]
        recent_activities_data = InteractionSerializer(
            recent_activities, many=True
        ).data

        data = {
            "deals_by_stage": deals_by_stage,
            "sales_performance": status_counts,
            "recent_activities": recent_activities_data,
        }
        return Response(data)


class UserRoleManagementView(APIView):
    """
    Allows administrators to manage user roles.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only allow sales managers to view/manage roles
        if not request.user.groups.filter(name="Sales Manager").exists():
            return Response(
                {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        users = CustomUser.objects.all()
        groups = Group.objects.filter(name__in=["Sales Rep", "Sales Manager"])

        user_data = []
        for user in users:
            user_groups = user.groups.filter(name__in=["Sales Rep", "Sales Manager"])
            user_data.append(
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "groups": [g.name for g in user_groups],
                }
            )

        return Response(
            {
                "users": user_data,
                "available_groups": [{"id": g.id, "name": g.name} for g in groups],
            }
        )

    def post(self, request):
        # Only allow sales managers to assign roles
        if not request.user.groups.filter(name="Sales Manager").exists():
            return Response(
                {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        user_id = request.data.get("user_id")
        group_name = request.data.get("group_name")
        action = request.data.get("action", "add")  # 'add' or 'remove'

        try:
            user = CustomUser.objects.get(id=user_id)
            group = Group.objects.get(name=group_name)

            if action == "add":
                user.groups.add(group)
            elif action == "remove":
                user.groups.remove(group)

            return Response({"success": True})
        except (CustomUser.DoesNotExist, Group.DoesNotExist):
            return Response(
                {"error": "User or group not found"}, status=status.HTTP_404_NOT_FOUND
            )


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API endpoint for activity logs.
    Provides timeline of all user actions in the system.
    """

    serializer_class = ActivityLogSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["user", "action", "resource_type"]
    ordering = ["-timestamp"]

    def get_queryset(self):
        """Return activity logs for the current user or all logs for managers"""
        if self.request.user.groups.filter(
            name__in=["Sales Manager", "Admin"]
        ).exists():
            return ActivityLog.objects.all()
        else:
            return ActivityLog.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """Get recent activity (last 50 items)"""
        logs = self.get_queryset()[:50]
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_resource(self, request):
        """Get activity logs for a specific resource"""
        resource_type = request.query_params.get("resource_type")
        resource_id = request.query_params.get("resource_id")

        if not resource_type or not resource_id:
            return Response(
                {"error": "resource_type and resource_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        logs = self.get_queryset().filter(
            resource_type=resource_type, resource_id=resource_id
        )
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)


class MyContactsView(APIView):
    """
    A view to return contacts for the currently logged-in user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        contacts = Contact.objects.filter(owner=request.user)
        serializer = ContactSerializer(contacts, many=True)
        return Response(serializer.data)


class KnowledgeBaseView(APIView):
    """
    A view to list all markdown files in the knowledge base directory.
    """

    def get(self, request, *args, **kwargs):
        kb_dir = os.path.join(settings.STATICFILES_DIRS[0], "kb")
        try:
            files = [f for f in os.listdir(kb_dir) if f.endswith(".md")]
            articles = [os.path.splitext(f)[0] for f in files]
            return Response(articles)
        except FileNotFoundError:
            return Response(
                {"error": "Knowledge base directory not found."}, status=404
            )


class MarkdownFileView(APIView):
    """
    A view to return the content of a markdown file from the kb folder.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, file_name):
        # Construct the full path to the markdown file inside the static/kb directory
        base_dir = os.path.dirname(
            os.path.dirname(os.path.abspath(__file__))
        )  # Go up two levels from main/api_views.py to the project root
        file_path = os.path.join(base_dir, "static", "kb", f"{file_name}.md")

        if not os.path.exists(file_path):
            return Response(
                {"error": f"File not found at {file_path}"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            return Response({"content": content})
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProjectTemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing Project Templates.
    Allows creating, viewing, updating, and deleting templates.
    Superusers have full access.
    """

    queryset = ProjectTemplate.objects.all()
    serializer_class = ProjectTemplateSerializer
    permission_classes = [IsAuthenticated]  # Further checks can be done in methods

    def get_queryset(self):
        # Allow any authenticated user to view templates
        return ProjectTemplate.objects.all().order_by("name")

    def perform_create(self, serializer):
        # Only superusers can create templates
        if not self.request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "You do not have permission to create task templates."
            )
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        # Only superusers can update templates
        if not self.request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "You do not have permission to update task templates."
            )
        serializer.save()

    def perform_destroy(self, instance):
        # Only superusers can delete templates
        if not self.request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "You do not have permission to delete task templates."
            )
        instance.delete()

    @action(detail=True, methods=["post"])
    def create_project_from_template(self, request, pk=None):
        """
        Creates a new Project instance based on this template.
        Expects 'contact_id' in the request data.
        """
        template = self.get_object()
        contact_id = request.data.get("contact_id")

        if not contact_id:
            return Response(
                {"error": "contact_id is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            contact = Contact.objects.get(id=contact_id)
        except Contact.DoesNotExist:
            return Response(
                {"error": "Contact not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # Create the new project
        new_project = Project.objects.create(
            title=template.default_title,
            description=template.default_description,
            project_type=template.default_project_type,
            priority=template.default_priority,
            due_date=request.data.get("due_date"),
            contact=contact,
            account=contact.account,
            created_by=request.user,
            # ... other fields as needed
        )

        return Response(
            ProjectSerializer(new_project).data, status=status.HTTP_201_CREATED
        )


class DefaultWorkOrderItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows default work order items to be viewed or edited.
    """

    queryset = DefaultWorkOrderItem.objects.all()
    serializer_class = DefaultWorkOrderItemSerializer
    permission_classes = [
        viewsets.ModelViewSet.permission_classes[0]
    ]  # IsAuthenticatedOrReadOnly
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["project_template__name", "description", "owner__username"]
    search_fields = ["description"]
    ordering_fields = ["created_at", "updated_at", "description"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        # Automatically set the owner to the current user
        serializer.save(owner=self.request.user)

        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action="create",
            content_object=serializer.instance,
            description=f"Created default work order item: {serializer.instance.description}",
        )

    def perform_update(self, serializer):
        serializer.save()

        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action="update",
            content_object=serializer.instance,
            description=f"Updated default work order item: {serializer.instance.description}",
        )


class ProjectTypeViewSet(viewsets.ModelViewSet):
    queryset = ProjectType.objects.all().order_by("name")
    serializer_class = ProjectTypeSerializer
    permission_classes = [permissions.IsAdminUser]


class GlobalSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        query = request.query_params.get("q", "")
        if not query:
            return Response([])

        # Split the query into individual terms
        query_terms = query.split()

        # Initialize an empty list to collect results
        results = []

        # Search in Posts
        post_results = Post.objects.filter(
            Q(title__icontains=query)
            | Q(content__icontains=query)
            | Q(rich_content__icontains=query)
        ).distinct()[
            :5
        ]  # Limit to 5 results for performance

        for post in post_results:
            results.append(
                {
                    "type": "post",
                    "id": post.id,
                    "title": post.title,
                    "url": f"/api/posts/{post.id}/",
                    "snippet": post.content[:75] + "..." if post.content else "",
                }
            )

        # Search in Accounts
        account_results = Account.objects.filter(
            Q(name__icontains=query)
            | Q(email__icontains=query)
            | Q(phone__icontains=query)
        ).distinct()[:5]

        for account in account_results:
            results.append(
                {
                    "type": "account",
                    "id": account.id,
                    "name": account.name,
                    "url": f"/api/accounts/{account.id}/",
                    "snippet": account.description[:75] + "..."
                    if account.description
                    else "",
                }
            )

        # Search in Contacts
        contact_results = Contact.objects.filter(
            Q(first_name__icontains=query)
            | Q(last_name__icontains=query)
            | Q(email__icontains=query)
        ).distinct()[:5]

        for contact in contact_results:
            results.append(
                {
                    "type": "contact",
                    "id": contact.id,
                    "name": f"{contact.first_name} {contact.last_name}",
                    "url": f"/api/contacts/{contact.id}/",
                    "snippet": contact.notes[:75] + "..." if contact.notes else "",
                }
            )

        # Search in Tasks
        task_results = Project.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query)
        ).distinct()[:5]

        for task in task_results:
            results.append(
                {
                    "type": "project",
                    "id": task.id,
                    "title": task.title,
                    "url": f"/api/projects/{task.id}/",  # Ensure this matches your router's registered endpoint for ProjectViewSet
                    "snippet": task.description[:75] + "..."
                    if task.description
                    else "",
                }
            )

        # Search in Deals
        deal_results = Deal.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        ).distinct()[:5]

        for deal in deal_results:
            results.append(
                {
                    "type": "deal",
                    "id": deal.id,
                    "name": deal.name,
                    "url": f"/api/deals/{deal.id}/",
                    "snippet": deal.description[:75] + "..."
                    if deal.description
                    else "",
                }
            )

        # Search in Notes (Markdown files)
        import os

        from django.conf import settings

        kb_base_path = os.path.join(settings.BASE_DIR, "static", "kb")
        note_file_results = []
        if os.path.exists(kb_base_path):
            for file_name in os.listdir(kb_base_path):
                if file_name.endswith(".md"):
                    file_path = os.path.join(kb_base_path, file_name)
                    with open(file_path, "r", encoding="utf-8") as file:
                        file_content = file.read()
                        if query.lower() in file_content.lower():
                            note_file_results.append(
                                {
                                    "file_name": file_name,
                                    "url": f"/api/knowledge_base/{file_name.replace('.md', '')}/",
                                    "snippet": file_content[:75] + "...",
                                }
                            )

        results.extend(
            [
                {
                    "type": "note",
                    "file_name": note["file_name"],
                    "url": note["url"],
                    "snippet": note["snippet"],
                }
                for note in note_file_results
            ]
        )

        # Limit total results to 20 for performance
        return Response(results[:20])


class LedgerAccountViewSet(viewsets.ModelViewSet):
    queryset = LedgerAccount.objects.all()
    serializer_class = LedgerAccountSerializer
    permission_classes = [permissions.IsAuthenticated]


class JournalEntryViewSet(viewsets.ModelViewSet):
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer
    permission_classes = [permissions.IsAuthenticated]


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer
    permission_classes = [permissions.IsAuthenticated]


class LineItemViewSet(viewsets.ModelViewSet):
    queryset = LineItem.objects.all()
    serializer_class = LineItemSerializer
    permission_classes = [permissions.IsAuthenticated]


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]


from django.http import Http404

# Financial Reports API Views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .reports import FinancialReports


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def balance_sheet_report(request):
    """
    Get balance sheet report
    Query parameters:
    - as_of_date: Date in YYYY-MM-DD format (optional, defaults to today)
    """
    as_of_date_str = request.query_params.get("as_of_date")
    as_of_date = None
    if as_of_date_str:
        try:
            from datetime import datetime

            as_of_date = datetime.strptime(as_of_date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"}, status=400
            )

    report_data = FinancialReports.get_balance_sheet(as_of_date)
    return Response(report_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profit_loss_report(request):
    """
    Get profit and loss report
    Query parameters:
    - start_date: Start date in YYYY-MM-DD format (optional, defaults to start of current month)
    - end_date: End date in YYYY-MM-DD format (optional, defaults to today)
    """
    start_date_str = request.query_params.get("start_date")
    end_date_str = request.query_params.get("end_date")

    start_date = None
    end_date = None

    if start_date_str:
        try:
            from datetime import datetime

            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Invalid start_date format. Use YYYY-MM-DD"}, status=400
            )

    if end_date_str:
        try:
            from datetime import datetime

            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Invalid end_date format. Use YYYY-MM-DD"}, status=400
            )

    report_data = FinancialReports.get_profit_loss(start_date, end_date)
    return Response(report_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cash_flow_report(request):
    """
    Get cash flow report
    Query parameters:
    - start_date: Start date in YYYY-MM-DD format (optional, defaults to start of current month)
    - end_date: End date in YYYY-MM-DD format (optional, defaults to today)
    """
    start_date_str = request.query_params.get("start_date")
    end_date_str = request.query_params.get("end_date")

    start_date = None
    end_date = None

    if start_date_str:
        try:
            from datetime import datetime

            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Invalid start_date format. Use YYYY-MM-DD"}, status=400
            )

    if end_date_str:
        try:
            from datetime import datetime

            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Invalid end_date format. Use YYYY-MM-DD"}, status=400
            )

    report_data = FinancialReports.get_cash_flow(start_date, end_date)
    return Response(report_data)


# Expense and Budget API Views
class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="Sales Manager").exists():
            return Expense.objects.all()
        else:
            return Expense.objects.filter(submitted_by=user)

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)


class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# Time Tracking API Views
class TimeEntryViewSet(viewsets.ModelViewSet):
    serializer_class = TimeEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Users can see time entries for projects they own or are assigned to
        return TimeEntry.objects.filter(
            Q(project__owner=user) | Q(project__assigned_to=user) | Q(user=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# Warehouse API Views
class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [permissions.IsAuthenticated]


class WarehouseItemViewSet(viewsets.ModelViewSet):
    serializer_class = WarehouseItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WarehouseItem.objects.all()

    def perform_create(self, serializer):
        serializer.save()


# Invoice Generation API Views
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_workorder_invoice(request, workorder_id):
    """
    Generate an invoice for a specific work order
    """
    try:
        workorder = WorkOrder.objects.get(id=workorder_id)
    except WorkOrder.DoesNotExist:
        return Response({"error": "WorkOrder not found"}, status=404)

    payment_terms = request.data.get("payment_terms", "net_30")

    # Check if invoice already exists
    if workorder.invoices.exists():
        return Response(
            {"error": "Invoice already exists for this WorkOrder"}, status=400
        )

    try:
        invoice = workorder.generate_invoice(payment_terms)
        serializer = WorkOrderInvoiceSerializer(invoice)
        return Response(serializer.data, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def overdue_invoices(request):
    """
    Get all overdue invoices
    """
    overdue_invoices = WorkOrderInvoice.objects.filter(
        is_paid=False, due_date__lt=timezone.now().date()
    )
    serializer = WorkOrderInvoiceSerializer(overdue_invoices, many=True)
    return Response(serializer.data)


# Tax Report API View
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def tax_report(request):
    """
    Generate tax report data for a specific year
    """
    year = request.query_params.get("year", timezone.now().year)
    try:
        year = int(year)
    except ValueError:
        return Response({"error": "Invalid year format"}, status=400)

    # Calculate date range for the tax year
    start_date = timezone.datetime(year, 1, 1).date()
    end_date = timezone.datetime(year, 12, 31).date()

    # Get contractor payments (from invoices paid to contractors)
    contractor_payments = (
        WorkOrderInvoice.objects.filter(
            work_order__assigned_to__isnull=False,  # Has an assigned contractor
            is_paid=True,
            paid_date__range=(start_date, end_date),
        )
        .values(
            "work_order__assigned_to__first_name",
            "work_order__assigned_to__last_name",
            "work_order__assigned_to",
        )
        .annotate(total_payments=Sum("total_amount"))
        .order_by("-total_payments")
    )

    # Format contractor data
    contractors = []
    for payment in contractor_payments:
        user = CustomUser.objects.get(id=payment["work_order__assigned_to"])
        contractors.append(
            {
                "id": user.id,
                "name": f"{user.first_name} {user.last_name}",
                "tax_id": getattr(user, "tax_id", None),
                "total_payments": payment["total_payments"],
            }
        )

    # Calculate sales tax using configurable rate from settings (default to 8.5% if not set)
    sales_tax_rate = getattr(settings, "SALES_TAX_RATE", 0.085)
    total_sales = (
        Invoice.objects.filter(
            created_at__date__range=(start_date, end_date)
        ).aggregate(total=Sum("total_amount"))["total"]
        or 0
    )

    tax_collected = total_sales * sales_tax_rate

    # Get expenses by category
    expenses_by_category = (
        Expense.objects.filter(date__range=(start_date, end_date), approved=True)
        .values("category")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )

    # Calculate totals
    total_expenses = sum(cat["total"] for cat in expenses_by_category)
    total_revenue = (
        Invoice.objects.filter(
            created_at__date__range=(start_date, end_date)
        ).aggregate(total=Sum("total_amount"))["total"]
        or 0
    )

    net_income = total_revenue - total_expenses
    # Use configurable tax rate from settings or default to 25%
    tax_rate = getattr(settings, "TAX_RATE", 0.25)
    estimated_tax = max(0, net_income * tax_rate)

    tax_data = {
        "year": year,
        "contractorPayments": contractors,
        "salesTax": {
            "total_sales": total_sales,
            "tax_collected": tax_collected,
            "tax_rate": sales_tax_rate,
        },
        "expensesByCategory": list(expenses_by_category),
        "totalExpenses": total_expenses,
        "totalRevenue": total_revenue,
        "netIncome": net_income,
        "estimatedTax": estimated_tax,
    }

    return Response(tax_data)


# Analytics API Views
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_analytics(request):
    """
    Provide cross-module analytics for dashboard.
    Implements REQ-205: cross-module analytics.
    """
    # Date range - last 30 days by default
    end_date = timezone.now().date()
    start_date = end_date - timezone.timedelta(days=30)

    # Sales Analytics
    total_deals = Deal.objects.filter(
        created_at__date__range=(start_date, end_date)
    ).count()
    won_deals = Deal.objects.filter(
        status="won", created_at__date__range=(start_date, end_date)
    ).count()
    total_deal_value = (
        Deal.objects.filter(
            status="won", created_at__date__range=(start_date, end_date)
        ).aggregate(total=Sum("value"))["total"]
        or 0
    )

    # Project Analytics
    total_projects = Project.objects.filter(
        created_at__date__range=(start_date, end_date)
    ).count()
    completed_projects = Project.objects.filter(
        status="completed", created_at__date__range=(start_date, end_date)
    ).count()
    overdue_projects = Project.objects.filter(
        status__in=["pending", "in_progress"], due_date__lt=timezone.now().date()
    ).count()

    # Financial Analytics
    total_revenue = (
        WorkOrderInvoice.objects.filter(
            issued_date__range=(start_date, end_date),
            is_paid=True
        ).aggregate(total=Sum("total_amount"))["total"]
        or 0
    )
    total_expenses = (
        Expense.objects.filter(
            date__range=(start_date, end_date), approved=True
        ).aggregate(total=Sum("amount"))["total"]
        or 0
    )

    # Customer Lifetime Value (CLV) - simplified calculation
    customers = (
        Account.objects.annotate(
            total_value=Sum("deals__value", filter=Q(deals__status="won"))
        )
        .filter(total_value__gt=0)
        .order_by("-total_value")[:10]
    )

    clv_data = [
        {
            "account": account.name,
            "total_value": account.total_value,
            "deal_count": account.deals.filter(status="won").count(),
        }
        for account in customers
    ]

    # Project Profitability
    projects_with_costs = (
        Project.objects.filter(created_at__date__range=(start_date, end_date))
        .annotate(
            revenue=Sum("work_orders__invoices__total_amount"),
            costs=Sum("work_orders__line_items__total"),
        )
        .filter(revenue__isnull=False)
    )

    project_profitability = []
    for project in projects_with_costs:
        revenue = project.revenue or 0
        costs = project.costs or 0
        profit = revenue - costs
        margin = (profit / revenue * 100) if revenue > 0 else 0

        project_profitability.append(
            {
                "project": project.title,
                "revenue": revenue,
                "costs": costs,
                "profit": profit,
                "margin": round(margin, 2),
            }
        )

    # Time tracking analytics
    total_hours_logged = (
        TimeEntry.objects.filter(date__range=(start_date, end_date)).aggregate(
            total=Sum("hours")
        )["total"]
        or 0
    )

    billable_hours = (
        TimeEntry.objects.filter(
            date__range=(start_date, end_date), billable=True
        ).aggregate(total=Sum("hours"))["total"]
        or 0
    )

    # Inventory analytics (if warehouse exists)
    low_stock_items = []
    try:
        from .models import WarehouseItem

        low_stock_items = list(
            WarehouseItem.objects.filter(quantity__lte=F("minimum_stock")).values(
                "name", "quantity", "minimum_stock", "warehouse__name"
            )
        )
    except:
        pass  # Warehouse models might not be available yet

    analytics_data = {
        "period": {"start_date": start_date, "end_date": end_date},
        "sales": {
            "total_deals": total_deals,
            "won_deals": won_deals,
            "win_rate": round(
                (won_deals / total_deals * 100) if total_deals > 0 else 0, 2
            ),
            "total_value": total_deal_value,
        },
        "projects": {
            "total_projects": total_projects,
            "completed_projects": completed_projects,
            "completion_rate": round(
                (completed_projects / total_projects * 100)
                if total_projects > 0
                else 0,
                2,
            ),
            "overdue_projects": overdue_projects,
        },
        "financial": {
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "net_income": total_revenue - total_expenses,
            "profit_margin": round(
                ((total_revenue - total_expenses) / total_revenue * 100)
                if total_revenue > 0
                else 0,
                2,
            ),
        },
        "time_tracking": {
            "total_hours": float(total_hours_logged),
            "billable_hours": float(billable_hours),
            "billable_percentage": round(
                (billable_hours / total_hours_logged * 100)
                if total_hours_logged > 0
                else 0,
                2,
            ),
        },
        "customer_lifetime_value": clv_data,
        "project_profitability": project_profitability,
        "inventory": {
            "low_stock_items": low_stock_items,
            "low_stock_count": len(low_stock_items),
        },
    }

    return Response(analytics_data)


# Email Communication API Views
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_invoice_email(request, invoice_id):
    """
    Send invoice email to customer.
    Implements REQ-204: customer communication automation.
    """
    try:
        invoice = WorkOrderInvoice.objects.get(id=invoice_id)
    except WorkOrderInvoice.DoesNotExist:
        return Response({"error": "Invoice not found"}, status=404)

    # Check permissions - only project owner or assigned user can send emails
    user = request.user
    if not (
        invoice.work_order.project.owner == user
        or invoice.work_order.project.assigned_to == user
    ):
        return Response({"error": "Permission denied"}, status=403)

    success = invoice.send_invoice_email()
    if success:
        return Response({"message": "Invoice email sent successfully"})
    else:
        return Response({"error": "Failed to send email"}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_overdue_reminders(request):
    """
    Send overdue payment reminders to all customers with overdue invoices.
    Implements REQ-204: customer communication automation.
    """
    overdue_invoices = WorkOrderInvoice.objects.filter(
        is_paid=False, due_date__lt=timezone.now().date()
    )

    sent_count = 0
    failed_count = 0

    for invoice in overdue_invoices:
        # Check if user has permission to send reminders for this invoice
        user = request.user
        if (
            invoice.work_order.project.owner == user
            or invoice.work_order.project.assigned_to == user
        ):
            success = invoice.send_overdue_reminder()
            if success:
                sent_count += 1
            else:
                failed_count += 1

    return Response(
        {
            "message": f"Sent {sent_count} reminders, {failed_count} failed",
            "sent": sent_count,
            "failed": failed_count,
        }
    )


# Phase 3: Advanced Analytics API Views
class AnalyticsSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for analytics snapshots.
    Provides historical business metrics for trending analysis.
    """
    queryset = AnalyticsSnapshot.objects.all()
    serializer_class = AnalyticsSnapshotSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["post"])
    def create_snapshot(self, request):
        """Create a new daily analytics snapshot"""
        if not request.user.is_staff:
            return Response(
                {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        snapshot = AnalyticsSnapshot.create_daily_snapshot()
        return Response({"message": "Snapshot created", "id": snapshot.id})

    @action(detail=False, methods=["get"])
    def latest(self, request):
        """Get the latest analytics snapshot"""
        snapshot = self.get_queryset().first()
        if not snapshot:
            return Response({"error": "No snapshots available"}, status=404)

        # Convert to dict for response
        data = {
            "date": snapshot.date,
            "total_revenue": float(snapshot.total_revenue),
            "total_deals": snapshot.total_deals,
            "won_deals": snapshot.won_deals,
            "lost_deals": snapshot.lost_deals,
            "active_projects": snapshot.active_projects,
            "completed_projects": snapshot.completed_projects,
            "total_contacts": snapshot.total_contacts,
            "total_accounts": snapshot.total_accounts,
            "inventory_value": float(snapshot.inventory_value),
            "outstanding_invoices": float(snapshot.outstanding_invoices),
            "overdue_invoices": float(snapshot.overdue_invoices),
        }
        return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_dashboard(request):
    """
    Advanced analytics dashboard with predictive insights.
    Implements REQ-301: Advanced Analytics Dashboard.
    """
    # Get latest snapshot
    latest_snapshot = AnalyticsSnapshot.objects.first()

    # Calculate trends (comparing to 7 days ago)
    week_ago = timezone.now().date() - timezone.timedelta(days=7)
    week_ago_snapshot = AnalyticsSnapshot.objects.filter(date=week_ago).first()

    # Predictive analytics - simple linear regression for revenue forecasting
    start_date = timezone.now().date() - timezone.timedelta(days=30)
    snapshots = AnalyticsSnapshot.objects.filter(date__gte=start_date).order_by('date')
    revenue_trend = []
    for snapshot in snapshots:
        revenue_trend.append({
            'date': snapshot.date,
            'revenue': float(snapshot.total_revenue)
        })

    # Simple forecasting (next 7 days based on average growth)
    if len(revenue_trend) >= 7:
        recent_revenue = [r['revenue'] for r in revenue_trend[-7:]]
        avg_daily_revenue = sum(recent_revenue) / len(recent_revenue)
        forecasted_revenue = avg_daily_revenue * 7  # Next week forecast
    else:
        forecasted_revenue = 0

    # Deal conversion predictions
    total_deals = Deal.objects.count()
    won_deals = Deal.objects.filter(status='won').count()
    conversion_rate = (won_deals / total_deals * 100) if total_deals > 0 else 0

    # Customer lifetime value insights
    high_value_customers = CustomerLifetimeValue.objects.filter(
        predicted_clv__gte=10000
    ).order_by('-predicted_clv')[:5]

    clv_data = [{
        'contact_id': clv.contact.id,
        'contact_name': f"{clv.contact.first_name} {clv.contact.last_name}",
        'predicted_clv': float(clv.predicted_clv),
        'segments': clv.segments
    } for clv in high_value_customers]

    # Deal predictions (placeholder - would use ML model)
    DEAL_PREDICTION_LIMIT = 10  # Limit for performance, configurable constant
    pending_deals = Deal.objects.filter(status='in_progress')
    deal_predictions = []
    for deal in pending_deals[:DEAL_PREDICTION_LIMIT]:
        # Simple prediction based on deal age and value
        deal_age_days = (timezone.now().date() - deal.created_at.date()).days
        confidence = min(0.8, deal_age_days / 90)  # Higher confidence for older deals

        deal_predictions.append({
            'deal_id': deal.id,
            'deal_title': deal.title,
            'predicted_outcome': 'won' if confidence > 0.5 else 'pending',
            'confidence': round(confidence, 2),
            'estimated_close_days': max(0, 60 - deal_age_days)
        })

    # Revenue forecasting
    revenue_forecast = RevenueForecast.objects.filter(
        forecast_date__gte=timezone.now().date()
    ).order_by('forecast_date')[:12]  # Next 12 months

    forecast_data = [{
        'date': f.forecast_date,
        'period': f.forecast_period,
        'predicted_revenue': float(f.predicted_revenue),
        'confidence_lower': float(f.confidence_interval_lower),
        'confidence_upper': float(f.confidence_interval_upper)
    } for f in revenue_forecast]

    dashboard_data = {
        'current_metrics': {
            'total_revenue': float(latest_snapshot.total_revenue) if latest_snapshot else 0,
            'total_deals': latest_snapshot.total_deals if latest_snapshot else 0,
            'won_deals': latest_snapshot.won_deals if latest_snapshot else 0,
            'conversion_rate': round(conversion_rate, 2),
            'active_projects': latest_snapshot.active_projects if latest_snapshot else 0,
            'inventory_value': float(latest_snapshot.inventory_value) if latest_snapshot else 0,
            'outstanding_invoices': float(latest_snapshot.outstanding_invoices) if latest_snapshot else 0,
        },
        'trends': {
            'revenue_change_7d': calculate_percentage_change(
                latest_snapshot.total_revenue if latest_snapshot else 0,
                week_ago_snapshot.total_revenue if week_ago_snapshot else 0
            ),
            'deals_change_7d': calculate_percentage_change(
                latest_snapshot.total_deals if latest_snapshot else 0,
                week_ago_snapshot.total_deals if week_ago_snapshot else 0
            ),
        },
        'predictions': {
            'deal_predictions': deal_predictions,
            'revenue_forecast_next_week': forecasted_revenue,
            'forecast_data': forecast_data,
        },
        'insights': {
            'customer_lifetime_value': clv_data,
            'top_performing_segments': calculate_top_segments(),
            'revenue_trend': revenue_trend[-14:],  # Last 2 weeks
        }
    }

    return Response(dashboard_data)


def calculate_percentage_change(current, previous):
    """Calculate percentage change between two values"""
    if previous == 0:
        return 0 if current == 0 else 100
    return round(((current - previous) / previous) * 100, 2)


def calculate_top_segments():
    """Calculate top performing customer segments"""
    segments = CustomerLifetimeValue.objects.values('segments').annotate(
        count=Count('id'),
        avg_clv=Avg('predicted_clv')
    ).order_by('-avg_clv')[:5]

    return [{
        'segment': ', '.join(seg['segments']),
        'count': seg['count'],
        'avg_clv': float(seg['avg_clv'])
    } for seg in segments]


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def calculate_clv(request, contact_id):
    """
    Calculate and update Customer Lifetime Value for a specific contact.
    """
    try:
        contact = Contact.objects.get(id=contact_id)
    except Contact.DoesNotExist:
        return Response({"error": "Contact not found"}, status=404)

    clv = CustomerLifetimeValue.calculate_for_contact(contact)

    return Response({
        'contact_id': contact.id,
        'predicted_clv': float(clv.predicted_clv),
        'confidence': float(clv.clv_confidence),
        'segments': clv.segments
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def predict_deal_outcome(request, deal_id):
    """
    Generate prediction for deal outcome using analytics.
    """
    try:
        deal = Deal.objects.get(id=deal_id)
    except Deal.DoesNotExist:
        return Response({"error": "Deal not found"}, status=404)

    # Simple prediction algorithm (would be replaced with ML model)
    deal_age_days = (timezone.now().date() - deal.created_at.date()).days
    deal_value_factor = min(1.0, deal.value / 50000)  # Normalize deal value

    # Factors influencing win probability
    factors = {
        'deal_age': deal_age_days,
        'deal_value': deal.value,
        'has_primary_contact': 1 if deal.primary_contact else 0,
        'contact_interactions': Interaction.objects.filter(contact=deal.primary_contact).count() if deal.primary_contact else 0,
    }

    # Simple scoring model
    base_score = 0.3  # Base 30% win rate
    age_bonus = min(0.4, deal_age_days / 180)  # Up to 40% bonus for 6-month old deals
    value_bonus = deal_value_factor * 0.2  # Up to 20% bonus for large deals
    contact_bonus = factors['has_primary_contact'] * 0.1  # 10% bonus for having contact
    interaction_bonus = min(0.1, factors['contact_interactions'] / 10)  # Up to 10% for interactions

    confidence_score = base_score + age_bonus + value_bonus + contact_bonus + interaction_bonus
    confidence_score = min(0.95, max(0.05, confidence_score))  # Clamp between 5% and 95%

    predicted_outcome = 'won' if confidence_score > 0.5 else 'pending'

    # Create or update prediction
    prediction, created = DealPrediction.objects.get_or_create(
        deal=deal,
        defaults={
            'predicted_outcome': predicted_outcome,
            'confidence_score': confidence_score,
            'factors': factors,
        }
    )

    if not created:
        prediction.predicted_outcome = predicted_outcome
        prediction.confidence_score = confidence_score
        prediction.factors = factors
        prediction.save()

    return Response({
        'deal_id': deal.id,
        'predicted_outcome': predicted_outcome,
        'confidence_score': round(confidence_score, 3),
        'factors': factors,
        'estimated_close_days': max(0, 90 - deal_age_days)  # Rough estimate
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_revenue_forecast(request):
    """
    Generate revenue forecast using historical data.
    """
    if not request.user.is_staff:
        return Response({"error": "Permission denied"}, status=403)

    forecast_period = request.data.get('period', 'monthly')
    periods_ahead = int(request.data.get('periods_ahead', 6))

    # Get historical revenue data (last 12 months)
    end_date = timezone.now().date()
    if forecast_period == 'monthly':
        start_date = end_date - timezone.timedelta(days=365)
        snapshots = AnalyticsSnapshot.objects.filter(
            date__range=(start_date, end_date)
        ).order_by('date')
    else:
        # Quarterly or annual - simplified
        snapshots = AnalyticsSnapshot.objects.filter(
            date__gte=end_date - timezone.timedelta(days=730)
        ).order_by('date')

    if not snapshots.exists():
        return Response({"error": "Insufficient historical data"}, status=400)

    # Simple moving average forecasting
    revenue_values = [float(s.total_revenue) for s in snapshots]

    if len(revenue_values) < 3:
        return Response({"error": "Need at least 3 months of data"}, status=400)

    # Calculate growth rate from recent data
    recent_avg = sum(revenue_values[-3:]) / 3
    older_avg = sum(revenue_values[-6:-3]) / 3 if len(revenue_values) >= 6 else recent_avg

    growth_rate = (recent_avg - older_avg) / older_avg if older_avg > 0 else 0

    # Generate forecasts
    forecasts_created = 0
    current_date = end_date

    for i in range(1, periods_ahead + 1):
        if forecast_period == 'monthly':
            forecast_date = current_date + timezone.timedelta(days=30 * i)
        elif forecast_period == 'quarterly':
            forecast_date = current_date + timezone.timedelta(days=90 * i)
        else:  # annual
            forecast_date = current_date + timezone.timedelta(days=365 * i)

        # Apply growth rate with some dampening
        predicted_revenue = recent_avg * (1 + growth_rate * 0.7) ** i

        # Confidence intervals (simplified)
        confidence_lower = predicted_revenue * 0.8
        confidence_upper = predicted_revenue * 1.2

        forecast, created = RevenueForecast.objects.get_or_create(
            forecast_date=forecast_date,
            forecast_period=forecast_period,
            defaults={
                'predicted_revenue': predicted_revenue,
                'confidence_interval_lower': confidence_lower,
                'confidence_interval_upper': confidence_upper,
                'forecast_method': 'moving_average',
                'factors': {
                    'growth_rate': growth_rate,
                    'recent_avg': recent_avg,
                    'periods_analyzed': len(revenue_values)
                }
            }
        )

        if created:
            forecasts_created += 1

    return Response({
        'message': f'Generated {forecasts_created} revenue forecasts',
        'period': forecast_period,
        'periods_ahead': periods_ahead,
        'growth_rate': round(growth_rate, 4)
    })
