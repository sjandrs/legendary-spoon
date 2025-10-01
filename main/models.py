from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models
from django_ckeditor_5.fields import CKEditor5Field


# In-app notification model
class Notification(models.Model):
    user = models.ForeignKey(
        "CustomUser", on_delete=models.CASCADE, related_name="notifications"
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.user} at {self.created_at}"


# Model for storing rich text content submissions
class RichTextContent(models.Model):
    user = models.ForeignKey(
        "CustomUser", on_delete=models.SET_NULL, null=True, blank=True
    )
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
    rich_content = CKEditor5Field(
        "Rich Content", blank=True, help_text="Rich text (HTML)", config_name="extends"
    )
    image = models.ImageField(upload_to="page_images/", blank=True, null=True)
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("review", "In Review"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    author = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True
    )

    def __str__(self):
        return self.title


class Post(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    content = models.TextField()
    rich_content = CKEditor5Field(
        "Rich Content", blank=True, help_text="Rich text (HTML)", config_name="extends"
    )
    image = models.ImageField(upload_to="post_images/", blank=True, null=True)
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("review", "In Review"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    author = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True
    )
    categories = models.ManyToManyField(Category, blank=True)
    tags = models.ManyToManyField(Tag, blank=True)

    def __str__(self):
        return self.title


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(default=True)

    def __str__(self):
        return f"Comment by {self.author} on {self.post}"


# CRM Models


class Account(models.Model):
    name = models.CharField(max_length=255, unique=True)
    industry = models.CharField(max_length=255, blank=True, db_index=True)
    website = models.URLField(blank=True, db_index=True)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    owner = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_accounts",
    )
    tags = models.ManyToManyField(Tag, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ProjectType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Contact(models.Model):
    account = models.ForeignKey(
        Account,
        related_name="contacts",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    first_name = models.CharField(max_length=100, db_index=True)
    last_name = models.CharField(max_length=100, db_index=True)
    email = models.EmailField(unique=True, db_index=True)
    phone_number = models.CharField(max_length=20, blank=True)
    title = models.CharField(max_length=100, blank=True)
    owner = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_contacts",
    )
    tags = models.ManyToManyField(Tag, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Project(models.Model):
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    project_type = models.ForeignKey(
        ProjectType, on_delete=models.SET_NULL, null=True, blank=True
    )
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default="medium"
    )
    # due_date uses DateField (not DateTimeField) to store only the date, not the time,
    # for project deadlines. This is intentional to simplify deadline logic and UI; if time
    # precision is needed, consider switching to DateTimeField.
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="projects"
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name="projects",
        null=True,
        blank=True,
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="projects",
        null=True,
        blank=True,
    )
    deal = models.ForeignKey(
        "Deal", on_delete=models.CASCADE, related_name="projects", null=True, blank=True
    )
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="created_projects",
        null=True,
        blank=True,
    )
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
        ("create", "Created"),
        ("update", "Updated"),
        ("delete", "Deleted"),
        ("complete", "Completed"),
        ("email_sent", "Email Sent"),
        ("call_made", "Call Made"),
        ("meeting_held", "Meeting Held"),
    ]

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="activity_logs"
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.TextField()
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey("content_type", "object_id")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.user.username} {self.get_action_display()} - {self.description}"


class DealStage(models.Model):
    name = models.CharField(max_length=100, unique=True)
    order = models.PositiveIntegerField(help_text="Order in the pipeline")

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name


class Deal(models.Model):
    STATUS_CHOICES = [
        ("in_progress", "In Progress"),
        ("won", "Won"),
        ("lost", "Lost"),
    ]
    title = models.CharField(max_length=255, db_index=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="deals")
    primary_contact = models.ForeignKey(
        Contact, on_delete=models.SET_NULL, null=True, blank=True, related_name="deals"
    )
    stage = models.ForeignKey(DealStage, on_delete=models.PROTECT, related_name="deals")
    value = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    close_date = models.DateField(db_index=True)
    owner = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="deals"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="in_progress", db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Interaction(models.Model):
    INTERACTION_TYPES = [
        ("email", "Email"),
        ("call", "Call"),
        ("meeting", "Meeting"),
        ("note", "Note"),
    ]

    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name="interactions",
        null=True,
        blank=True,
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="interactions",
        null=True,
        blank=True,
    )
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPES)
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField(blank=True)
    interaction_date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_interactions",
    )

    def __str__(self):
        return (
            f"{self.get_interaction_type_display()} with {self.contact or self.account}"
        )


class Quote(models.Model):
    deal = models.OneToOneField(Deal, on_delete=models.CASCADE, related_name="quote")
    valid_until = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        # Defensive: fallback if deal or title is missing
        deal_title = getattr(self.deal, "title", None)
        return f"Quote for {deal_title or '[No Deal Title]'}"


class QuoteItem(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.description


class Invoice(models.Model):
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name="invoices")
    due_date = models.DateField()
    paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        deal_title = (
            self.deal.title
            if self.deal and hasattr(self.deal, "title")
            else "Unknown Deal"
        )
        return f"Invoice for {deal_title}"


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.description


