from django.contrib.auth import authenticate
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import (
    Account,
    ActivityLog,
    AnalyticsSnapshot,
    AppointmentRequest,
    Budget,
    BudgetV2,
    Category,
    Certification,
    Comment,
    Contact,
    CostCenter,
    CoverageArea,
    CustomerLifetimeValue,
    CustomField,
    CustomFieldValue,
    CustomUser,
    Deal,
    DealPrediction,
    DealStage,
    DefaultWorkOrderItem,
    DigitalSignature,
    EnhancedUser,
    Expense,
    Interaction,
    InventoryReservation,
    Invoice,
    InvoiceItem,
    JournalEntry,
    LedgerAccount,
    LineItem,
    LogEntry,
    MonthlyDistribution,
    Notification,
    NotificationLog,
    Page,
    PaperworkTemplate,
    Payment,
    Post,
    Project,
    ProjectTemplate,
    ProjectType,
    Quote,
    QuoteItem,
    RevenueForecast,
    RichTextContent,
    ScheduledEvent,
    SchedulingAnalytics,
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
from .search_models import BulkOperation, GlobalSearchIndex, SavedSearch


class PostSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source="author.username")
    categories = serializers.StringRelatedField(many=True, read_only=True)
    tags = serializers.StringRelatedField(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        many=True,
        source="categories",
        write_only=True,
        required=False,
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        source="tags",
        write_only=True,
        required=False,
    )

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "author",
            "content",
            "rich_content",
            "status",
            "published",
            "created_at",
            "updated_at",
            "categories",
            "tags",
            "category_ids",
            "tag_ids",
            "image",
        ]
        read_only_fields = ["author", "created_at", "updated_at"]


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source="author.username")
    post_title = serializers.CharField(source="post.title", read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "post",
            "post_title",
            "author",
            "content",
            "created_at",
            "approved",
        ]
        read_only_fields = ["author", "created_at"]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "is_superuser",
        ]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]


class AccountSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    account_name = serializers.CharField(source="name", read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        source="tags",
        write_only=True,
        required=False,
    )

    class Meta:
        model = Account
        fields = [
            "id",
            "name",
            "industry",
            "website",
            "phone_number",
            "phone",  # back-compat exposure
            "address",
            "notes",
            "owner",
            "created_at",
            "updated_at",
            "account_name",
            "tags",
            "tag_ids",
        ]


class ContactSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    account = AccountSerializer(read_only=True)
    account_id = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(),
        source="account",
        write_only=True,
        required=False,
        allow_null=True,
    )
    email = serializers.EmailField()
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        source="tags",
        write_only=True,
        required=False,
    )

    # Email uniqueness validation removed to allow multiple contacts with the same email.

    class Meta:
        model = Contact
        fields = [
            "id",
            "account",
            "account_id",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "phone",  # back-compat exposure
            "title",
            "owner",
            "created_at",
            "updated_at",
            "tags",
            "tag_ids",
        ]


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login. Handles authentication with username or email.
    """

    username = serializers.CharField(required=True)
    password = serializers.CharField(
        label=_("Password"),
        style={"input_type": "password"},
        trim_whitespace=False,
        required=True,
    )

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        if not username or not password:
            raise serializers.ValidationError(
                _('Must include "username" and "password".'), code="authorization"
            )

        # Try to authenticate with username or email
        user = authenticate(
            request=self.context.get("request"), username=username, password=password
        )

        if not user:
            # If authentication fails, raise a validation error.
            msg = _("Unable to log in with provided credentials.")
            raise serializers.ValidationError(msg, code="authorization")

        attrs["user"] = user
        return attrs


class ProjectSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    is_overdue = serializers.ReadOnlyField()
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), source="assigned_to", write_only=True
    )
    due_date = serializers.DateField()

    class Meta:
        model = Project
        fields = "__all__"
        extra_kwargs = {
            "assigned_to": {"read_only": True},
        }


class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = ActivityLog
        fields = "__all__"


class ProjectTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectType
        fields = ["id", "name", "is_active"]


class DealStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DealStage
        fields = "__all__"


class DealSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    account_name = serializers.CharField(source="account.name", read_only=True)
    primary_contact_name = serializers.SerializerMethodField()
    stage_name = serializers.CharField(source="stage.name", read_only=True)
    # Back-compat: accept legacy 'name' and 'title' interchangeably
    name = serializers.CharField(source="title", required=False, allow_blank=True)

    class Meta:
        model = Deal
        fields = [
            "id",
            "title",
            "name",
            "account",
            "primary_contact",
            "stage",
            "value",
            "close_date",
            "owner",
            "status",
            "created_at",
            "updated_at",
            "owner_username",
            "account_name",
            "primary_contact_name",
            "stage_name",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
            "owner_username",
            "account_name",
            "primary_contact_name",
            "stage_name",
        ]

    def get_primary_contact_name(self, obj):
        if obj.primary_contact:
            return f"{obj.primary_contact.first_name} {obj.primary_contact.last_name}"
        return None

    def validate(self, attrs):
        # Map legacy 'title'/'name' interplay: handle both directions properly
        data = super().validate(attrs)

        # Get the actual input values (before field mapping)
        initial_data = getattr(self, "initial_data", {})
        initial_title = initial_data.get("title")
        initial_name = initial_data.get("name")

        # Current validated title (may have been overwritten by name field mapping)
        current_title = data.get("title")

        # Priority logic: title from initial_data takes precedence over name->title mapping
        if initial_title and initial_title.strip():
            # Use the explicitly provided title
            data["title"] = initial_title
        elif (
            (not current_title or current_title == "")
            and initial_name
            and initial_name.strip()
        ):
            # Use name if title is empty but name has value
            data["title"] = initial_name

        return data


class InteractionSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Interaction
        fields = "__all__"


class QuoteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteItem
        fields = "__all__"


class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, read_only=True)

    class Meta:
        model = Quote
        fields = "__all__"


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = "__all__"


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = "__all__"


class CustomFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomField
        fields = "__all__"


class CustomFieldValueSerializer(serializers.ModelSerializer):
    field_name = serializers.CharField(source="custom_field.name", read_only=True)
    field_type = serializers.CharField(source="custom_field.field_type", read_only=True)

    class Meta:
        model = CustomFieldValue
        fields = ["id", "field_name", "field_type", "value"]


class ContactWithCustomFieldsSerializer(ContactSerializer):
    custom_fields = serializers.SerializerMethodField()

    class Meta(ContactSerializer.Meta):
        fields = list(ContactSerializer.Meta.fields) + ["custom_fields"]

    def get_custom_fields(self, obj):
        # Use prefetched custom field values if available to avoid N+1 queries
        values = getattr(obj, "prefetched_custom_field_values", None)
        if values is None:
            content_type = ContentType.objects.get_for_model(obj)
            values = CustomFieldValue.objects.filter(
                content_type=content_type, object_id=obj.id
            )
        else:
            values = [v for v in values if v.object_id == obj.id]
        return CustomFieldValueSerializer(values, many=True).data


class AccountWithCustomFieldsSerializer(AccountSerializer):
    custom_fields = serializers.SerializerMethodField()

    class Meta(AccountSerializer.Meta):
        fields = list(AccountSerializer.Meta.fields) + ["custom_fields"]

    def get_custom_fields(self, obj):
        values = getattr(obj, "custom_field_values", None)
        if values is None:
            content_type = ContentType.objects.get_for_model(obj)
            values = CustomFieldValue.objects.filter(
                content_type=content_type, object_id=obj.id
            )
        return CustomFieldValueSerializer(values, many=True).data


class CustomUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    groups = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_active",
            "is_superuser",
            "date_joined",
            "groups",
        ]
        read_only_fields = ["date_joined"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class SavedSearchSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    search_type_display = serializers.CharField(
        source="get_search_type_display", read_only=True
    )

    class Meta:
        model = SavedSearch
        fields = [
            "id",
            "name",
            "description",
            "user",
            "user_name",
            "search_type",
            "search_type_display",
            "search_query",
            "filters",
            "sort_by",
            "sort_order",
            "is_public",
            "created_at",
            "updated_at",
            "last_used",
            "use_count",
        ]
        read_only_fields = [
            "user",
            "created_at",
            "updated_at",
            "last_used",
            "use_count",
        ]


class GlobalSearchIndexSerializer(serializers.ModelSerializer):
    entity_type_display = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = GlobalSearchIndex
        fields = [
            "id",
            "title",
            "content",
            "tags",
            "entity_type",
            "entity_type_display",
            "owner",
            "owner_name",
            "created_at",
            "updated_at",
            "boost_score",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_entity_type_display(self, obj):
        return obj.entity_type.title()


class BulkOperationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    operation_type_display = serializers.CharField(
        source="get_operation_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    duration = serializers.ReadOnlyField()

    class Meta:
        model = BulkOperation
        fields = [
            "id",
            "operation_type",
            "operation_type_display",
            "status",
            "status_display",
            "user",
            "user_name",
            "entity_type",
            "total_records",
            "processed_records",
            "successful_records",
            "failed_records",
            "progress_percentage",
            "duration",
            "filters",
            "operation_data",
            "results",
            "error_message",
            "created_at",
            "started_at",
            "completed_at",
        ]
        read_only_fields = [
            "user",
            "created_at",
            "started_at",
            "completed_at",
            "processed_records",
            "successful_records",
            "failed_records",
        ]


class SearchResultSerializer(serializers.Serializer):
    """Serializer for search results"""

    id = serializers.IntegerField()
    type = serializers.CharField()
    title = serializers.CharField()
    url = serializers.CharField()
    email = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)
    status = serializers.CharField(required=False)
    priority = serializers.CharField(required=False)
    value = serializers.FloatField(required=False)
    due_date = serializers.CharField(required=False)
    created_at = serializers.CharField(required=False)


class DefaultWorkOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DefaultWorkOrderItem
        fields = [
            "id",
            "item_type",
            "description",
            "quantity",
            "unit_price",
            "serial_number",
        ]


class ProjectTemplateSerializer(serializers.ModelSerializer):
    default_items = DefaultWorkOrderItemSerializer(many=True, required=False)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = ProjectTemplate
        fields = [
            "id",
            "name",
            "description",
            "default_title",
            "default_description",
            "default_project_type",
            "default_priority",
            "created_by",
            "created_at",
            "updated_at",
            "default_items",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]

    def create(self, validated_data):
        items_data = validated_data.pop("default_items", [])
        template = ProjectTemplate.objects.create(**validated_data)
        for item_data in items_data:
            DefaultWorkOrderItem.objects.create(template=template, **item_data)
        return template

    def update(self, instance, validated_data):
        items_data = validated_data.pop("default_items", None)

        # Update the ProjectTemplate instance fields
        instance.name = validated_data.get("name", instance.name)
        instance.description = validated_data.get("description", instance.description)
        instance.default_title = validated_data.get(
            "default_title", instance.default_title
        )
        instance.default_description = validated_data.get(
            "default_description", instance.default_description
        )
        instance.default_task_type = validated_data.get(
            "default_task_type", instance.default_task_type
        )
        instance.default_project_type = validated_data.get(
            "default_project_type", instance.default_project_type
        )
        instance.save()
        if items_data is not None:
            # Delete items that are not in the new list
            item_ids_to_keep = [item.get("id") for item in items_data if item.get("id")]
            instance.default_items.exclude(id__in=item_ids_to_keep).delete()

            # Create or update items
            for item_data in items_data:
                item_id = item_data.get("id")
                if item_id:
                    # Update existing item
                    item_instance = DefaultWorkOrderItem.objects.get(
                        id=item_id, template=instance
                    )
                    item_instance.item_type = item_data.get(
                        "item_type", item_instance.item_type
                    )
                    item_instance.description = item_data.get(
                        "description", item_instance.description
                    )
                    item_instance.quantity = item_data.get(
                        "quantity", item_instance.quantity
                    )
                    item_instance.unit_price = item_data.get(
                        "unit_price", item_instance.unit_price
                    )
                    item_instance.serial_number = item_data.get(
                        "serial_number", item_instance.serial_number
                    )
                    item_instance.save()
                else:
                    # Create new item
                    DefaultWorkOrderItem.objects.create(template=instance, **item_data)

        return instance


class LedgerAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerAccount
        fields = ["id", "name", "code", "account_type"]


class JournalEntrySerializer(serializers.ModelSerializer):
    debit_account = serializers.StringRelatedField(read_only=True)
    credit_account = serializers.StringRelatedField(read_only=True)
    debit_account_id = serializers.PrimaryKeyRelatedField(
        queryset=LedgerAccount.objects.all(),
        source="debit_account",
        write_only=True,
        required=True,
    )
    credit_account_id = serializers.PrimaryKeyRelatedField(
        queryset=LedgerAccount.objects.all(),
        source="credit_account",
        write_only=True,
        required=True,
    )

    class Meta:
        model = JournalEntry
        fields = [
            "id",
            "date",
            "description",
            "debit_account",
            "debit_account_id",
            "credit_account",
            "credit_account_id",
            "amount",
            "created_at",
        ]


class LineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LineItem
        fields = ["id", "work_order", "description", "quantity", "unit_price", "total"]


class WorkOrderSerializer(serializers.ModelSerializer):
    line_items = LineItemSerializer(many=True, read_only=True)

    class Meta:
        model = WorkOrder
        fields = [
            "id",
            "project",
            "description",
            "created_at",
            "updated_at",
            "status",
            "line_items",
        ]


class PaymentSerializer(serializers.ModelSerializer):
    # Use content_type and object_id for generic relation (Invoice, WorkOrderInvoice, etc.)
    content_type = serializers.PrimaryKeyRelatedField(
        queryset=ContentType.objects.all(), write_only=True
    )
    object_id = serializers.IntegerField(write_only=True)
    related_object = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "content_type",
            "object_id",
            "related_object",
            "amount",
            "payment_date",
            "method",
            "received_by",
            "created_at",
        ]

    def get_related_object(self, obj):
        # Optionally return a string representation of the related object
        return str(obj.content_object) if obj.content_object else None

    def create(self, validated_data):
        content_type = validated_data.pop("content_type")
        object_id = validated_data.pop("object_id")
        payment = Payment.objects.create(
            content_type=content_type, object_id=object_id, **validated_data
        )
        return payment


class WorkOrderInvoiceSerializer(serializers.ModelSerializer):
    work_order_description = serializers.CharField(
        source="work_order.description", read_only=True
    )
    is_overdue = serializers.SerializerMethodField()
    days_overdue = serializers.SerializerMethodField()

    class Meta:
        model = WorkOrderInvoice
        fields = [
            "id",
            "work_order",
            "work_order_description",
            "issued_date",
            "due_date",
            "payment_terms",
            "total_amount",
            "is_paid",
            "paid_date",
            "is_overdue",
            "days_overdue",
            "created_at",
        ]
        read_only_fields = ["total_amount"]

    def get_is_overdue(self, obj):
        return obj.is_overdue()

    def get_days_overdue(self, obj):
        return obj.days_overdue()


class ExpenseSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.CharField(
        source="submitted_by.get_full_name", read_only=True
    )
    approved_by_name = serializers.CharField(
        source="approved_by.get_full_name", read_only=True
    )
    receipt_url = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            "id",
            "date",
            "amount",
            "category",
            "description",
            "vendor",
            "receipt",
            "receipt_url",
            "submitted_by",
            "submitted_by_name",
            "approved",
            "approved_by",
            "approved_by_name",
            "approved_at",
            "created_at",
        ]
        read_only_fields = ["submitted_by", "approved_by", "approved_at"]

    def get_receipt_url(self, obj):
        if obj.receipt:
            return obj.receipt.url
        return None

    def create(self, validated_data):
        validated_data["submitted_by"] = self.context["request"].user
        return super().create(validated_data)


class BudgetSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )

    class Meta:
        model = Budget
        fields = [
            "id",
            "name",
            "budget_type",
            "year",
            "month",
            "quarter",
            "categories",
            "created_by",
            "created_by_name",
            "created_at",
        ]
        read_only_fields = ["created_by"]

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class TimeEntrySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    total_amount = serializers.ReadOnlyField()

    class Meta:
        model = TimeEntry
        fields = [
            "id",
            "project",
            "project_title",
            "user",
            "user_name",
            "date",
            "hours",
            "description",
            "billable",
            "hourly_rate",
            "total_amount",
            "billed",
            "created_at",
        ]
        read_only_fields = ["user", "total_amount"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class WarehouseSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source="manager.get_full_name", read_only=True)
    item_count = serializers.SerializerMethodField()
    total_value = serializers.SerializerMethodField()

    class Meta:
        model = Warehouse
        fields = [
            "id",
            "name",
            "location",
            "manager",
            "manager_name",
            "is_active",
            "created_at",
            "item_count",
            "total_value",
        ]
        read_only_fields = ["created_at"]

    def get_item_count(self, obj):
        return obj.items.count()

    def get_total_value(self, obj):
        return sum(item.total_value for item in obj.items.all())


class WarehouseItemSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    total_value = serializers.ReadOnlyField()

    class Meta:
        model = WarehouseItem
        fields = [
            "id",
            "warehouse",
            "warehouse_name",
            "name",
            "description",
            "item_type",
            "sku",
            "gtin",
            "quantity",
            "unit_cost",
            "minimum_stock",
            "serial_number",
            "location_in_warehouse",
            "is_low_stock",
            "total_value",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_gtin(self, value):
        """Normalize and validate GTIN rules:
        - Accept 7–14 digits only
        - If 14 digits, validate GS1 check digit
        - Store digits-only value as provided (no zero-padding persisted)
        """
        if value in (None, ""):
            return value
        if not isinstance(value, str):
            value = str(value)
        value = value.strip()
        if not value.isdigit():
            raise serializers.ValidationError(_("GTIN must be digits-only"))
        length = len(value)
        if length < 7 or length > 14:
            raise serializers.ValidationError(_("GTIN must be 7 to 14 digits long"))

        if length == 14:
            base = value[:-1]
            # compute GS1 check digit (weights 3,1 from right)
            total = 0
            for i, ch in enumerate(reversed(base), start=1):
                d = ord(ch) - 48
                total += d * (3 if (i % 2 == 1) else 1)
            mod = total % 10
            check_digit = 0 if mod == 0 else 10 - mod
            if (ord(value[-1]) - 48) != check_digit:
                raise serializers.ValidationError(_("Invalid GTIN check digit"))

        return value


class CostCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostCenter
        fields = ["id", "name", "code", "description"]


class MonthlyDistributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyDistribution
        fields = ["id", "month", "percent"]


class BudgetV2Serializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )
    cost_center_name = serializers.CharField(source="cost_center.name", read_only=True)
    # Read-only view of persisted distributions; accept nested writes via create/update overrides
    distributions = MonthlyDistributionSerializer(
        source="monthly_distributions", many=True, read_only=True
    )

    class Meta:
        model = BudgetV2
        fields = [
            "id",
            "name",
            "year",
            "cost_center",
            "cost_center_name",
            "project",
            "created_by",
            "created_by_name",
            "created_at",
            "distributions",
        ]
        read_only_fields = ["created_by", "created_at", "distributions"]

    def create(self, validated_data):
        from django.db import transaction

        # Try to get nested distributions from validated_data (if a write-only field
        # maps it) or fall back to raw initial_data for convenience
        rows = validated_data.pop("distributions", None)
        if rows is None:
            data = getattr(self, "initial_data", None)
            if isinstance(data, dict):
                rows = data.get("distributions")

        validated_data["created_by"] = self.context["request"].user
        with transaction.atomic():
            instance = super().create(validated_data)
            if rows:
                self._replace_distributions(instance, rows)
            else:
                # Seed default 12-month distribution upon create
                try:
                    instance.seed_default_distribution()
                except Exception:
                    pass
        return instance

    def update(self, instance, validated_data):
        from django.db import transaction

        # Same nested write semantics on update: if 'distributions' present,
        # validate and replace atomically; otherwise leave as-is.
        rows = validated_data.pop("distributions", None)
        if rows is None:
            data = getattr(self, "initial_data", None)
            if isinstance(data, dict):
                rows = data.get("distributions")

        with transaction.atomic():
            instance = super().update(instance, validated_data)
            if rows is not None:
                self._replace_distributions(instance, rows)
        return instance

    # Internal helpers -----------------------------------------------------
    def _replace_distributions(self, budget: BudgetV2, rows):
        """Validate and replace distributions for a budget.

        Validation rules (mirrors endpoint behavior):
          - must be a list of exactly 12 items
          - months must be unique and in 1..12
          - percent 0..100 and total exactly 100.00 (rounded to 2 dp)
        """
        from decimal import ROUND_HALF_UP, Decimal

        from rest_framework.exceptions import ValidationError

        if not isinstance(rows, list):
            raise ValidationError(
                {"detail": _("distributions must be a list of 12 rows")}
            )
        if len(rows) != 12:
            raise ValidationError(
                {
                    "detail": _("Exactly 12 months required (got %(count)s)")
                    % {"count": len(rows)}
                }
            )

        seen = set()
        total = Decimal("0.00")
        cleaned: list[tuple[int, Decimal]] = []
        errors: list[str] = []
        for idx, r in enumerate(rows, start=1):
            try:
                m = int(r.get("month"))
                p = Decimal(str(r.get("percent")))
            except Exception:
                raise ValidationError(
                    {
                        "detail": _(
                            "Row %(idx)s must include numeric month and percent"
                        )
                        % {"idx": idx}
                    }
                )
            if m < 1 or m > 12:
                errors.append(
                    _("Row %(idx)s: month %(m)s out of range (1..12)")
                    % {"idx": idx, "m": m}
                )
            if m in seen:
                errors.append(_("Duplicate month %(m)s") % {"m": m})
            seen.add(m)
            if p < Decimal("0.00") or p > Decimal("100.00"):
                errors.append(
                    _("Row %(idx)s: percent %(p)s out of bounds (0..100)")
                    % {"idx": idx, "p": p}
                )
            total += p
            cleaned.append((m, p))

        total = total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if total != Decimal("100.00"):
            errors.append(
                _("Total percent must be 100.00 (got %(total)s)") % {"total": total}
            )

        if errors:
            raise ValidationError(
                {"detail": _("Invalid distributions"), "errors": errors}
            )

        # Persist atomically: replace all rows
        from .models import MonthlyDistribution

        MonthlyDistribution.objects.filter(budget=budget).delete()
        for m, p in sorted(cleaned, key=lambda t: t[0]):
            MonthlyDistribution.objects.create(budget=budget, month=m, percent=p)


# Phase 3: Advanced Analytics Serializers
class AnalyticsSnapshotSerializer(serializers.ModelSerializer):
    """Serializer for analytics snapshots"""

    class Meta:
        model = AnalyticsSnapshot
        fields = [
            "id",
            "date",
            "total_revenue",
            "total_deals",
            "won_deals",
            "lost_deals",
            "active_projects",
            "completed_projects",
            "total_contacts",
            "total_accounts",
            "inventory_value",
            "outstanding_invoices",
            "overdue_invoices",
            "created_at",
        ]
        read_only_fields = ["created_at"]


class DealPredictionSerializer(serializers.ModelSerializer):
    """Serializer for deal outcome predictions"""

    deal_title = serializers.CharField(source="deal.title", read_only=True)
    deal_value = serializers.DecimalField(
        source="deal.value", max_digits=10, decimal_places=2, read_only=True
    )
    confidence_percentage = serializers.SerializerMethodField()

    class Meta:
        model = DealPrediction
        fields = [
            "id",
            "deal",
            "deal_title",
            "deal_value",
            "predicted_outcome",
            "confidence_score",
            "confidence_percentage",
            "predicted_close_date",
            "factors",
            "model_version",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_confidence_percentage(self, obj):
        return f"{obj.confidence_score * 100:.1f}%"


class CustomerLifetimeValueSerializer(serializers.ModelSerializer):
    """Serializer for customer lifetime value data"""

    contact_name = serializers.SerializerMethodField()
    contact_email = serializers.CharField(source="contact.email", read_only=True)

    class Meta:
        model = CustomerLifetimeValue
        fields = [
            "id",
            "contact",
            "contact_name",
            "contact_email",
            "total_revenue",
            "total_deals",
            "average_deal_size",
            "deal_win_rate",
            "customer_since",
            "last_activity",
            "predicted_clv",
            "clv_confidence",
            "segments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_contact_name(self, obj):
        return f"{obj.contact.first_name} {obj.contact.last_name}"


class RevenueForecastSerializer(serializers.ModelSerializer):
    """Serializer for revenue forecasting"""

    class Meta:
        model = RevenueForecast
        fields = [
            "id",
            "forecast_date",
            "forecast_period",
            "predicted_revenue",
            "confidence_interval_lower",
            "confidence_interval_upper",
            "forecast_method",
            "factors",
            "created_at",
        ]
        read_only_fields = ["created_at"]


# Phase 4: Technician & User Management Serializers


class CertificationSerializer(serializers.ModelSerializer):
    """Serializer for technician certifications"""

    class Meta:
        model = Certification
        fields = [
            "id",
            "name",
            "description",
            "tech_level",
            "category",
            "requires_renewal",
            "renewal_period_months",
            "issuing_authority",
            "created_at",
        ]


class TechnicianCertificationSerializer(serializers.ModelSerializer):
    """Serializer for technician certification links"""

    certification_name = serializers.CharField(
        source="certification.name", read_only=True
    )
    certification_level = serializers.IntegerField(
        source="certification.tech_level", read_only=True
    )
    is_expired = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()

    class Meta:
        model = TechnicianCertification
        fields = [
            "id",
            "technician",
            "certification",
            "certification_name",
            "certification_level",
            "obtained_date",
            "expiration_date",
            "certificate_number",
            "is_active",
            "is_expired",
            "days_until_expiry",
            "created_at",
        ]


class CoverageAreaSerializer(serializers.ModelSerializer):
    """Serializer for technician coverage areas"""

    technician_name = serializers.CharField(
        source="technician.full_name", read_only=True
    )

    class Meta:
        model = CoverageArea
        fields = [
            "id",
            "technician",
            "technician_name",
            "zip_code",
            "travel_time_minutes",
            "is_primary",
            "is_active",
            "created_at",
        ]


class CoverageShapeSerializer(serializers.ModelSerializer):
    """Serializer for JSON-backed geometric coverage shapes"""

    technician_name = serializers.CharField(
        source="technician.full_name", read_only=True
    )

    class Meta:
        from .models import CoverageShape

        model = CoverageShape
        fields = [
            "id",
            "technician",
            "technician_name",
            "name",
            "description",
            "area_type",
            "geometry",
            "color",
            "priority_level",
            "properties",
            "is_active",
            "created_at",
        ]

    def validate(self, attrs):
        area_type = attrs.get("area_type") or getattr(self.instance, "area_type", None)
        geometry = attrs.get("geometry") or getattr(self.instance, "geometry", None)

        if not area_type:
            return attrs

        errors = {}
        if area_type == "polygon":
            coords = (geometry or {}).get("coordinates") if isinstance(geometry, dict) else None
            if not isinstance(coords, list) or len(coords) < 3:
                errors["geometry"] = "Polygon requires coordinates with at least 3 points"
            else:
                for pt in coords:
                    if not (
                        isinstance(pt, (list, tuple))
                        and len(pt) == 2
                        and all(isinstance(n, (int, float)) for n in pt)
                    ):
                        errors["geometry"] = "Each coordinate must be [lng, lat]"
                        break
        elif area_type == "circle":
            center = (geometry or {}).get("center") if isinstance(geometry, dict) else None
            radius = (geometry or {}).get("radius_m") if isinstance(geometry, dict) else None
            if not (
                isinstance(center, (list, tuple))
                and len(center) == 2
                and all(isinstance(n, (int, float)) for n in center)
            ):
                errors["geometry"] = "Circle requires center [lng, lat]"
            if not (isinstance(radius, (int, float)) and radius > 0):
                errors["geometry"] = "Circle requires positive radius_m"

        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class TechnicianAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for technician availability schedules"""

    technician_name = serializers.CharField(
        source="technician.full_name", read_only=True
    )
    weekday_display = serializers.CharField(
        source="get_weekday_display", read_only=True
    )

    class Meta:
        model = TechnicianAvailability
        fields = [
            "id",
            "technician",
            "technician_name",
            "weekday",
            "weekday_display",
            "start_time",
            "end_time",
            "is_active",
            "created_at",
        ]


