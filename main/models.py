from django.db import models
from django.contrib.auth.models import AbstractUser
from django_ckeditor_5.fields import CKEditor5Field
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

# In-app notification model
class Notification(models.Model):
	user = models.ForeignKey('CustomUser', on_delete=models.CASCADE, related_name='notifications')
	message = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)
	read = models.BooleanField(default=False)
	def __str__(self):
		return f"Notification for {self.user} at {self.created_at}" 

# Model for storing rich text content submissions
class RichTextContent(models.Model):
	user = models.ForeignKey('CustomUser', on_delete=models.SET_NULL, null=True, blank=True)
	content = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)
	approved = models.BooleanField(default=None, null=True, blank=True)
	moderation_notes = models.TextField(blank=True, null=True)
	rejection_reason = models.CharField(max_length=255, blank=True, null=True)
	def __str__(self):
		return f"RichTextContent by {self.user} at {self.created_at}" 

class CustomUser(AbstractUser):
	# Add custom fields here if needed
	pass

class SecretModel(models.Model):
	class Meta:
		permissions = [
			("can_view_secret", "Can view secret page"),
		]

# CMS Models
class Category(models.Model):
	name = models.CharField(max_length=100, unique=True)
	description = models.TextField(blank=True)
	slug = models.SlugField(max_length=120, unique=True)
	def __str__(self):
		return self.name

class Tag(models.Model):
	name = models.CharField(max_length=50, unique=True)
	slug = models.SlugField(max_length=60, unique=True)
	def __str__(self):
		return self.name

class Page(models.Model):
	title = models.CharField(max_length=200)
	slug = models.SlugField(max_length=220, unique=True)
	content = models.TextField()
	rich_content = CKEditor5Field('Rich Content', blank=True, help_text="Rich text (HTML)", config_name='extends')
	image = models.ImageField(upload_to='page_images/', blank=True, null=True)
	STATUS_CHOICES = [
		('draft', 'Draft'),
		('review', 'In Review'),
		('published', 'Published'),
		('archived', 'Archived'),
	]
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
	published = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	author = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
	def __str__(self):
		return self.title

class Post(models.Model):
	title = models.CharField(max_length=200)
	slug = models.SlugField(max_length=220, unique=True)
	content = models.TextField()
	rich_content = CKEditor5Field('Rich Content', blank=True, help_text="Rich text (HTML)", config_name='extends')
	image = models.ImageField(upload_to='post_images/', blank=True, null=True)
	STATUS_CHOICES = [
		('draft', 'Draft'),
		('review', 'In Review'),
		('published', 'Published'),
		('archived', 'Archived'),
	]
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
	published = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	author = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
	categories = models.ManyToManyField(Category, blank=True)
	tags = models.ManyToManyField(Tag, blank=True)
	def __str__(self):
		return self.title

class Comment(models.Model):
	post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
	author = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
	content = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)
	approved = models.BooleanField(default=True)
	def __str__(self):
		return f"Comment by {self.author} on {self.post}"

# CRM Models

class Account(models.Model):
    name = models.CharField(max_length=255, unique=True)
    industry = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    owner = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='owned_accounts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class TaskType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Contact(models.Model):
    account = models.ForeignKey(Account, related_name='contacts', on_delete=models.CASCADE, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True)
    title = models.CharField(max_length=100, blank=True)
    owner = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='owned_contacts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    task_type = models.ForeignKey(TaskType, on_delete=models.SET_NULL, null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    due_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='tasks')
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    deal = models.ForeignKey('Deal', on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_tasks', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    @property
    def is_overdue(self):
        from django.utils import timezone
        return not self.completed and self.due_date < timezone.now()

class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
        ('complete', 'Completed'),
        ('email_sent', 'Email Sent'),
        ('call_made', 'Call Made'),
        ('meeting_held', 'Meeting Held'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.TextField()
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} {self.get_action_display()} - {self.description}"

class DealStage(models.Model):
    name = models.CharField(max_length=100, unique=True)
    order = models.PositiveIntegerField(help_text="Order in the pipeline")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class Deal(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('won', 'Won'),
        ('lost', 'Lost'),
    ]
    title = models.CharField(max_length=255)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='deals')
    primary_contact = models.ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True, related_name='deals')
    stage = models.ForeignKey(DealStage, on_delete=models.PROTECT, related_name='deals')
    value = models.DecimalField(max_digits=10, decimal_places=2)
    close_date = models.DateField()
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='deals')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Interaction(models.Model):
    INTERACTION_TYPES = [
        ('email', 'Email'),
        ('call', 'Call'),
        ('meeting', 'Meeting'),
        ('note', 'Note'),
    ]
    
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='interactions', null=True, blank=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='interactions', null=True, blank=True)
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPES)
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField(blank=True)
    interaction_date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='created_interactions')

    def __str__(self):
        return f"{self.get_interaction_type_display()} with {self.contact or self.account}"