# Models for Custom Fields
class CustomField(models.Model):
    FIELD_TYPE_CHOICES = [
        ("text", "Text"),
        ("number", "Number"),
        ("date", "Date"),
        ("boolean", "Boolean"),
    ]

    name = models.CharField(max_length=100)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        help_text="The model this field applies to (e.g., Contact, Account).",
    )

    class Meta:
        unique_together = ("name", "content_type")

    def __str__(self):
        return f"{self.name} ({self.get_field_type_display()}) for {self.content_type.model}"


class CustomFieldValue(models.Model):
    custom_field = models.ForeignKey(
        CustomField, on_delete=models.CASCADE, related_name="values"
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)

    value_text = models.TextField(blank=True, null=True)
    value_number = models.DecimalField(
        max_digits=15, decimal_places=2, blank=True, null=True
    )
    value_date = models.DateField(blank=True, null=True)
    value_boolean = models.BooleanField(blank=True, null=True)

    def __str__(self):
        return f"Value for {self.custom_field.name} on {self.content_object}"

    @property
    def value(self):
        # Check if the related custom_field exists to prevent crashes
        if not hasattr(self, "custom_field") or self.custom_field is None:
            return None

        if self.custom_field.field_type == "text":
            return self.value_text
        elif self.custom_field.field_type == "number":
            return self.value_number
        elif self.custom_field.field_type == "date":
            return self.value_date
        elif self.custom_field.field_type == "boolean":
            return self.value_boolean
        return None


# Models for Task Templates
class ProjectTemplate(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)

    # Default values for the Project itself
    default_title = models.CharField(max_length=255)
    default_description = models.TextField(blank=True)
    default_project_type = models.ForeignKey(
        ProjectType, on_delete=models.SET_NULL, null=True, blank=True
    )
    default_priority = models.CharField(
        max_length=10, choices=Project.PRIORITY_CHOICES, default="medium"
    )

    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="project_templates",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class DefaultWorkOrderItem(models.Model):
    ITEM_TYPE_CHOICES = [
        ("part", "Part"),
        ("labor", "Labor"),
        ("equipment", "Serialized Equipment"),
    ]

    template = models.ForeignKey(
        ProjectTemplate, on_delete=models.CASCADE, related_name="default_items"
    )
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    serial_number = models.CharField(
        max_length=255, blank=True, help_text="Required if item_type is 'equipment'"
    )

    def __str__(self):
        return f"{self.get_item_type_display()}: {self.description} for {self.template.name}"

    def clean(self):
        if self.item_type == "equipment" and not self.serial_number:
            raise ValidationError(
                {"serial_number": "Serial number is required for equipment."}
            )


class LogEntry(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    level = models.CharField(max_length=10)
    message = models.TextField()
    module = models.CharField(max_length=100)

    def __str__(self):
        return f"[{self.timestamp}] [{self.level}] {self.message}"

    class Meta:
        ordering = ["-timestamp"]


class LedgerAccount(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ("asset", "Asset"),
        ("liability", "Liability"),
        ("equity", "Equity"),
        ("revenue", "Revenue"),
        ("expense", "Expense"),
    ]
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES)

    def __str__(self):
        return f"{self.code} - {self.name} ({self.account_type})"


class JournalEntry(models.Model):
    date = models.DateField()
    description = models.CharField(max_length=255)
    debit_account = models.ForeignKey(
        "LedgerAccount", on_delete=models.CASCADE, related_name="debits"
    )
    credit_account = models.ForeignKey(
        "LedgerAccount", on_delete=models.CASCADE, related_name="credits"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date}: {self.description} - {self.amount}"


class WorkOrder(models.Model):
    project = models.ForeignKey(
        "Project", on_delete=models.CASCADE, related_name="work_orders"
    )
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=50, default="open")

    def generate_invoice(self, payment_terms="net_30"):
        """
        Generate an invoice for this work order
        Returns the created WorkOrderInvoice instance
        """
        from datetime import timedelta

        from django.utils import timezone

        issued_date = timezone.now().date()

        # Calculate due date based on payment terms
        if payment_terms == "net_15":
            due_date = issued_date + timedelta(days=15)
        elif payment_terms == "net_30":
            due_date = issued_date + timedelta(days=30)
        elif payment_terms == "net_60":
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
            total_amount=total_amount,
        )

        return invoice

    def adjust_inventory(self):
        """
        Adjust warehouse inventory when work order is completed.
        Implements REQ-203: inventory integration.
        Ensures atomicity and prevents negative inventory.
        """
        from django.core.exceptions import ValidationError
        from django.db import transaction

        with transaction.atomic():
            # Use select_related for single-valued relationships and prefetch_related for
            # many-to-many or reverse relationships
            # Example: prefetch_related('some_related_set') if you access
            # line_item.some_related_set.all() in the loop
            qs = self.line_items.select_related("warehouse_item")
            # If you need to access additional related objects, add them here:
            # qs = qs.prefetch_related('some_related_set')
            for line_item in qs.all():
                warehouse_item = line_item.warehouse_item
                if warehouse_item:
                    # Decrease inventory for parts/equipment/consumable used
                    if warehouse_item.item_type in ["part", "equipment", "consumable"]:
                        if warehouse_item.quantity < line_item.quantity:
                            raise ValidationError(
                                f"Cannot reduce inventory of {warehouse_item.name} below zero. "
                                f"Attempted to subtract {line_item.quantity}, only "
                                f"{warehouse_item.quantity} available."
                            )
                        warehouse_item.quantity -= line_item.quantity
                        warehouse_item.save()

                        # Log the inventory adjustment
                        ActivityLog.objects.create(
                            user=self.project.assigned_to,
                            action="update",
                            content_object=warehouse_item,
                            description=(
                                f"Inventory adjusted for WorkOrder #{self.id}: "
                                f"-{line_item.quantity} {warehouse_item.name}"
                            ),
                        )

    def __str__(self):
        return f"WorkOrder #{self.id} for {self.project}"