class TechnicianSerializer(serializers.ModelSerializer):
    """Serializer for technicians"""

    user_details = UserSerializer(source="user", read_only=True)
    full_name = serializers.ReadOnlyField()
    active_certifications = TechnicianCertificationSerializer(
        source="techniciancertification_set", many=True, read_only=True
    )
    coverage_areas = CoverageAreaSerializer(
        source="coveragearea_set", many=True, read_only=True
    )
    availability = TechnicianAvailabilitySerializer(
        source="technicianavailability_set", many=True, read_only=True
    )

    class Meta:
        model = Technician
        fields = [
            "id",
            "user",
            "user_details",
            "employee_id",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "email",
            "hire_date",
            "is_active",
            "base_hourly_rate",
            "emergency_contact",
            "active_certifications",
            "coverage_areas",
            "availability",
            "created_at",
            "updated_at",
        ]


class EnhancedUserSerializer(serializers.ModelSerializer):
    """Enhanced serializer for user management with hierarchy"""

    manager_name = serializers.CharField(source="manager.get_full_name", read_only=True)
    technician_details = TechnicianSerializer(source="technician", read_only=True)
    subordinates_count = serializers.SerializerMethodField()
    hierarchy_level = serializers.SerializerMethodField()
    is_account_locked = serializers.ReadOnlyField()

    class Meta:
        model = EnhancedUser
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "manager",
            "manager_name",
            "technician",
            "technician_details",
            "employee_id",
            "department",
            "job_title",
            "phone",
            "hire_date",
            "custom_fields",
            "is_active",
            "is_staff",
            "is_superuser",
            "last_login",
            "last_login_ip",
            "failed_login_attempts",
            "account_locked_until",
            "is_account_locked",
            "subordinates_count",
            "hierarchy_level",
            "date_joined",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "last_login",
            "last_login_ip",
            "failed_login_attempts",
            "account_locked_until",
            "date_joined",
            "created_at",
            "updated_at",
        ]

    def get_subordinates_count(self, obj):
        return obj.subordinates.count()

    def get_hierarchy_level(self, obj):
        return obj.get_hierarchy_level()


