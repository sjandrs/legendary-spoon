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
    tags = models.ManyToManyField(Tag, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class ProjectType(models.Model):
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
    tags = models.ManyToManyField(Tag, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Project(models.Model):
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
    project_type = models.ForeignKey(ProjectType, on_delete=models.SET_NULL, null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    # due_date uses DateField (not DateTimeField) to store only the date, not the time, for project deadlines.
    # This is intentional to simplify deadline logic and UI; if time precision is needed, consider switching to DateTimeField.
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='projects')
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='projects', null=True, blank=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='projects', null=True, blank=True)
    deal = models.ForeignKey('Deal', on_delete=models.CASCADE, related_name='projects', null=True, blank=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_projects', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    @property
    def is_overdue(self):
        from django.utils import timezone
        return not self.completed and self.due_date < timezone.now().date()

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
        # Defensive: fallback if deal or title is missing
        deal_title = getattr(self.deal, "title", None)
        return f"Quote for {deal_title or '[No Deal Title]'}"

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
        deal_title = self.deal.title if self.deal and hasattr(self.deal, 'title') else "Unknown Deal"
        return f"Invoice for {deal_title}"

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
class ProjectTemplate(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    
    # Default values for the Project itself
    default_title = models.CharField(max_length=255)
    default_description = models.TextField(blank=True)
    default_project_type = models.ForeignKey(ProjectType, on_delete=models.SET_NULL, null=True, blank=True)
    default_priority = models.CharField(max_length=10, choices=Project.PRIORITY_CHOICES, default='medium')

    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='project_templates')
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
    
    template = models.ForeignKey(ProjectTemplate, on_delete=models.CASCADE, related_name='default_items')
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


class LedgerAccount(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ('asset', 'Asset'),
        ('liability', 'Liability'),
        ('equity', 'Equity'),
        ('revenue', 'Revenue'),
        ('expense', 'Expense'),
    ]
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES)

    def __str__(self):
        return f"{self.code} - {self.name} ({self.account_type})"

class JournalEntry(models.Model):
    date = models.DateField()
    description = models.CharField(max_length=255)
    debit_account = models.ForeignKey('LedgerAccount', on_delete=models.CASCADE, related_name='debits')
    credit_account = models.ForeignKey('LedgerAccount', on_delete=models.CASCADE, related_name='credits')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date}: {self.description} - {self.amount}"

class WorkOrder(models.Model):
    project = models.ForeignKey('Project', on_delete=models.CASCADE, related_name='work_orders')
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=50, default='open')

    def generate_invoice(self, payment_terms='net_30'):
        """
        Generate an invoice for this work order
        Returns the created WorkOrderInvoice instance
        """
        from django.utils import timezone
        from datetime import timedelta

        issued_date = timezone.now().date()

        # Calculate due date based on payment terms
        if payment_terms == 'net_15':
            due_date = issued_date + timedelta(days=15)
        elif payment_terms == 'net_30':
            due_date = issued_date + timedelta(days=30)
        elif payment_terms == 'net_60':
            due_date = issued_date + timedelta(days=60)
        else:  # due_on_receipt
            due_date = issued_date

        # Calculate total from line items
        total_amount = sum(line_item.total for line_item in self.line_items.all())

        invoice = WorkOrderInvoice.objects.create(
            work_order=self,
            issued_date=issued_date,
            due_date=due_date,
            payment_terms=payment_terms,
            total_amount=total_amount
        )

        return invoice

    def adjust_inventory(self):
        """
        Adjust warehouse inventory when work order is completed.
        Implements REQ-203: inventory integration.
        """
        for line_item in self.line_items.all():
            if line_item.warehouse_item:
                # Decrease inventory for parts/equipment used
                if line_item.warehouse_item.item_type in ['part', 'equipment', 'consumable']:
                    line_item.warehouse_item.quantity -= line_item.quantity
                    line_item.warehouse_item.save()

                    # Log the inventory adjustment
                    ActivityLog.objects.create(
                        user=self.project.assigned_to,
                        action='update',
                        content_object=line_item.warehouse_item,
                        description=f'Inventory adjusted for WorkOrder #{self.id}: -{line_item.quantity} {line_item.warehouse_item.name}'
                    )

    def complete_work_order(self):
        """
        Mark work order as completed and adjust inventory.
        """
        self.status = 'completed'
        self.save()
        self.adjust_inventory()

        # Log completion
        ActivityLog.objects.create(
            user=self.project.assigned_to,
            action='complete',
            content_object=self,
            description=f'WorkOrder #{self.id} completed and inventory adjusted'
        )

    def __str__(self):
        return f"WorkOrder #{self.id} for {self.project}"