class LineItem(models.Model):
    work_order = models.ForeignKey(
        "WorkOrder", on_delete=models.CASCADE, related_name="line_items"
    )
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    warehouse_item = models.ForeignKey(
        "WarehouseItem",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="line_items",
    )

    def save(self, *args, **kwargs):
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} ({self.quantity} x {self.unit_price})"


class WorkOrderInvoice(models.Model):
    PAYMENT_TERMS_CHOICES = [
        ("net_15", "Net 15 days"),
        ("net_30", "Net 30 days"),
        ("net_60", "Net 60 days"),
        ("due_on_receipt", "Due on Receipt"),
    ]

    work_order = models.ForeignKey(
        "WorkOrder", on_delete=models.CASCADE, related_name="invoices"
    )
    issued_date = models.DateField()
    due_date = models.DateField()
    payment_terms = models.CharField(
        max_length=20, choices=PAYMENT_TERMS_CHOICES, default="net_30"
    )
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

        company_name = getattr(settings, "COMPANY_NAME", None) or getattr(
            settings, "COMPANY_NAME_FALLBACK", "Converge"
        )
        subject = f"Invoice #{self.id} from {company_name}"
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
{company_name} Team
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
                action="email_sent",
                content_object=self,
                description=f"Invoice email sent to {self.work_order.project.contact.email}",
            )

            return True
        except Exception as e:
            # Log the failure
            ActivityLog.objects.create(
                user=self.work_order.project.assigned_to,
                action="email_sent",
                content_object=self,
                description=f"Failed to send invoice email: {str(e)}",
            )
            return False

    def send_overdue_reminder(self):
        """
        Send overdue payment reminder email.
        Implements part of REQ-204: customer communication automation.
        """
        from django.core.mail import send_mail

        days_overdue = self.days_overdue()
        subject = f"OVERDUE: Payment Reminder for Invoice #{self.id}"

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
{getattr(settings, "COMPANY_NAME", "Converge")} Team
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
                action="email_sent",
                content_object=self,
                description=(
                    f"Overdue reminder sent to {self.work_order.project.contact.email} "
                    f"({days_overdue} days overdue)"
                ),
            )

            return True
        except Exception as e:
            ActivityLog.objects.create(
                user=self.work_order.project.assigned_to,
                action="email_sent",
                content_object=self,
                description=f"Failed to send overdue reminder: {str(e)}",
            )
            return False


class Payment(models.Model):
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField()
    method = models.CharField(max_length=50)
    received_by = models.ForeignKey(
        "CustomUser", on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    # Generic relation to support payments for multiple invoice types
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    def __str__(self):
        return f"Payment of {self.amount} for {self.content_object}"


class Expense(models.Model):
    EXPENSE_CATEGORIES = [
        ("office_supplies", "Office Supplies"),
        ("travel", "Travel"),
        ("meals", "Meals & Entertainment"),
        ("utilities", "Utilities"),
        ("rent", "Rent"),
        ("marketing", "Marketing"),
        ("software", "Software & Subscriptions"),
        ("equipment", "Equipment"),
        ("professional_services", "Professional Services"),
        ("other", "Other"),
    ]

    date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=30, choices=EXPENSE_CATEGORIES)
    description = models.CharField(max_length=255)
    vendor = models.CharField(max_length=100, blank=True)
    receipt = models.FileField(upload_to="receipts/", null=True, blank=True)
    submitted_by = models.ForeignKey(
        "CustomUser", on_delete=models.CASCADE, related_name="expenses"
    )
    approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        "CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_expenses",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category}: {self.description} - ${self.amount}"


