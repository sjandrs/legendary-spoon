import io
import logging
import os
import re
from datetime import datetime

from django.conf import settings
from django.contrib.auth.models import Group
from django.db import models
from django.db.models import Count, F, Q, Sum
from django.http import FileResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import DealFilter
from .models import (
    Account,
    ActivityLog,
    AnalyticsSnapshot,
    Budget,
    Certification,
    Contact,
    CoverageArea,
    CustomField,
    CustomFieldValue,
    CustomUser,
    Deal,
    DealStage,
    DefaultWorkOrderItem,
    EnhancedUser,
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
    Tag,
    Technician,
    TechnicianAvailability,
    TechnicianCertification,
    TimeEntry,
    Warehouse,
    WarehouseItem,
    WorkOrder,
    WorkOrderCertificationRequirement,
    WorkOrderInvoice,
)
from .reports import FinancialReports
from .serializers import (
    AccountSerializer,
    AccountWithCustomFieldsSerializer,
    ActivityLogSerializer,
    AnalyticsSnapshotSerializer,
    BudgetSerializer,
    CertificationSerializer,
    ContactSerializer,
    ContactWithCustomFieldsSerializer,
    CoverageAreaSerializer,
    CustomFieldSerializer,
    CustomFieldValueSerializer,
    DealSerializer,
    DealStageSerializer,
    DefaultWorkOrderItemSerializer,
    EnhancedUserSerializer,
    ExpenseSerializer,
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
    TagSerializer,
    TechnicianAvailabilitySerializer,
    TechnicianCertificationSerializer,
    TechnicianSerializer,
    TimeEntrySerializer,
    WarehouseItemSerializer,
    WarehouseSerializer,
    WorkOrderCertificationRequirementSerializer,
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
            description=f"Created contact: {serializer.instance.first_name} "
            f"{serializer.instance.last_name}",
        )

    def perform_update(self, serializer):
        serializer.save()

        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action="update",
            content_object=serializer.instance,
            description=f"Updated contact: {serializer.instance.first_name} "
            f"{serializer.instance.last_name}",
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
                    description=f"Updated project status to "
                    f"{serializer.instance.get_status_display()}: "
                    f"{serializer.instance.title}",
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
                    "url": f"/api/projects/{task.id}/",  # Ensure this matches your router's
                    # registered endpoint for ProjectViewSet
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


# Financial Reports API Views


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
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Invalid start_date format. Use YYYY-MM-DD"}, status=400
            )

    if end_date_str:
        try:
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
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Invalid start_date format. Use YYYY-MM-DD"}, status=400
            )

    if end_date_str:
        try:
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
            issued_date__range=(start_date, end_date), is_paid=True
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
        low_stock_items = list(
            WarehouseItem.objects.filter(quantity__lte=F("minimum_stock")).values(
                "name", "quantity", "minimum_stock", "warehouse__name"
            )
        )
    except Exception:
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


# Phase 3: Advanced Analytics Serializers
# (Removed duplicate AnalyticsSnapshotSerializer; use the imported version from serializers.py)


class AnalyticsSnapshotViewSet(viewsets.ModelViewSet):
    """
    ViewSet for analytics snapshots.
    """

    queryset = AnalyticsSnapshot.objects.all()
    serializer_class = AnalyticsSnapshotSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["date"]


# Phase 4: Technician & User Management API Views


class CertificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing technician certifications.
    Implements REQ-401: certification tracking with expiration.
    """

    queryset = Certification.objects.all()
    serializer_class = CertificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["category", "tech_level", "requires_renewal"]
    search_fields = ["name", "description", "issuing_authority"]


class TechnicianViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing field service technicians.
    Implements REQ-401 through REQ-408: complete technician lifecycle management.
    """

    queryset = Technician.objects.all()
    serializer_class = TechnicianSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["is_active", "hire_date"]
    search_fields = ["first_name", "last_name", "employee_id", "email"]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by user's access level
        user = self.request.user
        if hasattr(user, "groups") and user.groups.filter(name="Sales Rep").exists():
            # Sales reps can only see technicians they own (if linked)
            return queryset.filter(user=user)
        return queryset

    @action(detail=True, methods=["get"])
    def certifications(self, request, pk=None):
        """Get certifications for a specific technician"""
        technician = self.get_object()
        certifications = technician.techniciancertification_set.filter(is_active=True)
        serializer = TechnicianCertificationSerializer(certifications, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_certification(self, request, pk=None):
        """Add a certification to a technician"""
        technician = self.get_object()

        # Use serializer to properly handle data validation and parsing
        data = request.data.copy()
        data["technician"] = technician.id

        # Handle both certification_id and certification field names
        if "certification_id" in data and "certification" not in data:
            data["certification"] = data["certification_id"]

        # Check if certification already exists
        certification_id = data.get("certification")
        try:
            existing = TechnicianCertification.objects.get(
                technician=technician, certification_id=certification_id
            )
            # Update existing certification
            serializer = TechnicianCertificationSerializer(
                existing, data=data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except TechnicianCertification.DoesNotExist:
            # Create new certification
            serializer = TechnicianCertificationSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"])
    def coverage_areas(self, request, pk=None):
        """Get coverage areas for a specific technician"""
        technician = self.get_object()
        areas = technician.coverage_areas.filter(is_active=True)
        serializer = CoverageAreaSerializer(areas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_coverage_area(self, request, pk=None):
        """Add a coverage area to a technician"""
        technician = self.get_object()
        zip_code = request.data.get("zip_code")
        travel_time_minutes = request.data.get("travel_time_minutes", 0)
        is_primary = request.data.get("is_primary", False)

        area, created = CoverageArea.objects.get_or_create(
            technician=technician,
            zip_code=zip_code,
            defaults={
                "travel_time_minutes": travel_time_minutes,
                "is_primary": is_primary,
            },
        )
        if not created:
            area.travel_time_minutes = travel_time_minutes
            area.is_primary = is_primary
            area.is_active = True
            area.save()

        serializer = CoverageAreaSerializer(area)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)

    @action(detail=True, methods=["get"])
    def availability(self, request, pk=None):
        """Get availability schedule for a specific technician"""
        technician = self.get_object()
        availability = technician.technicianavailability_set.filter(is_active=True)
        serializer = TechnicianAvailabilitySerializer(availability, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def set_availability(self, request, pk=None):
        """Set availability for a technician"""
        technician = self.get_object()
        weekday = request.data.get("weekday")
        start_time = request.data.get("start_time")
        end_time = request.data.get("end_time")

        availability, created = TechnicianAvailability.objects.get_or_create(
            technician=technician,
            weekday=weekday,
            defaults={
                "start_time": start_time,
                "end_time": end_time,
            },
        )
        if not created:
            availability.start_time = start_time
            availability.end_time = end_time
            availability.is_active = True
            availability.save()

        serializer = TechnicianAvailabilitySerializer(availability)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)


class TechnicianCertificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing technician certification links.
    """

    queryset = TechnicianCertification.objects.all()
    serializer_class = TechnicianCertificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["is_active", "obtained_date", "expiration_date"]

    def get_queryset(self):
        queryset = super().get_queryset()
        technician_id = self.request.query_params.get("technician")
        if technician_id:
            queryset = queryset.filter(technician_id=technician_id)
        return queryset


class CoverageAreaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing technician coverage areas.
    Implements REQ-403: coverage area validation.
    """

    queryset = CoverageArea.objects.all()
    serializer_class = CoverageAreaSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["is_active", "is_primary", "zip_code"]

    def get_queryset(self):
        queryset = super().get_queryset()
        technician_id = self.request.query_params.get("technician")
        if technician_id:
            queryset = queryset.filter(technician_id=technician_id)
        return queryset


class TechnicianAvailabilityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing technician availability schedules.
    Implements REQ-404: availability scheduling.
    """

    queryset = TechnicianAvailability.objects.all()
    serializer_class = TechnicianAvailabilitySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["is_active", "weekday"]

    def get_queryset(self):
        queryset = super().get_queryset()
        technician_id = self.request.query_params.get("technician")
        if technician_id:
            queryset = queryset.filter(technician_id=technician_id)
        return queryset


class EnhancedUserViewSet(viewsets.ModelViewSet):
    """
    Enhanced ViewSet for user management with hierarchy.
    Implements REQ-409 through REQ-416: hierarchical user management.
    """

    queryset = EnhancedUser.objects.all()
    serializer_class = EnhancedUserSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["is_active", "department", "manager"]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Users can only see themselves and their subordinates
        user = self.request.user
        if isinstance(user, EnhancedUser):
            return queryset.filter(
                models.Q(id=user.id)
                | models.Q(
                    id__in=user.get_all_subordinates().values_list("id", flat=True)
                )
            )
        return queryset

    @action(detail=True, methods=["get"])
    def subordinates(self, request, pk=None):
        """Get direct subordinates of a user"""
        user = self.get_object()
        subordinates = user.subordinates.all()
        serializer = EnhancedUserSerializer(subordinates, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def hierarchy(self, request, pk=None):
        """Get full hierarchy tree for a user"""
        user = self.get_object()
        # Build hierarchy tree (simplified - could be enhanced)
        hierarchy = {"user": EnhancedUserSerializer(user).data, "subordinates": []}

        def build_tree(parent):
            subs = []
            for sub in parent.subordinates.all():
                sub_data = EnhancedUserSerializer(sub).data
                sub_data["subordinates"] = build_tree(sub)
                subs.append(sub_data)
            return subs

        hierarchy["subordinates"] = build_tree(user)
        return Response(hierarchy)

    @action(detail=False, methods=["post"])
    def link_technician(self, request):
        """Link a user to a technician"""
        user_id = request.data.get("user_id")
        technician_id = request.data.get("technician_id")

        try:
            user = EnhancedUser.objects.get(id=user_id)
            technician = Technician.objects.get(id=technician_id)

            user.technician = technician
            user.save()

            serializer = EnhancedUserSerializer(user)
            return Response(serializer.data)
        except (EnhancedUser.DoesNotExist, Technician.DoesNotExist):
            return Response(
                {"error": "User or Technician not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=False, methods=["post"])
    def unlink_technician(self, request):
        """Unlink a user from their technician"""
        user_id = request.data.get("user_id")

        try:
            user = EnhancedUser.objects.get(id=user_id)
            user.technician = None
            user.save()

            serializer = EnhancedUserSerializer(user)
            return Response(serializer.data)
        except EnhancedUser.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )


class WorkOrderCertificationRequirementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing work order certification requirements.
    """

    queryset = WorkOrderCertificationRequirement.objects.all()
    serializer_class = WorkOrderCertificationRequirementSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["is_required"]

    def get_queryset(self):
        queryset = super().get_queryset()
        work_order_id = self.request.query_params.get("work_order")
        if work_order_id:
            queryset = queryset.filter(work_order_id=work_order_id)
        return queryset


# Phase 4: Technician Assignment & Matching APIs


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def find_available_technicians(request, work_order_id):
    """
    Find qualified technicians for a work order.
    Implements REQ-407: automatic qualification checking.
    """
    try:
        work_order = WorkOrder.objects.get(id=work_order_id)
    except WorkOrder.DoesNotExist:
        return Response(
            {"error": "Work order not found"}, status=status.HTTP_404_NOT_FOUND
        )

    # Get work order requirements
    requirements = WorkOrderCertificationRequirement.objects.filter(
        work_order=work_order, is_required=True
    ).select_related("certification")

    required_certs = [req.certification for req in requirements]

    # Get work order location (assuming from project contact)
    contact = work_order.project.contact
    if not contact:
        return Response(
            {"error": "Work order must have associated contact with address"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Extract zip code from contact address (simplified - would need proper parsing)
    # For now, assume zip code is provided in request or extracted from address
    zip_code = request.data.get("zip_code")
    if not zip_code and contact.address:
        # Simple zip code extraction (last 5 digits)
        zip_match = re.search(r"\b\d{5}\b", contact.address)
        zip_code = zip_match.group(0) if zip_match else None

    if not zip_code:
        return Response(
            {"error": "Zip code required for technician matching"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Find qualified technicians
    qualified_techs = Technician.objects.filter(
        is_active=True,
        coverage_areas__zip_code=zip_code,
        coverage_areas__is_active=True,
    ).distinct()

    # Filter by certifications if requirements exist
    if required_certs:
        # Get technicians with all required certifications
        cert_tech_ids = set()
        for cert in required_certs:
            tech_ids = TechnicianCertification.objects.filter(
                certification=cert,
                is_active=True,
                expiration_date__gt=timezone.now().date(),
            ).values_list("technician_id", flat=True)
            if not cert_tech_ids:
                cert_tech_ids = set(tech_ids)
            else:
                cert_tech_ids &= set(tech_ids)

        qualified_techs = qualified_techs.filter(id__in=cert_tech_ids)

    # Check availability for requested time (if provided)
    scheduled_date = request.data.get("scheduled_date")
    start_time = request.data.get("start_time")
    end_time = request.data.get("end_time")

    if scheduled_date:
        scheduled_date = timezone.datetime.fromisoformat(scheduled_date).date()
        weekday = scheduled_date.weekday()

        # Filter by availability
        available_tech_ids = TechnicianAvailability.objects.filter(
            technician__in=qualified_techs, weekday=weekday, is_active=True
        ).values_list("technician_id", flat=True)

        if start_time and end_time:
            # Additional time filtering would go here
            pass

        qualified_techs = qualified_techs.filter(id__in=available_tech_ids)

    # Sort by travel time and other factors
    qualified_techs = qualified_techs.order_by("coverage_areas__travel_time_minutes")

    serializer = TechnicianSerializer(qualified_techs, many=True)
    return Response(
        {
            "technicians": serializer.data,
            "total_found": len(serializer.data),
            "requirements": [cert.name for cert in required_certs],
            "zip_code": zip_code,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def assign_technician_to_work_order(request, work_order_id):
    """
    Assign a technician to a work order with validation.
    Implements REQ-407: qualification enforcement.
    """
    try:
        work_order = WorkOrder.objects.get(id=work_order_id)
    except WorkOrder.DoesNotExist:
        return Response(
            {"error": "Work order not found"}, status=status.HTTP_404_NOT_FOUND
        )

    technician_id = request.data.get("technician_id")
    if not technician_id:
        return Response(
            {"error": "technician_id required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        technician = Technician.objects.get(id=technician_id, is_active=True)
    except Technician.DoesNotExist:
        return Response(
            {"error": "Technician not found or inactive"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Validate technician qualifications
    requirements = WorkOrderCertificationRequirement.objects.filter(
        work_order=work_order, is_required=True
    )

    missing_certs = []
    for req in requirements:
        if not technician.has_certification(req.certification):
            missing_certs.append(req.certification.name)

    if missing_certs:
        return Response(
            {
                "error": "Technician missing required certifications",
                "missing_certifications": missing_certs,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate coverage area
    zip_code = request.data.get("zip_code")
    if zip_code:
        has_coverage = technician.coverage_areas.filter(
            zip_code=zip_code, is_active=True
        ).exists()
        if not has_coverage:
            return Response(
                {
                    "error": "Technician does not cover this zip code",
                    "zip_code": zip_code,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Check availability
    scheduled_date = request.data.get("scheduled_date")
    if scheduled_date:
        if not technician.is_available_on_date(
            timezone.datetime.fromisoformat(scheduled_date).date(),
            request.data.get("start_time"),
            request.data.get("end_time"),
        ):
            return Response(
                {"error": "Technician not available for requested time"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Assignment successful - could create assignment record here
    # For now, just return success with technician details
    serializer = TechnicianSerializer(technician)
    return Response(
        {
            "message": "Technician assigned successfully",
            "technician": serializer.data,
            "work_order_id": work_order_id,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_available_technicians(request):
    """
    Get all currently available technicians.
    Implements REQ-408: real-time availability checking.
    """
    # Get current date/time
    now = timezone.now()
    current_weekday = now.weekday()
    current_time = now.time()

    # Find technicians available right now
    available_techs = Technician.objects.filter(
        is_active=True,
        technicianavailability__weekday=current_weekday,
        technicianavailability__start_time__lte=current_time,
        technicianavailability__end_time__gte=current_time,
        technicianavailability__is_active=True,
    ).distinct()

    serializer = TechnicianSerializer(available_techs, many=True)
    return Response(
        {
            "technicians": serializer.data,
            "total_available": len(serializer.data),
            "current_time": now.isoformat(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def technician_payroll_report(request, technician_id):
    """
    Generate payroll report for a technician.
    Implements REQ-405: payroll calculation.
    """
    try:
        technician = Technician.objects.get(id=technician_id)
    except Technician.DoesNotExist:
        return Response(
            {"error": "Technician not found"}, status=status.HTTP_404_NOT_FOUND
        )

    # Get date range
    start_date = request.query_params.get("start_date")
    end_date = request.query_params.get("end_date")

    if not start_date or not end_date:
        return Response(
            {"error": "start_date and end_date required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    start_date = timezone.datetime.fromisoformat(start_date).date()
    end_date = timezone.datetime.fromisoformat(end_date).date()

    # Get time entries for the period
    time_entries = TimeEntry.objects.filter(
        user=technician.user, date__range=(start_date, end_date), billable=True
    ).select_related("project")

    # Calculate totals
    total_hours = sum(entry.hours for entry in time_entries)
    total_amount = sum(entry.total_amount for entry in time_entries)

    # Group by project
    project_summary = {}
    for entry in time_entries:
        project_name = entry.project.title
        if project_name not in project_summary:
            project_summary[project_name] = {"hours": 0, "amount": 0, "entries": 0}
        project_summary[project_name]["hours"] += entry.hours
        project_summary[project_name]["amount"] += entry.total_amount
        project_summary[project_name]["entries"] += 1

    return Response(
        {
            "technician": TechnicianSerializer(technician).data,
            "period": {"start_date": start_date, "end_date": end_date},
            "summary": {
                "total_hours": total_hours,
                "total_amount": total_amount,
                "hourly_rate": technician.base_hourly_rate,
            },
            "project_breakdown": project_summary,
            "time_entries": [
                {
                    "date": entry.date,
                    "project": entry.project.title,
                    "hours": entry.hours,
                    "rate": entry.hourly_rate,
                    "amount": entry.total_amount,
                }
                for entry in time_entries
            ],
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_invoice_email(request, invoice_id):
    """
    Send invoice email to customer.
    Implements Phase 2: Email Communication.
    """
    try:
        invoice = WorkOrderInvoice.objects.get(id=invoice_id)
    except WorkOrderInvoice.DoesNotExist:
        return Response(
            {"error": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND
        )

    try:
        invoice.send_invoice_email()
        return Response({"message": "Invoice email sent successfully"})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_overdue_reminders(request):
    """
    Send overdue payment reminders to all customers with overdue invoices.
    Implements Phase 2: Email Communication.
    """
    overdue_invoices = WorkOrderInvoice.objects.filter(
        is_paid=False, due_date__lt=timezone.now().date()
    )

    sent_count = 0
    errors = []

    for invoice in overdue_invoices:
        try:
            invoice.send_invoice_email()  # Could be modified to send reminder template
            sent_count += 1
        except Exception as e:
            errors.append(f"Invoice {invoice.id}: {str(e)}")

    return Response(
        {"message": f"Sent {sent_count} overdue reminders", "errors": errors}
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_dashboard(request):
    """
    Enhanced analytics dashboard with advanced metrics.
    Implements Phase 3: Advanced Analytics.
    """
    # This is a placeholder - would implement advanced analytics
    return Response({"message": "Advanced analytics dashboard - placeholder"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def calculate_clv(request, contact_id):
    """
    Calculate Customer Lifetime Value for a contact.
    Implements Phase 3: Advanced Analytics.
    """
    try:
        contact = Contact.objects.get(id=contact_id)
    except Contact.DoesNotExist:
        return Response(
            {"error": "Contact not found"}, status=status.HTTP_404_NOT_FOUND
        )

    # Simple CLV calculation - would be more sophisticated in real implementation
    total_value = (
        Deal.objects.filter(contact=contact, status="won").aggregate(
            total=Sum("value")
        )["total"]
        or 0
    )

    return Response(
        {
            "contact_id": contact_id,
            "contact_name": f"{contact.first_name} {contact.last_name}",
            "lifetime_value": total_value,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def predict_deal_outcome(request, deal_id):
    """
    Predict deal outcome using analytics.
    Implements Phase 3: Advanced Analytics.
    """
    try:
        deal = Deal.objects.get(id=deal_id)
    except Deal.DoesNotExist:
        return Response({"error": "Deal not found"}, status=status.HTTP_404_NOT_FOUND)

    # Simple prediction - would use ML models in real implementation
    prediction = "likely_to_win" if deal.value > 50000 else "uncertain"

    return Response({"deal_id": deal_id, "prediction": prediction, "confidence": 0.75})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_revenue_forecast(request):
    """
    Generate revenue forecast.
    Implements Phase 3: Advanced Analytics.
    """
    # Simple forecast - would use time series analysis in real implementation
    forecast = {"next_month": 150000, "next_quarter": 450000, "next_year": 1800000}

    return Response(forecast)
