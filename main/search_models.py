from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone
import json

User = get_user_model()

class SavedSearch(models.Model):
    """Model to store user's saved searches and filters"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_searches')
    search_type = models.CharField(max_length=50, choices=[
        ('global', 'Global Search'),
        ('accounts', 'Accounts'),
        ('contacts', 'Contacts'),
        ('tasks', 'Tasks'),
        ('deals', 'Deals'),
        ('quotes', 'Quotes'),
        ('invoices', 'Invoices'),
    ])
    
    # Search parameters stored as JSON
    search_query = models.TextField(blank=True, help_text="Main search query")
    filters = models.JSONField(default=dict, help_text="Filter parameters as JSON")
    sort_by = models.CharField(max_length=50, blank=True)
    sort_order = models.CharField(max_length=4, choices=[('asc', 'Ascending'), ('desc', 'Descending')], default='desc')
    
    # Metadata
    is_public = models.BooleanField(default=False, help_text="Make this search available to all users")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used = models.DateTimeField(null=True, blank=True)
    use_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-last_used', '-created_at']
        unique_together = ['user', 'name', 'search_type']

    def __str__(self):
        return f"{self.name} ({self.get_search_type_display()})"

    def get_filters_dict(self):
        """Get filters as Python dict"""
        if isinstance(self.filters, str):
            return json.loads(self.filters)
        return self.filters

    def increment_usage(self):
        """Increment usage count and update last used timestamp"""
        from django.utils import timezone
        self.use_count += 1
        self.last_used = timezone.now()
        self.save(update_fields=['use_count', 'last_used'])


class GlobalSearchIndex(models.Model):
    """Full-text search index for global search across all entities"""
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Search fields
    title = models.CharField(max_length=200, db_index=True)
    content = models.TextField()
    tags = models.TextField(blank=True, help_text="Space-separated searchable tags")
    
    # Metadata
    entity_type = models.CharField(max_length=50, db_index=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Search ranking
    search_vector = models.TextField(blank=True, help_text="Generated search vector for full-text search")
    boost_score = models.FloatField(default=1.0, help_text="Boost score for search ranking")

    class Meta:
        indexes = [
            models.Index(fields=['entity_type', 'owner']),
            models.Index(fields=['created_at']),
            models.Index(fields=['title']),
        ]
        unique_together = ['content_type', 'object_id']

    def __str__(self):
        return f"{self.entity_type}: {self.title}"

    @classmethod
    def update_or_create_for_object(cls, obj, title=None, content=None, tags=None):
        """Update or create search index entry for an object"""
        from django.utils import timezone
        
        content_type = ContentType.objects.get_for_model(obj)
        
        # Generate title if not provided
        if not title:
            title = str(obj)
        
        # Generate content if not provided
        if not content:
            content = cls._extract_searchable_content(obj)
        
        # Generate tags if not provided
        if not tags:
            tags = cls._extract_tags(obj)
        
        # Get owner
        owner = getattr(obj, 'owner', None) or getattr(obj, 'user', None) or getattr(obj, 'created_by', None)
        
        index, created = cls.objects.update_or_create(
            content_type=content_type,
            object_id=obj.pk,
            defaults={
                'title': title[:200],  # Truncate to field limit
                'content': content,
                'tags': tags,
                'entity_type': obj.__class__.__name__.lower(),
                'owner': owner,
                'updated_at': timezone.now(),
                'search_vector': cls._generate_search_vector(title, content, tags),
            }
        )
        return index

    @classmethod
    def _extract_searchable_content(cls, obj):
        """Extract searchable content from an object"""
        content_parts = []
        
        # Common fields to search
        searchable_fields = ['name', 'title', 'description', 'content', 'notes', 
                           'first_name', 'last_name', 'email', 'phone', 'company']
        
        for field in searchable_fields:
            if hasattr(obj, field):
                value = getattr(obj, field)
                if value:
                    content_parts.append(str(value))
        
        return ' '.join(content_parts)

    @classmethod
    def _extract_tags(cls, obj):
        """Extract tags from an object"""
        tags = []
        
        # Add model type
        tags.append(obj.__class__.__name__.lower())
        
        # Add status if available
        if hasattr(obj, 'status'):
            tags.append(str(obj.status))
        
        # Add priority if available
        if hasattr(obj, 'priority'):
            tags.append(str(obj.priority))
        
        # Add type if available
        if hasattr(obj, 'task_type'):
            tags.append(str(obj.task_type))
        
        return ' '.join(tags)

    @classmethod
    def _generate_search_vector(cls, title, content, tags):
        """Generate search vector for full-text search"""
        # Simple implementation - can be enhanced with proper full-text search
        return f"{title} {content} {tags}".lower()

    @classmethod
    def remove_for_object(cls, obj):
        """Remove search index entry for an object"""
        content_type = ContentType.objects.get_for_model(obj)
        cls.objects.filter(content_type=content_type, object_id=obj.pk).delete()


class BulkOperation(models.Model):
    """Track bulk operations for auditing and progress"""
    OPERATION_CHOICES = [
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('export', 'Export'),
        ('merge', 'Merge'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    operation_type = models.CharField(max_length=20, choices=OPERATION_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bulk_operations')
    
    # Operation details
    entity_type = models.CharField(max_length=50)
    total_records = models.PositiveIntegerField(default=0)
    processed_records = models.PositiveIntegerField(default=0)
    successful_records = models.PositiveIntegerField(default=0)
    failed_records = models.PositiveIntegerField(default=0)
    
    # Operation parameters
    filters = models.JSONField(default=dict, help_text="Filters used to select records")
    operation_data = models.JSONField(default=dict, help_text="Data for the operation")
    
    # Results and errors
    results = models.JSONField(default=dict, help_text="Operation results")
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_operation_type_display()} {self.entity_type} - {self.status}"

    @property
    def progress_percentage(self):
        """Calculate progress percentage"""
        if self.total_records == 0:
            return 0
        return int((self.processed_records / self.total_records) * 100)

    @property
    def duration(self):
        """Calculate operation duration"""
        if not self.started_at:
            return None
        end_time = self.completed_at or timezone.now()
        return end_time - self.started_at