class Budget(models.Model):
    BUDGET_TYPES = [
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
        ("annual", "Annual"),
    ]

    name = models.CharField(max_length=100)
    budget_type = models.CharField(
        max_length=20, choices=BUDGET_TYPES, default="monthly"
    )
    year = models.PositiveIntegerField()
    month = models.PositiveIntegerField(null=True, blank=True)  # For monthly budgets
    quarter = models.PositiveIntegerField(
        null=True, blank=True
    )  # For quarterly budgets
    categories = models.JSONField(default=dict)  # {'category': amount, ...}
    created_by = models.ForeignKey("CustomUser", on_delete=models.CASCADE)
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

    project = models.ForeignKey(
        "Project", on_delete=models.CASCADE, related_name="time_entries"
    )
    user = models.ForeignKey(
        "CustomUser", on_delete=models.CASCADE, related_name="time_entries"
    )
    date = models.DateField()
    hours = models.DecimalField(
        max_digits=5, decimal_places=2, help_text="Hours worked (e.g., 2.5)"
    )
    description = models.CharField(max_length=255)
    billable = models.BooleanField(default=True)
    hourly_rate = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    billed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        unique_together = (
            "project",
            "user",
            "date",
            "description",
        )  # Prevent duplicate entries

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
    manager = models.ForeignKey(
        "CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="warehouses",
    )
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
        ("part", "Part"),
        ("equipment", "Equipment"),
        ("consumable", "Consumable"),
        ("finished_good", "Finished Good"),
    ]

    warehouse = models.ForeignKey(
        "Warehouse", on_delete=models.CASCADE, related_name="items"
    )
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
        unique_together = ("warehouse", "sku")

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


# Phase 3: Advanced Analytics Models
class AnalyticsSnapshot(models.Model):
    """
    Daily snapshots of key business metrics for historical trending.
    Implements part of REQ-301: Advanced Analytics Dashboard.
    """

    date = models.DateField(unique=True)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deals = models.PositiveIntegerField(default=0)
    won_deals = models.PositiveIntegerField(default=0)
    lost_deals = models.PositiveIntegerField(default=0)
    active_projects = models.PositiveIntegerField(default=0)
    completed_projects = models.PositiveIntegerField(default=0)
    total_contacts = models.PositiveIntegerField(default=0)
    total_accounts = models.PositiveIntegerField(default=0)
    inventory_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_invoices = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    overdue_invoices = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"Analytics Snapshot for {self.date}"

    @classmethod
    def create_daily_snapshot(cls):
        """Create a daily snapshot of current business metrics (optimized for fewer DB hits)"""
        from django.db.models import Count, F, Q, Sum
        from django.utils import timezone

        today = timezone.now().date()

        # Revenue calculations
        total_revenue = (
            Payment.objects.filter(payment_date__lte=today).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        # Deal statistics (single query with annotation)
        deal_stats = Deal.objects.aggregate(
            total_deals=Count("id"),
            won_deals=Count("id", filter=Q(status="won")),
            lost_deals=Count("id", filter=Q(status="lost")),
        )
        total_deals = deal_stats["total_deals"]
        won_deals = deal_stats["won_deals"]
        lost_deals = deal_stats["lost_deals"]

        # Project statistics (single query with annotation)
        project_stats = Project.objects.aggregate(
            active_projects=Count("id", filter=Q(status="in_progress")),
            completed_projects=Count("id", filter=Q(status="completed")),
        )
        active_projects = project_stats["active_projects"]
        completed_projects = project_stats["completed_projects"]

        # Contact and account counts (single query each)
        total_contacts = Contact.objects.count()
        total_accounts = Account.objects.count()

        # Inventory value (single aggregate query)
        inventory_value = (
            WarehouseItem.objects.aggregate(total=Sum(F("quantity") * F("unit_cost")))[
                "total"
            ]
            or 0
        )

        # Invoice statistics (single query with annotation)
        invoice_stats = WorkOrderInvoice.objects.aggregate(
            outstanding_invoices=Sum("total_amount", filter=Q(is_paid=False)),
            overdue_invoices=Sum(
                "total_amount", filter=Q(is_paid=False, due_date__lt=today)
            ),
        )
        outstanding_invoices = invoice_stats["outstanding_invoices"] or 0
        overdue_invoices = invoice_stats["overdue_invoices"] or 0

        # Create or update snapshot
        snapshot, created = cls.objects.get_or_create(
            date=today,
            defaults={
                "total_revenue": total_revenue,
                "total_deals": total_deals,
                "won_deals": won_deals,
                "lost_deals": lost_deals,
                "active_projects": active_projects,
                "completed_projects": completed_projects,
                "total_contacts": total_contacts,
                "total_accounts": total_accounts,
                "inventory_value": inventory_value,
                "outstanding_invoices": outstanding_invoices,
                "overdue_invoices": overdue_invoices,
            },
        )

        if not created:
            # Update existing snapshot
            snapshot.total_revenue = total_revenue
            snapshot.total_deals = total_deals
            snapshot.won_deals = won_deals
            snapshot.lost_deals = lost_deals
            snapshot.active_projects = active_projects
            snapshot.completed_projects = completed_projects
            snapshot.total_contacts = total_contacts
            snapshot.total_accounts = total_accounts
            snapshot.inventory_value = inventory_value
            snapshot.outstanding_invoices = outstanding_invoices
            snapshot.overdue_invoices = overdue_invoices
            snapshot.save()

        return snapshot


class DealPrediction(models.Model):
    """
    Machine learning predictions for deal outcomes.
    Implements predictive analytics for REQ-301.
    """

    deal = models.OneToOneField(
        Deal, on_delete=models.CASCADE, related_name="prediction"
    )
    predicted_outcome = models.CharField(
        max_length=20,
        choices=[
            ("won", "Will Win"),
            ("lost", "Will Lose"),
            ("pending", "Still Pending"),
        ],
    )
    confidence_score = models.DecimalField(
        max_digits=3, decimal_places=2
    )  # 0.00 to 1.00
    predicted_close_date = models.DateField(null=True, blank=True)
    factors = models.JSONField(default=dict)  # Store prediction factors
    model_version = models.CharField(max_length=50, default="v1.0")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"Prediction for {self.deal.title}: "
            f"{self.predicted_outcome} ({self.confidence_score})"
        )


