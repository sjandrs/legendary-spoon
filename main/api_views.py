from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
import io
from django.http import FileResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from rest_framework.views import APIView
from django.db.models import Count, Sum, Q, F
from django.contrib.auth.models import Group
from rest_framework.permissions import IsAuthenticated
import os
import logging
from django.conf import settings

from .models import (
    Post, CustomUser, Account, Contact, Project, Deal, DealStage, Interaction, Quote,
    Invoice, CustomField, CustomFieldValue, ActivityLog, ProjectTemplate,
    DefaultWorkOrderItem, ProjectType, QuoteItem, InvoiceItem, Interaction, Tag
)
from .serializers import (
    PostSerializer, UserSerializer, AccountSerializer, ContactSerializer, ProjectSerializer,
    ActivityLogSerializer, DealStageSerializer, DealSerializer, InteractionSerializer,
    QuoteSerializer, InvoiceSerializer, CustomFieldSerializer, CustomFieldValueSerializer,
    ContactWithCustomFieldsSerializer, AccountWithCustomFieldsSerializer,
    CustomUserSerializer, SavedSearchSerializer, GlobalSearchIndexSerializer,
    BulkOperationSerializer, SearchResultSerializer, ProjectTemplateSerializer,
    DefaultWorkOrderItemSerializer, ProjectTypeSerializer, QuoteItemSerializer, InvoiceItemSerializer,
    TagSerializer
)