class Quote(models.Model):
    deal = models.OneToOneField(Deal, on_delete=models.CASCADE, related_name='quote')
    valid_until = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Quote for {self.deal.name}"

class QuoteItem(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.description

class Invoice(models.Model):
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='invoices')
    due_date = models.DateField()
    paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invoice for {self.deal.name}"

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.description

# Models for Custom Fields
class CustomField(models.Model):
    FIELD_TYPE_CHOICES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('boolean', 'Boolean'),
    ]
    
    name = models.CharField(max_length=100)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, help_text="The model this field applies to (e.g., Contact, Account).")

    class Meta:
        unique_together = ('name', 'content_type')

    def __str__(self):
        return f"{self.name} ({self.get_field_type_display()}) for {self.content_type.model}"

class CustomFieldValue(models.Model):
    custom_field = models.ForeignKey(CustomField, on_delete=models.CASCADE, related_name='values')
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    
    value_text = models.TextField(blank=True, null=True)
    value_number = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    value_date = models.DateField(blank=True, null=True)
    value_boolean = models.BooleanField(blank=True, null=True)

    def __str__(self):
        return f"Value for {self.custom_field.name} on {self.content_object}"

    @property
    def value(self):
        # Check if the related custom_field exists to prevent crashes
        if not hasattr(self, 'custom_field') or self.custom_field is None:
            return None
            
        if self.custom_field.field_type == 'text':
            return self.value_text
        elif self.custom_field.field_type == 'number':
            return self.value_number
        elif self.custom_field.field_type == 'date':
            return self.value_date
        elif self.custom_field.field_type == 'boolean':
            return self.value_boolean
        return None


# Models for Task Templates
class TaskTemplate(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    
    # Default values for the Task itself
    default_title = models.CharField(max_length=255)
    default_description = models.TextField(blank=True)
    default_task_type = models.ForeignKey(TaskType, on_delete=models.SET_NULL, null=True, blank=True)
    default_priority = models.CharField(max_length=10, choices=Task.PRIORITY_CHOICES, default='medium')

    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='task_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class DefaultWorkOrderItem(models.Model):
    ITEM_TYPE_CHOICES = [
        ('part', 'Part'),
        ('labor', 'Labor'),
        ('equipment', 'Serialized Equipment'),
    ]
    
    template = models.ForeignKey(TaskTemplate, on_delete=models.CASCADE, related_name='default_items')
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    serial_number = models.CharField(max_length=255, blank=True, help_text="Required if item_type is 'equipment'")

    def __str__(self):
        return f"{self.get_item_type_display()}: {self.description} for {self.template.name}"

    def clean(self):
        if self.item_type == 'equipment' and not self.serial_number:
            from django.core.exceptions import ValidationError
            raise ValidationError({'serial_number': 'Serial number is required for equipment.'})

# Import search models
from .search_models import SavedSearch, GlobalSearchIndex, BulkOperation

class LogEntry(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    level = models.CharField(max_length=10)
    message = models.TextField()
    module = models.CharField(max_length=100)
    
    def __str__(self):
        return f"[{self.timestamp}] [{self.level}] {self.message}"

    class Meta:
        ordering = ['-timestamp']