class CustomerLifetimeValue(models.Model):
    """
    Calculated customer lifetime value metrics.
    Implements CLV calculations for REQ-301.
    """

    contact = models.OneToOneField(
        Contact, on_delete=models.CASCADE, related_name="clv"
    )
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deals = models.PositiveIntegerField(default=0)
    average_deal_size = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deal_win_rate = models.DecimalField(
        max_digits=3, decimal_places=2, default=0
    )  # 0.00 to 1.00
    customer_since = models.DateField()
    last_activity = models.DateField()
    predicted_clv = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    clv_confidence = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    segments = models.JSONField(default=list)  # Customer segments
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"CLV for {self.contact}: ${self.predicted_clv}"

    @classmethod
    def calculate_for_contact(cls, contact):
        """Calculate CLV for a specific contact"""
        from django.db.models import Avg, Sum
        from django.utils import timezone

        # Get deal statistics
        deals = Deal.objects.filter(primary_contact=contact)
        total_deals = deals.count()
        won_deals = deals.filter(status="won")
        total_revenue = won_deals.aggregate(total=Sum("value"))["total"] or 0
        average_deal_size = won_deals.aggregate(avg=Avg("value"))["avg"] or 0
        deal_win_rate = won_deals.count() / total_deals if total_deals > 0 else 0

        # Calculate customer tenure
        customer_since = contact.created_at.date()
        last_activity = max(
            contact.created_at.date(),
            deals.order_by("-updated_at").first().updated_at.date()
            if deals.exists()
            else contact.created_at.date(),
        )

        # Simple CLV prediction (can be enhanced with ML)
        months_active = (timezone.now().date() - customer_since).days / 30
        monthly_revenue = total_revenue / max(months_active, 1)
        predicted_clv = monthly_revenue * 12 * 3  # 3-year prediction
        clv_confidence = min(0.9, total_deals / 10)  # Confidence based on deal history

        # Customer segments
        segments = []
        if total_revenue > 10000:
            segments.append("high_value")
        elif total_revenue > 5000:
            segments.append("medium_value")
        else:
            segments.append("low_value")

        if deal_win_rate > 0.7:
            segments.append("high_conversion")
        if months_active > 12:
            segments.append("loyal")

        # Create or update CLV record
        clv, created = cls.objects.get_or_create(
            contact=contact,
            defaults={
                "total_revenue": total_revenue,
                "total_deals": total_deals,
                "average_deal_size": average_deal_size,
                "deal_win_rate": deal_win_rate,
                "customer_since": customer_since,
                "last_activity": last_activity,
                "predicted_clv": predicted_clv,
                "clv_confidence": clv_confidence,
                "segments": segments,
            },
        )

        if not created:
            clv.total_revenue = total_revenue
            clv.total_deals = total_deals
            clv.average_deal_size = average_deal_size
            clv.deal_win_rate = deal_win_rate
            clv.customer_since = customer_since
            clv.last_activity = last_activity
            clv.predicted_clv = predicted_clv
            clv.clv_confidence = clv_confidence
            clv.segments = segments
            clv.save()

        return clv


class RevenueForecast(models.Model):
    """
    Revenue forecasting models and predictions.
    Implements revenue forecasting for REQ-301.
    """

    forecast_date = models.DateField()
    forecast_period = models.CharField(
        max_length=20,
        choices=[
            ("monthly", "Monthly"),
            ("quarterly", "Quarterly"),
            ("annual", "Annual"),
        ],
    )
    predicted_revenue = models.DecimalField(max_digits=12, decimal_places=2)
    confidence_interval_lower = models.DecimalField(max_digits=12, decimal_places=2)
    confidence_interval_upper = models.DecimalField(max_digits=12, decimal_places=2)
    forecast_method = models.CharField(
        max_length=50,
        choices=[
            ("linear_regression", "Linear Regression"),
            ("moving_average", "Moving Average"),
            ("seasonal_arima", "Seasonal ARIMA"),
        ],
    )
    factors = models.JSONField(default=dict)  # Forecast factors and assumptions
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("forecast_date", "forecast_period", "forecast_method")
        ordering = ["-forecast_date"]

    def __str__(self):
        return f"{self.forecast_period.title()} forecast: ${self.predicted_revenue}"