class WorkOrderCertificationRequirementSerializer(serializers.ModelSerializer):
    """Serializer for work order certification requirements"""

    certification_name = serializers.CharField(
        source="certification.name", read_only=True
    )
    work_order_description = serializers.CharField(
        source="work_order.description", read_only=True
    )

    class Meta:
        model = WorkOrderCertificationRequirement
        fields = [
            "id",
            "work_order",
            "work_order_description",
            "certification",
            "certification_name",
            "is_required",
            "created_at",
        ]


# Missing Infrastructure Serializers


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for in-app notifications"""

    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "message",
            "created_at",
            "read",
        ]
        read_only_fields = ["user", "created_at"]


class RichTextContentSerializer(serializers.ModelSerializer):
    """Serializer for rich text content submissions"""

    class Meta:
        model = RichTextContent
        fields = [
            "id",
            "user",
            "content",
            "created_at",
            "approved",
            "moderation_notes",
            "rejection_reason",
        ]
        read_only_fields = ["user", "created_at"]


class LogEntrySerializer(serializers.ModelSerializer):
    """Serializer for system log entries"""

    class Meta:
        model = LogEntry
        fields = [
            "id",
            "timestamp",
            "level",
            "message",
            "module",
        ]
        read_only_fields = ["timestamp"]


class PageSerializer(serializers.ModelSerializer):
    """Serializer for CMS pages"""

    class Meta:
        model = Page
        fields = [
            "id",
            "title",
            "slug",
            "content",
            "rich_content",
            "image",
            "status",
            "published",
            "created_at",
            "updated_at",
            "author",
        ]
        read_only_fields = ["created_at", "updated_at"]


# ============================================================================
# FIELD SERVICE MANAGEMENT SERIALIZERS (Phase 1)
# ============================================================================


class ScheduledEventSerializer(serializers.ModelSerializer):
    """Serializer for scheduled service events"""

    technician_name = serializers.CharField(
        source="technician.full_name", read_only=True
    )
    work_order_description = serializers.CharField(
        source="work_order.description", read_only=True
    )
    customer_name = serializers.CharField(
        source="work_order.contact.full_name", read_only=True
    )

    class Meta:
        model = ScheduledEvent
        fields = [
            "id",
            "work_order",
            "technician",
            "start_time",
            "end_time",
            "status",
            "priority",
            "estimated_duration",
            "actual_duration",
            "notes",
            "created_at",
            "updated_at",
            "recurrence_pattern",
            "recurrence_end_date",
            "parent_event",
            # Read-only fields
            "technician_name",
            "work_order_description",
            "customer_name",
        ]
        read_only_fields = ["created_at", "updated_at"]


class NotificationLogSerializer(serializers.ModelSerializer):
    """Serializer for notification logs"""

    scheduled_event_info = serializers.CharField(
        source="scheduled_event.__str__", read_only=True
    )

    class Meta:
        model = NotificationLog
        fields = [
            "id",
            "scheduled_event",
            "notification_type",
            "channel",
            "recipient",
            "message",
            "status",
            "sent_at",
            "error_message",
            # Read-only fields
            "scheduled_event_info",
        ]
        read_only_fields = ["sent_at"]


class PaperworkTemplateSerializer(serializers.ModelSerializer):
    """Serializer for paperwork templates"""

    class Meta:
        model = PaperworkTemplate
        fields = [
            "id",
            "name",
            "description",
            "template_content",
            "template_type",
            "is_active",
            "requires_signature",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class AppointmentRequestSerializer(serializers.ModelSerializer):
    """Serializer for customer appointment requests"""

    contact_name = serializers.CharField(source="contact.full_name", read_only=True)

    class Meta:
        model = AppointmentRequest
        fields = [
            "id",
            "contact",
            "preferred_date",
            "preferred_time_start",
            "preferred_time_end",
            "service_type",
            "description",
            "priority",
            "status",
            "notes",
            "created_at",
            "processed_at",
            "processed_by",
            # Read-only fields
            "contact_name",
        ]
        read_only_fields = ["created_at", "processed_at"]


class DigitalSignatureSerializer(serializers.ModelSerializer):
    """Serializer for digital signatures (generic relation exposure minimized)."""

    class Meta:
        model = DigitalSignature
        fields = [
            "id",
            "content_type",
            "object_id",
            "signature_data",
            "signer_name",
            "signer_email",
            "document_name",
            "paperwork_template",
            "document_hash",
            "signed_at",
            "ip_address",
            "user_agent",
            "is_valid",
        ]
        read_only_fields = ["signed_at", "document_hash", "is_valid"]


class InventoryReservationSerializer(serializers.ModelSerializer):
    """Serializer for inventory reservations (aligned with model fields)."""

    class Meta:
        model = InventoryReservation
        fields = [
            "id",
            "scheduled_event",
            "warehouse_item",
            "quantity_reserved",
            "quantity_consumed",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class SchedulingAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for scheduling analytics snapshots (using existing model fields)."""

    class Meta:
        model = SchedulingAnalytics
        fields = [
            "id",
            "date",
            "total_technicians",
            "active_technicians",
            "average_utilization_rate",
            "total_scheduled_events",
            "completed_events",
            "cancelled_events",
            "rescheduled_events",
            "on_time_completion_rate",
            "average_travel_time_minutes",
            "customer_satisfaction_score",
            "created_at",
        ]
        read_only_fields = ["created_at"]