class LineItem(models.Model):
    work_order = models.ForeignKey('WorkOrder', on_delete=models.CASCADE, related_name='line_items')
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    warehouse_item = models.ForeignKey('WarehouseItem', on_delete=models.SET_NULL, null=True, blank=True, related_name='line_items')

    def save(self, *args, **kwargs):
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} ({self.quantity} x {self.unit_price})"


class WorkOrderInvoice(models.Model):
    PAYMENT_TERMS_CHOICES = [
        ('net_15', 'Net 15 days'),
        ('net_30', 'Net 30 days'),
        ('net_60', 'Net 60 days'),
        ('due_on_receipt', 'Due on Receipt'),
    ]

    work_order = models.ForeignKey('WorkOrder', on_delete=models.CASCADE, related_name='invoices')
    issued_date = models.DateField()
    due_date = models.DateField()
    payment_terms = models.CharField(max_length=20, choices=PAYMENT_TERMS_CHOICES, default='net_30')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_paid = models.BooleanField(default=False)
    paid_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def calculate_total(self):
        """Calculate total from work order line items"""
        return sum(line_item.total for line_item in self.work_order.line_items.all())

    def save(self, *args, **kwargs):
        if not self.total_amount:
            self.total_amount = self.calculate_total()
        super().save(*args, **kwargs)

    def is_overdue(self):
        """Check if invoice is overdue"""
        from django.utils import timezone
        return not self.is_paid and timezone.now().date() > self.due_date

    def days_overdue(self):
        """Return number of days overdue"""
        from django.utils import timezone
        if not self.is_overdue():
            return 0
        return (timezone.now().date() - self.due_date).days

    def send_invoice_email(self):
        """
        Send invoice email to customer.
        Implements part of REQ-204: customer communication automation.
        """
        from django.core.mail import send_mail
        from django.conf import settings

        subject = f'Invoice #{self.id} from {settings.COMPANY_NAME or "Converge"}'
        message = f"""
Dear {self.work_order.project.contact.first_name},

Please find attached invoice #{self.id} for your recent work order.

Invoice Details:
- Invoice #: {self.id}
- Work Order: {self.work_order.description}
- Total Amount: ${self.total_amount}
- Due Date: {self.due_date}
- Payment Terms: {self.get_payment_terms_display()}

Thank you for your business!

Best regards,
{settings.COMPANY_NAME or "Converge"} Team
        """

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[self.work_order.project.contact.email],
                fail_silently=False,
            )

            # Log the email sending
            ActivityLog.objects.create(
                user=self.work_order.project.assigned_to,
                action='email_sent',
                content_object=self,
                description=f'Invoice email sent to {self.work_order.project.contact.email}'
            )

            return True
        except Exception as e:
            # Log the failure
            ActivityLog.objects.create(
                user=self.work_order.project.assigned_to,
                action='email_sent',
                content_object=self,
                description=f'Failed to send invoice email: {str(e)}'
            )
            return False

    def send_overdue_reminder(self):
        """
        Send overdue payment reminder email.
        Implements part of REQ-204: customer communication automation.
        """
        from django.core.mail import send_mail
        from django.conf import settings

        days_overdue = self.days_overdue()
        subject = f'OVERDUE: Payment Reminder for Invoice #{self.id}'

        message = f"""
Dear {self.work_order.project.contact.first_name},

This is a reminder that payment for Invoice #{self.id} is {days_overdue} days overdue.

Invoice Details:
- Invoice #: {self.id}
- Work Order: {self.work_order.description}
- Total Amount: ${self.total_amount}
- Due Date: {self.due_date}
- Days Overdue: {days_overdue}

Please remit payment at your earliest convenience to avoid additional late fees.

Thank you for your prompt attention to this matter.

Best regards,
{settings.COMPANY_NAME or "Converge"} Team
        """

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[self.work_order.project.contact.email],
                fail_silently=False,
            )

            # Log the reminder
            ActivityLog.objects.create(
                user=self.work_order.project.assigned_to,
                action='email_sent',
                content_object=self,
                description=f'Overdue reminder sent to {self.work_order.project.contact.email} ({days_overdue} days overdue)'
            )

            return True
        except Exception as e:
            ActivityLog.objects.create(
                user=self.work_order.project.assigned_to,
                action='email_sent',
                content_object=self,
                description=f'Failed to send overdue reminder: {str(e)}'
            )
            return False