# Phase 4: Technician & User Management Models


class Certification(models.Model):
    """
    Certification model for technician qualifications.
    Implements REQ-401: certification tracking with expiration.
    """

    CATEGORY_CHOICES = [
        ("safety", "Safety"),
        ("equipment", "Equipment"),
        ("vendor", "Vendor Specific"),
        ("general", "General"),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    tech_level = models.PositiveIntegerField(help_text="Certification level (1-10)")
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    requires_renewal = models.BooleanField(default=True)
    renewal_period_months = models.PositiveIntegerField(null=True, blank=True)
    issuing_authority = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (Level {self.tech_level})"


class Technician(models.Model):
    """
    Technician model for field service workers.
    Implements REQ-401 through REQ-408: complete technician lifecycle management.
    """

    user = models.OneToOneField(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="technician_profile",
    )
    employee_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    hire_date = models.DateField()
    is_active = models.BooleanField(default=True)
    base_hourly_rate = models.DecimalField(max_digits=8, decimal_places=2)
    emergency_contact = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def get_active_certifications(self):
        """Get all active (non-expired) certifications"""
        from django.db import models as db_models
        from django.utils import timezone

        # Handle certifications without expiration dates (they don't expire)
        # and those with future expiration dates
        return self.certifications.filter(is_active=True).filter(
            db_models.Q(expiration_date__isnull=True)
            | db_models.Q(expiration_date__gt=timezone.now().date())
        )

    def has_certification(self, certification, min_level=None):
        """Check if technician has specific certification"""
        certs = self.get_active_certifications().filter(certification=certification)
        if not certs.exists():
            return False
        if min_level is not None:
            return certs.filter(certification__tech_level__gte=min_level).exists()
        return True

    def get_coverage_areas(self):
        """Get all active coverage areas"""
        return self.coverage_areas.filter(is_active=True)

    def is_available_on_date(self, date, start_time=None, end_time=None):
        """Check availability for specific date/time range"""
        weekday = date.weekday()
        availabilities = self.availability.filter(weekday=weekday, is_active=True)

        if not availabilities.exists():
            return False

        if start_time and end_time:
            # Check if requested time fits within availability
            for avail in availabilities:
                if avail.start_time <= start_time and avail.end_time >= end_time:
                    return True
            return False

        return True


class TechnicianCertification(models.Model):
    """
    Link model between technicians and certifications.
    Implements certification assignment and tracking.
    """

    technician = models.ForeignKey(
        Technician, on_delete=models.CASCADE, related_name="certifications"
    )
    certification = models.ForeignKey(Certification, on_delete=models.CASCADE)
    obtained_date = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)
    certificate_number = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("technician", "certification")

    def __str__(self):
        return f"{self.technician} - {self.certification}"

    @property
    def is_expired(self):
        """Check if certification is expired"""
        if not self.expiration_date:
            return False
        from django.utils import timezone

        return timezone.now().date() > self.expiration_date

    @property
    def days_until_expiry(self):
        """Calculate days until expiration"""
        if not self.expiration_date:
            return None
        from django.utils import timezone

        delta = self.expiration_date - timezone.now().date()
        return delta.days

    @property
    def is_active_and_valid(self):
        """Check if certification is both active and not expired"""
        return self.is_active and not self.is_expired


class CoverageArea(models.Model):
    """
    Geographic coverage areas for technicians.
    Implements REQ-403: coverage area validation.
    """

    technician = models.ForeignKey(
        Technician, on_delete=models.CASCADE, related_name="coverage_areas"
    )
    zip_code = models.CharField(max_length=10)
    travel_time_minutes = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("technician", "zip_code")

    def __str__(self):
        return f"{self.technician} covers {self.zip_code}"


class TechnicianAvailability(models.Model):
    """
    Weekly availability schedule for technicians.
    Implements REQ-404: availability scheduling.
    """

    WEEKDAY_CHOICES = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    ]

    technician = models.ForeignKey(
        Technician, on_delete=models.CASCADE, related_name="availability"
    )
    weekday = models.PositiveSmallIntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.technician} - {self.get_weekday_display()}"