# Analytics Parameter Validation Serializers


class CLVParameterSerializer(serializers.Serializer):
    """Parameter validation for CLV calculations."""

    include_predictions = serializers.BooleanField(default=True, required=False)
    refresh_data = serializers.BooleanField(default=False, required=False)
    confidence_threshold = serializers.DecimalField(
        max_digits=3,
        decimal_places=2,
        min_value=0.0,
        max_value=1.0,
        default=0.5,
        required=False,
    )


class DealPredictionParameterSerializer(serializers.Serializer):
    """Parameter validation for deal predictions."""

    include_factors = serializers.BooleanField(default=True, required=False)
    model_version = serializers.CharField(
        max_length=50, required=False, default="latest"
    )
    refresh_prediction = serializers.BooleanField(default=False, required=False)


class RevenueForecastParameterSerializer(serializers.Serializer):
    """Parameter validation for revenue forecasts."""

    PERIOD_CHOICES = [
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
        ("annual", "Annual"),
    ]

    METHOD_CHOICES = [
        ("linear_regression", "Linear Regression"),
        ("moving_average", "Moving Average"),
        ("seasonal_arima", "Seasonal ARIMA"),
    ]

    period = serializers.ChoiceField(
        choices=PERIOD_CHOICES, default="monthly", required=False
    )
    method = serializers.ChoiceField(
        choices=METHOD_CHOICES, default="linear_regression", required=False
    )
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    include_confidence = serializers.BooleanField(default=True, required=False)

    def validate(self, attrs):
        """Validate date range parameters."""
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")

        if start_date and end_date:
            if start_date >= end_date:
                raise serializers.ValidationError(
                    _("start_date must be before end_date")
                )

        return attrs


class AnalyticsSnapshotFilterSerializer(serializers.Serializer):
    """Parameter validation for analytics snapshot filtering."""

    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    page_size = serializers.IntegerField(
        min_value=1, max_value=100, default=20, required=False
    )

    def validate(self, attrs):
        """Validate date range and pagination parameters."""
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")

        if start_date and end_date:
            if start_date >= end_date:
                raise serializers.ValidationError(
                    _("start_date must be before end_date")
                )

        return attrs