class Payment(models.Model):
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField()
    method = models.CharField(max_length=50)
    received_by = models.ForeignKey('CustomUser', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    # Generic relation to support payments for multiple invoice types
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    def __str__(self):
        return f"Payment of {self.amount} for {self.content_object}"

class Expense(models.Model):
    EXPENSE_CATEGORIES = [
        ('office_supplies', 'Office Supplies'),
        ('travel', 'Travel'),
        ('meals', 'Meals & Entertainment'),
        ('utilities', 'Utilities'),
        ('rent', 'Rent'),
        ('marketing', 'Marketing'),
        ('software', 'Software & Subscriptions'),
        ('equipment', 'Equipment'),
        ('professional_services', 'Professional Services'),
        ('other', 'Other'),
    ]

    date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=30, choices=EXPENSE_CATEGORIES)
    description = models.CharField(max_length=255)
    vendor = models.CharField(max_length=100, blank=True)
    receipt = models.FileField(upload_to='receipts/', null=True, blank=True)
    submitted_by = models.ForeignKey('CustomUser', on_delete=models.CASCADE, related_name='expenses')
    approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey('CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_expenses')
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category}: {self.description} - ${self.amount}"

class Budget(models.Model):
    BUDGET_TYPES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annual', 'Annual'),
    ]

    name = models.CharField(max_length=100)
    budget_type = models.CharField(max_length=20, choices=BUDGET_TYPES, default='monthly')
    year = models.PositiveIntegerField()
    month = models.PositiveIntegerField(null=True, blank=True)  # For monthly budgets
    quarter = models.PositiveIntegerField(null=True, blank=True)  # For quarterly budgets
    categories = models.JSONField(default=dict)  # {'category': amount, ...}
    created_by = models.ForeignKey('CustomUser', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_variance(self, category, actual_amount):
        """Calculate budget variance for a category"""
        budgeted = self.categories.get(category, 0)
        return budgeted - actual_amount

    def __str__(self):
        period = f"{self.year}"
        if self.month:
            period += f"-{self.month:02d}"
        elif self.quarter:
            period += f" Q{self.quarter}"
        return f"{self.name} ({period})"

class TimeEntry(models.Model):
    """
    Model for tracking billable time on projects.
    Implements REQ-202: project billing with time tracking.
    """
    project = models.ForeignKey('Project', on_delete=models.CASCADE, related_name='time_entries')
    user = models.ForeignKey('CustomUser', on_delete=models.CASCADE, related_name='time_entries')
    date = models.DateField()
    hours = models.DecimalField(max_digits=5, decimal_places=2, help_text="Hours worked (e.g., 2.5)")
    description = models.CharField(max_length=255)
    billable = models.BooleanField(default=True)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    billed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']
        unique_together = ('project', 'user', 'date', 'description')  # Prevent duplicate entries

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.hours}h on {self.project.title} ({self.date})"

    @property
    def total_amount(self):
        """Calculate total amount for this time entry"""
        if not self.hourly_rate:
            return 0
        return self.hours * self.hourly_rate

class Warehouse(models.Model):
    """
    Model for warehouse locations.
    Implements part of REQ-203: inventory integration.
    """
    name = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=255, blank=True)
    manager = models.ForeignKey('CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='warehouses')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class WarehouseItem(models.Model):
    """
    Model for items stored in warehouse.
    Implements inventory tracking for REQ-203.
    """
    ITEM_TYPES = [
        ('part', 'Part'),
        ('equipment', 'Equipment'),
        ('consumable', 'Consumable'),
        ('finished_good', 'Finished Good'),
    ]

    warehouse = models.ForeignKey('Warehouse', on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES)
    sku = models.CharField(max_length=100, unique=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    minimum_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    serial_number = models.CharField(max_length=255, blank=True)
    location_in_warehouse = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('warehouse', 'sku')

    def __str__(self):
        return f"{self.name} ({self.sku}) - {self.quantity} units"

    @property
    def is_low_stock(self):
        """Check if item is below minimum stock level"""
        return self.quantity <= self.minimum_stock

    @property
    def total_value(self):
        """Calculate total value of inventory"""
        return self.quantity * self.unit_cost