class EnhancedUser(AbstractUser):
    """
    Enhanced user model replacing CustomUser for Phase 4.
    Implements REQ-409 through REQ-416: hierarchical user management.
    """

    groups = models.ManyToManyField(
        "auth.Group",
        verbose_name="groups",
        blank=True,
        help_text="The groups this user belongs to. A user will get all permissions "
        "granted to each of their groups.",
        related_name="enhanceduser_set",
        related_query_name="enhanceduser",
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        verbose_name="user permissions",
        blank=True,
        help_text="Specific permissions for this user.",
        related_name="enhanceduser_set",
        related_query_name="enhanceduser",
    )
    manager = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="subordinates",
    )
    technician = models.OneToOneField(
        Technician,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="user_account",
    )
    employee_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    department = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    custom_fields = models.JSONField(default=dict)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_full_name()} ({self.username})"

    @property
    def is_account_locked(self):
        """Check if account is currently locked"""
        if not self.account_locked_until:
            return False
        from django.utils import timezone

        return timezone.now() < self.account_locked_until

    def get_hierarchy_level(self):
        """Get the depth level in the management hierarchy"""
        level = 0
        current = self.manager
        while current:
            level += 1
            current = current.manager
        return level

    def get_all_subordinates(self):
        """Get all subordinates recursively"""
        subordinates = set()
        direct_subs = self.subordinates.all()
        subordinates.update(direct_subs)

        for sub in direct_subs:
            subordinates.update(sub.get_all_subordinates())

        return subordinates

    def can_manage_user(self, user):
        """Check if this user can manage the given user"""
        if self == user:
            return False
        return user in self.get_all_subordinates()


class WorkOrderCertificationRequirement(models.Model):
    """
    Certification requirements for work orders.
    Implements work order qualification enforcement.
    """

    work_order = models.ForeignKey(
        WorkOrder, on_delete=models.CASCADE, related_name="certification_requirements"
    )
    certification = models.ForeignKey(Certification, on_delete=models.CASCADE)
    is_required = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("work_order", "certification")

    def __str__(self):
        return f"{self.work_order} requires {self.certification}"


# Advanced Field Service Management Models