logger = logging.getLogger(__name__)

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all().order_by('name')
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class PostViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows posts to be viewed or edited.
    """
    queryset = Post.objects.filter(status='published').order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [viewsets.ModelViewSet.permission_classes[0]] # IsAuthenticatedOrReadOnly
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categories__slug', 'tags__slug', 'author__username']
    search_fields = ['title', 'content', 'rich_content']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']

class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AccountWithCustomFieldsSerializer
        return AccountSerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name='Sales Manager').exists():
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
            action='create',
            content_object=serializer.instance,
            description=f'Created account: {serializer.instance.name}'
        )
    
    def perform_update(self, serializer):
        serializer.save()
        
        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action='update',
            content_object=serializer.instance,
            description=f'Updated account: {serializer.instance.name}'
        )

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['owner', 'account']
    search_fields = ['first_name', 'last_name', 'email', 'account__name']
    ordering_fields = ['last_name', 'first_name', 'created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
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
            action='create',
            content_object=serializer.instance,
            description=f'Created contact: {serializer.instance.first_name} {serializer.instance.last_name}'
        )
    
    def perform_update(self, serializer):
        serializer.save()
        
        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action='update',
            content_object=serializer.instance,
            description=f'Updated contact: {serializer.instance.first_name} {serializer.instance.last_name}'
        )

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'project_type', 'assigned_to', 'deal', 'account', 'contact']
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'created_at', 'priority']
    ordering = ['due_date']

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name='Sales Manager').exists():
            # Sales managers can see all projects
            return Project.objects.all()
        else:
            # Sales reps can only see their own projects (assigned_to or created_by)
            return Project.objects.filter(Q(assigned_to=user) | Q(created_by=user)).distinct()
    
    def perform_create(self, serializer):
        # Set created_by to current user and save
        instance = serializer.save(created_by=self.request.user)
        
        # If 'assigned_to' is not in the request data, assign it to the creator
        if 'assigned_to' not in self.request.data:
            instance.assigned_to = self.request.user
            instance.save()

        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action='create',
            content_object=instance,
            description=f'Created project: {instance.title}'
        )
    
    def perform_update(self, serializer):
        # Check if project was marked as completed
        old_instance = self.get_object()
        old_status = old_instance.status
        serializer.save()
        
        if old_status != serializer.instance.status:
            if serializer.instance.status == 'completed':
                ActivityLog.objects.create(
                    user=self.request.user,
                    action='complete',
                    content_object=serializer.instance,
                    description=f'Completed project: {serializer.instance.title}'
                )
            else:
                ActivityLog.objects.create(
                    user=self.request.user,
                    action='update',
                    content_object=serializer.instance,
                    description=f'Updated project status to {serializer.instance.get_status_display()}: {serializer.instance.title}'
                )
        else:
            ActivityLog.objects.create(
                user=self.request.user,
                action='update',
                content_object=serializer.instance,
                description=f'Updated project: {serializer.instance.title}'
            )
    
    @action(detail=False, methods=['get'])
    def my_projects(self, request):
        """Get projects assigned to the current user"""
        projects = self.get_queryset().filter(assigned_to=request.user)
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue projects"""
        projects = [project for project in self.get_queryset().all() if project.is_overdue]
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get projects due in the next 7 days"""
        from datetime import date, timedelta
        upcoming_date = date.today() + timedelta(days=7)
        projects = self.get_queryset().filter(
            due_date__lte=upcoming_date,
            due_date__gte=date.today(),
            status__in=['pending', 'in_progress']
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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DealFilter  # Use the custom filter class
    search_fields = ['name', 'description', 'account__name']
    ordering_fields = ['name', 'value', 'expected_close_date']
    ordering = ['-expected_close_date']

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name='Sales Manager').exists():
            # Sales managers can see all deals
            return Deal.objects.all()
        else:
            # Sales reps can only see their own deals
            return Deal.objects.filter(owner=user)

    @action(detail=True, methods=['post'])
    def update_stage(self, request, pk=None):
        deal = self.get_object()
        stage_id = request.data.get('stage_id')
        try:
            new_stage = DealStage.objects.get(id=stage_id)
            deal.stage = new_stage
            deal.save()
            return Response(self.get_serializer(deal).data)
        except DealStage.DoesNotExist:
            return Response({'error': 'Stage not found'}, status=status.HTTP_404_NOT_FOUND)

class InteractionViewSet(viewsets.ModelViewSet):
    queryset = Interaction.objects.all().order_by('-interaction_date')
    serializer_class = InteractionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['contact', 'account']

class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer

    @action(detail=True, methods=['get'])
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
            p.drawString(120, y, f"- {item.description}: {item.quantity} x ${item.unit_price}")
            y -= 15

        total = sum(item.quantity * item.unit_price for item in quote.items.all())
        p.drawString(100, y - 20, f"Total: ${total}")

        p.showPage()
        p.save()
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename=f'quote_{quote.id}.pdf')

class QuoteItemViewSet(viewsets.ModelViewSet):
    queryset = QuoteItem.objects.all()
    serializer_class = QuoteItemSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

    @action(detail=True, methods=['get'])
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
            p.drawString(120, y, f"- {item.description}: {item.quantity} x ${item.unit_price}")
            y -= 15

        total = sum(item.quantity * item.unit_price for item in invoice.items.all())
        p.drawString(100, y - 20, f"Total: ${total}")

        p.showPage()
        p.save()
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename=f'invoice_{invoice.id}.pdf')

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
        deals_by_stage = list(Deal.objects.values('stage__id', 'stage__name').annotate(count=Count('id')).order_by('stage__name'))

        # Data for Sales Performance Doughnut Chart - More explicit queries
        won_count = Deal.objects.filter(status='won').count()
        lost_count = Deal.objects.filter(status='lost').count()
        in_progress_count = Deal.objects.filter(status='in_progress').count()

        status_counts = {
            'won': won_count,
            'lost': lost_count,
            'in_progress': in_progress_count,
        }

        # Fetch recent interactions
        recent_activities = Interaction.objects.select_related('contact').order_by('-interaction_date')[:5]
        recent_activities_data = InteractionSerializer(recent_activities, many=True).data

        data = {
            'deals_by_stage': deals_by_stage,
            'sales_performance': status_counts,
            'recent_activities': recent_activities_data,
        }
        return Response(data)


class UserRoleManagementView(APIView):
    """
    Allows administrators to manage user roles.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only allow sales managers to view/manage roles
        if not request.user.groups.filter(name='Sales Manager').exists():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        users = CustomUser.objects.all()
        groups = Group.objects.filter(name__in=['Sales Rep', 'Sales Manager'])
        
        user_data = []
        for user in users:
            user_groups = user.groups.filter(name__in=['Sales Rep', 'Sales Manager'])
            user_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'groups': [g.name for g in user_groups]
            })
        
        return Response({
            'users': user_data,
            'available_groups': [{'id': g.id, 'name': g.name} for g in groups]
        })

    def post(self, request):
        # Only allow sales managers to assign roles
        if not request.user.groups.filter(name='Sales Manager').exists():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        user_id = request.data.get('user_id')
        group_name = request.data.get('group_name')
        action = request.data.get('action', 'add')  # 'add' or 'remove'
        
        try:
            user = CustomUser.objects.get(id=user_id)
            group = Group.objects.get(name=group_name)
            
            if action == 'add':
                user.groups.add(group)
            elif action == 'remove':
                user.groups.remove(group)
            
            return Response({'success': True})
        except (CustomUser.DoesNotExist, Group.DoesNotExist):
            return Response({'error': 'User or group not found'}, status=status.HTTP_404_NOT_FOUND)


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API endpoint for activity logs.
    Provides timeline of all user actions in the system.
    """
    serializer_class = ActivityLogSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['user', 'action', 'resource_type']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        """Return activity logs for the current user or all logs for managers"""
        if self.request.user.groups.filter(name__in=['Sales Manager', 'Admin']).exists():
            return ActivityLog.objects.all()
        else:
            return ActivityLog.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent activity (last 50 items)"""
        logs = self.get_queryset()[:50]
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_resource(self, request):
        """Get activity logs for a specific resource"""
        resource_type = request.query_params.get('resource_type')
        resource_id = request.query_params.get('resource_id')
        
        if not resource_type or not resource_id:
            return Response({'error': 'resource_type and resource_id are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        logs = self.get_queryset().filter(
            resource_type=resource_type,
            resource_id=resource_id
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
        kb_dir = os.path.join(settings.STATICFILES_DIRS[0], 'kb')
        try:
            files = [f for f in os.listdir(kb_dir) if f.endswith('.md')]
            articles = [os.path.splitext(f)[0] for f in files]
            return Response(articles)
        except FileNotFoundError:
            return Response({"error": "Knowledge base directory not found."}, status=404)


class MarkdownFileView(APIView):
    """
    A view to return the content of a markdown file from the kb folder.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, file_name):
        # Construct the full path to the markdown file inside the static/kb directory
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Go up two levels from main/api_views.py to the project root
        file_path = os.path.join(base_dir, 'static', 'kb', f"{file_name}.md")

        if not os.path.exists(file_path):
            return Response({"error": f"File not found at {file_path}"}, status=status.HTTP_404_NOT_FOUND)

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return Response({"content": content})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProjectTemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing Project Templates.
    Allows creating, viewing, updating, and deleting templates.
    Superusers have full access.
    """
    queryset = ProjectTemplate.objects.all()
    serializer_class = ProjectTemplateSerializer
    permission_classes = [IsAuthenticated] # Further checks can be done in methods

    def get_queryset(self):
        # Allow any authenticated user to view templates
        return ProjectTemplate.objects.all().order_by('name')

    def perform_create(self, serializer):
        # Only superusers can create templates
        if not self.request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to create task templates.")
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        # Only superusers can update templates
        if not self.request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to update task templates.")
        serializer.save()

    def perform_destroy(self, instance):
        # Only superusers can delete templates
        if not self.request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to delete task templates.")
        instance.delete()

    @action(detail=True, methods=['post'])
    def create_project_from_template(self, request, pk=None):
        """
        Creates a new Project instance based on this template.
        Expects 'contact_id' in the request data.
        """
        template = self.get_object()
        contact_id = request.data.get('contact_id')

        if not contact_id:
            return Response({'error': 'contact_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            contact = Contact.objects.get(id=contact_id)
        except Contact.DoesNotExist:
            return Response({'error': 'Contact not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Create the new project
        new_project = Project.objects.create(
            title=template.default_title,
            description=template.default_description,
            project_type=template.default_project_type,
            priority=template.default_priority,
            due_date=request.data.get('due_date'),
            contact=contact,
            account=contact.account,
            created_by=request.user,
            # ... other fields as needed
        )

        return Response(ProjectSerializer(new_project).data, status=status.HTTP_201_CREATED)

class DefaultWorkOrderItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows default work order items to be viewed or edited.
    """
    queryset = DefaultWorkOrderItem.objects.all()
    serializer_class = DefaultWorkOrderItemSerializer
    permission_classes = [viewsets.ModelViewSet.permission_classes[0]] # IsAuthenticatedOrReadOnly
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project_template__name', 'description', 'owner__username']
    search_fields = ['description']
    ordering_fields = ['created_at', 'updated_at', 'description']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        # Automatically set the owner to the current user
        serializer.save(owner=self.request.user)
        
        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action='create',
            content_object=serializer.instance,
            description=f'Created default work order item: {serializer.instance.description}'
        )
    
    def perform_update(self, serializer):
        serializer.save()
        
        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action='update',
            content_object=serializer.instance,
            description=f'Updated default work order item: {serializer.instance.description}'
        )

class ProjectTypeViewSet(viewsets.ModelViewSet):
    queryset = ProjectType.objects.all().order_by('name')
    serializer_class = ProjectTypeSerializer
    permission_classes = [permissions.IsAdminUser]

class GlobalSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        query = request.query_params.get('q', '')
        if not query:
            return Response([])

        # Split the query into individual terms
        query_terms = query.split()
        
        # Initialize an empty list to collect results
        results = []

        # Search in Posts
        post_results = Post.objects.filter(
            Q(title__icontains=query) | Q(content__icontains=query) | Q(rich_content__icontains=query)
        ).distinct()[:5]  # Limit to 5 results for performance

        for post in post_results:
            results.append({
                'type': 'post',
                'id': post.id,
                'title': post.title,
                'url': f"/api/posts/{post.id}/",
                'snippet': post.content[:75] + '...' if post.content else ''
            })

        # Search in Accounts
        account_results = Account.objects.filter(
            Q(name__icontains=query) | Q(email__icontains=query) | Q(phone__icontains=query)
        ).distinct()[:5]

        for account in account_results:
            results.append({
                'type': 'account',
                'id': account.id,
                'name': account.name,
                'url': f"/api/accounts/{account.id}/",
                'snippet': account.description[:75] + '...' if account.description else ''
            })

        # Search in Contacts
        contact_results = Contact.objects.filter(
            Q(first_name__icontains=query) | Q(last_name__icontains=query) | Q(email__icontains=query)
        ).distinct()[:5]

        for contact in contact_results:
            results.append({
                'type': 'contact',
                'id': contact.id,
                'name': f"{contact.first_name} {contact.last_name}",
                'url': f"/api/contacts/{contact.id}/",
                'snippet': contact.notes[:75] + '...' if contact.notes else ''
            })

        # Search in Tasks
        task_results = Project.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query)
        ).distinct()[:5]

        for task in task_results:
            results.append({
                'type': 'project',
                'id': task.id,
                'title': task.title,
                'url': f"/api/projects/{task.id}/",  # Ensure this matches your router's registered endpoint for ProjectViewSet
                'snippet': task.description[:75] + '...' if task.description else ''
            })

        # Search in Deals
        deal_results = Deal.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        ).distinct()[:5]

        for deal in deal_results:
            results.append({
                'type': 'deal',
                'id': deal.id,
                'name': deal.name,
                'url': f"/api/deals/{deal.id}/",
                'snippet': deal.description[:75] + '...' if deal.description else ''
            })

        # Search in Notes (Markdown files)
        from django.conf import settings
        import os

        kb_base_path = os.path.join(settings.BASE_DIR, 'static', 'kb')
        note_file_results = []
        if os.path.exists(kb_base_path):
            for file_name in os.listdir(kb_base_path):
                if file_name.endswith('.md'):
                    file_path = os.path.join(kb_base_path, file_name)
                    with open(file_path, 'r', encoding='utf-8') as file:
                        file_content = file.read()
                        if query.lower() in file_content.lower():
                            note_file_results.append({
                                'file_name': file_name,
                                'url': f"/api/knowledge_base/{file_name.replace('.md', '')}/",
                                'snippet': file_content[:75] + '...'
                            })

        results.extend([{
            'type': 'note',
            'file_name': note['file_name'],
            'url': note['url'],
            'snippet': note['snippet']
        } for note in note_file_results])

        # Limit total results to 20 for performance
        return Response(results[:20])