class ScheduledEvent(models.Model):
    """
    Scheduled events linking work orders to technicians with date/time.
    Implements REQ-001: scheduling with recurrence support.
    """

    work_order = models.ForeignKey(
        WorkOrder, on_delete=models.CASCADE, related_name="scheduled_events"
    )
    technician = models.ForeignKey(
        Technician, on_delete=models.CASCADE, related_name="scheduled_events"
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    # Recurrence support
    recurrence_rule = models.CharField(
        max_length=255,
        blank=True,
        help_text="RRULE format for recurring events (e.g., FREQ=WEEKLY;BYDAY=MO)",
    )
    parent_event = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="recurring_instances",
    )

    # Status and notes
    status = models.CharField(
        max_length=20,
        choices=[
            ("scheduled", "Scheduled"),
            ("in_progress", "In Progress"),
            ("completed", "Completed"),
            ("cancelled", "Cancelled"),
            ("rescheduled", "Rescheduled"),
        ],
        default="scheduled",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_time"]

    def __str__(self):
        return f"{self.work_order} - {self.technician.full_name} ({self.start_time})"

    @property
    def duration_hours(self):
        """Calculate duration in hours"""
        delta = self.end_time - self.start_time
        return delta.total_seconds() / 3600

    def is_overdue(self):
        """Check if event is overdue"""
        from django.utils import timezone

        return self.status == "scheduled" and timezone.now() > self.end_time


class NotificationLog(models.Model):
    """
    Log of all automated notifications (email, SMS).
    Implements REQ-005: multi-channel notification logging.
    """

    CHANNEL_CHOICES = [
        ("email", "Email"),
        ("sms", "SMS"),
        ("push", "Push Notification"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("sent", "Sent"),
        ("failed", "Failed"),
        ("delivered", "Delivered"),
        ("bounced", "Bounced"),
    ]

    # Generic foreign key for linking to any model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    recipient = models.CharField(max_length=255)  # Email address or phone number
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    subject = models.CharField(max_length=255, blank=True)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    # Tracking fields
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    external_id = models.CharField(max_length=255, blank=True)  # Provider message ID

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.channel.upper()} to {self.recipient} - {self.status}"


class PaperworkTemplate(models.Model):
    """
    Custom document templates with conditional logic.
    Implements REQ-008: dynamic paperwork templates.
    """

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    content = models.TextField(
        help_text="HTML template with Django template syntax for conditional logic"
    )

    # Template settings
    is_active = models.BooleanField(default=True)
    requires_signature = models.BooleanField(default=False)

    # Metadata
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="paperwork_templates",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class AppointmentRequest(models.Model):
    """
    Customer self-service appointment booking requests.
    Implements REQ-012: customer portal functionality.
    """

    STATUS_CHOICES = [
        ("pending", "Pending Review"),
        ("approved", "Approved"),
        ("denied", "Denied"),
        ("scheduled", "Scheduled"),
    ]

    # Customer information
    account = models.ForeignKey(
        Account, on_delete=models.CASCADE, related_name="appointment_requests"
    )
    contact = models.ForeignKey(
        Contact, on_delete=models.CASCADE, related_name="appointment_requests"
    )

    # Request details
    requested_start_time = models.DateTimeField()
    requested_end_time = models.DateTimeField()
    work_description = models.TextField()
    priority = models.CharField(
        max_length=10, choices=Project.PRIORITY_CHOICES, default="medium"
    )

    # Approval workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    reviewed_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_appointment_requests",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)

    # Resulting scheduled event (if approved)
    scheduled_event = models.OneToOneField(
        ScheduledEvent,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="appointment_request",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Request from {self.contact} - {self.requested_start_time}"


class DigitalSignature(models.Model):
    """
    Digital signatures for paperwork.
    Implements REQ-015: digital signature capture.
    """

    # Generic foreign key (typically links to WorkOrder)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    # Signature data
    signature_data = models.TextField(help_text="Base64 encoded signature image")
    signer_name = models.CharField(max_length=255)
    signer_email = models.EmailField(blank=True)

    # Document information
    document_name = models.CharField(max_length=255)
    paperwork_template = models.ForeignKey(
        PaperworkTemplate, null=True, blank=True, on_delete=models.SET_NULL
    )

    # Verification
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    signed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Signature by {self.signer_name} on {self.document_name}"


class InventoryReservation(models.Model):
    """
    Inventory reservations for scheduled work orders.
    Implements REQ-017: inventory integration.
    """

    STATUS_CHOICES = [
        ("reserved", "Reserved"),
        ("allocated", "Allocated"),
        ("consumed", "Consumed"),
        ("released", "Released"),
    ]

    scheduled_event = models.ForeignKey(
        ScheduledEvent, on_delete=models.CASCADE, related_name="inventory_reservations"
    )
    warehouse_item = models.ForeignKey(
        WarehouseItem, on_delete=models.CASCADE, related_name="reservations"
    )

    quantity_reserved = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_consumed = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="reserved")
    reserved_by = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="inventory_reservations"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("scheduled_event", "warehouse_item")

    def __str__(self):
        return (
            f"Reserved {self.quantity_reserved} {self.warehouse_item.name} "
            f"for {self.scheduled_event}"
        )

    def release_reservation(self):
        """Release the inventory reservation"""
        self.status = "released"
        self.save()

    def consume_inventory(self, quantity=None):
        """Mark inventory as consumed"""
        if quantity is None:
            quantity = self.quantity_reserved

        self.quantity_consumed = min(quantity, self.quantity_reserved)
        self.status = "consumed"
        self.save()


class SchedulingAnalytics(models.Model):
    """
    Analytics snapshots for scheduling performance.
    Implements REQ-018: scheduling analytics dashboard.
    """

    date = models.DateField(unique=True)

    # Technician metrics
    total_technicians = models.PositiveIntegerField(default=0)
    active_technicians = models.PositiveIntegerField(default=0)
    average_utilization_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0
    )

    # Scheduling metrics
    total_scheduled_events = models.PositiveIntegerField(default=0)
    completed_events = models.PositiveIntegerField(default=0)
    cancelled_events = models.PositiveIntegerField(default=0)
    rescheduled_events = models.PositiveIntegerField(default=0)

    # Performance metrics
    on_time_completion_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0
    )
    average_travel_time_minutes = models.PositiveIntegerField(default=0)
    customer_satisfaction_score = models.DecimalField(
        max_digits=3, decimal_places=2, default=0
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"Scheduling Analytics for {self.date}"

    @classmethod
    def create_daily_snapshot(cls):
        """Create daily scheduling analytics snapshot"""
        from django.db.models import Avg, Count, Q
        from django.utils import timezone

        today = timezone.now().date()

        # Technician metrics
        total_technicians = Technician.objects.count()
        active_technicians = Technician.objects.filter(is_active=True).count()

        # Scheduling metrics for today
        events_today = ScheduledEvent.objects.filter(start_time__date=today)
        total_scheduled_events = events_today.count()
        completed_events = events_today.filter(status="completed").count()
        cancelled_events = events_today.filter(status="cancelled").count()
        rescheduled_events = events_today.filter(status="rescheduled").count()

        # Calculate on-time completion rate
        on_time_rate = 0
        if completed_events > 0:
            # Simplified calculation - can be enhanced with actual completion times
            on_time_rate = (
                (completed_events / total_scheduled_events) * 100
                if total_scheduled_events > 0
                else 0
            )

        # Create or update snapshot
        snapshot, created = cls.objects.get_or_create(
            date=today,
            defaults={
                "total_technicians": total_technicians,
                "active_technicians": active_technicians,
                "total_scheduled_events": total_scheduled_events,
                "completed_events": completed_events,
                "cancelled_events": cancelled_events,
                "rescheduled_events": rescheduled_events,
                "on_time_completion_rate": on_time_rate,
            },
        )

        if not created:
            # Update existing snapshot
            snapshot.total_technicians = total_technicians
            snapshot.active_technicians = active_technicians
            snapshot.total_scheduled_events = total_scheduled_events
            snapshot.completed_events = completed_events
            snapshot.cancelled_events = cancelled_events
            snapshot.rescheduled_events = rescheduled_events
            snapshot.on_time_completion_rate = on_time_rate
            snapshot.save()

        return snapshot
