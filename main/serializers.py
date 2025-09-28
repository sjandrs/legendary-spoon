from rest_framework import serializers
from .models import (
    Post, Category, Tag, CustomUser, Account, Contact, Task, Deal, DealStage, 
    Interaction, Quote, QuoteItem, Invoice, InvoiceItem, CustomField, CustomFieldValue,
    ActivityLog, TaskTemplate, DefaultWorkOrderItem, TaskType
)
from .search_models import SavedSearch, GlobalSearchIndex, BulkOperation
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model, authenticate
from django.utils.translation import gettext_lazy as _

class PostSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    categories = serializers.StringRelatedField(many=True)
    tags = serializers.StringRelatedField(many=True)

    class Meta:
        model = Post
        fields = [
            'id', 
            'title', 
            'slug', 
            'author', 
            'content', 
            'rich_content', 
            'status', 
            'published', 
            'created_at', 
            'updated_at',
            'categories',
            'tags',
            'image'
        ]

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser']

class AccountSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    account_name = serializers.CharField(source='name', read_only=True)

    class Meta:
        model = Account
        fields = [
            'id', 'name', 'industry', 'website', 'phone_number', 'address', 
            'notes', 'owner', 'created_at', 'updated_at', 'account_name'
        ]

class ContactSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    account = AccountSerializer(read_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = Contact
        fields = [
            'id', 'account', 'first_name', 'last_name', 'email', 'phone_number', 
            'title', 'owner', 'created_at', 'updated_at'
        ]

class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login. Handles authentication with username or email.
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        label=_("Password"),
        style={'input_type': 'password'},
        trim_whitespace=False,
        required=True
    )

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if not username or not password:
            raise serializers.ValidationError(_('Must include "username" and "password".'), code='authorization')

        # Try to authenticate with username or email
        user = authenticate(request=self.context.get('request'), username=username, password=password)

        if not user:
            # If authentication fails, raise a validation error.
            msg = _('Unable to log in with provided credentials.')
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs


class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    is_overdue = serializers.ReadOnlyField()
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), source='assigned_to', write_only=True
    )

    class Meta:
        model = Task
        fields = '__all__'
        extra_kwargs = {
            'assigned_to': {'read_only': True},
        }

class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = '__all__'

class TaskTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskType
        fields = ['id', 'name', 'is_active']

class DealStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DealStage
        fields = '__all__'

class DealSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    primary_contact_name = serializers.SerializerMethodField()
    stage_name = serializers.CharField(source='stage.name', read_only=True)
    
    class Meta:
        model = Deal
        fields = [
            'id', 'title', 'value', 'close_date', 'status', 'created_at', 'updated_at',
            'owner_username', 'account_name', 'primary_contact_name', 'stage_name'
        ]

    def get_primary_contact_name(self, obj):
        if obj.primary_contact:
            return f"{obj.primary_contact.first_name} {obj.primary_contact.last_name}"
        return None

class InteractionSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Interaction
        fields = '__all__'

class QuoteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteItem
        fields = '__all__'

class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, read_only=True)

    class Meta:
        model = Quote
        fields = '__all__'

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'

class CustomFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomField
        fields = '__all__'

class CustomFieldValueSerializer(serializers.ModelSerializer):
    field_name = serializers.CharField(source='custom_field.name', read_only=True)
    field_type = serializers.CharField(source='custom_field.field_type', read_only=True)

    class Meta:
        model = CustomFieldValue
        fields = ['id', 'field_name', 'field_type', 'value']

class ContactWithCustomFieldsSerializer(ContactSerializer):
    custom_fields = serializers.SerializerMethodField()

    class Meta(ContactSerializer.Meta):
        fields = list(ContactSerializer.Meta.fields) + ['custom_fields']

    def get_custom_fields(self, obj):
        # This assumes you might want to filter CustomFields to only those for Contacts
        content_type = ContentType.objects.get_for_model(obj)
        values = CustomFieldValue.objects.filter(content_type=content_type, object_id=obj.id)
        return CustomFieldValueSerializer(values, many=True).data

class AccountWithCustomFieldsSerializer(AccountSerializer):
    custom_fields = serializers.SerializerMethodField()

    class Meta(AccountSerializer.Meta):
        fields = list(AccountSerializer.Meta.fields) + ['custom_fields']

    def get_custom_fields(self, obj):
        content_type = ContentType.objects.get_for_model(obj)
        values = CustomFieldValue.objects.filter(content_type=content_type, object_id=obj.id)
        return CustomFieldValueSerializer(values, many=True).data


class CustomUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    groups = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 
                 'is_active', 'is_superuser', 'date_joined', 'groups']
        read_only_fields = ['date_joined']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class SavedSearchSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    search_type_display = serializers.CharField(source='get_search_type_display', read_only=True)
    
    class Meta:
        model = SavedSearch
        fields = ['id', 'name', 'description', 'user', 'user_name', 'search_type', 
                 'search_type_display', 'search_query', 'filters', 'sort_by', 'sort_order',
                 'is_public', 'created_at', 'updated_at', 'last_used', 'use_count']
        read_only_fields = ['user', 'created_at', 'updated_at', 'last_used', 'use_count']


class GlobalSearchIndexSerializer(serializers.ModelSerializer):
    entity_type_display = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    
    class Meta:
        model = GlobalSearchIndex
        fields = ['id', 'title', 'content', 'tags', 'entity_type', 'entity_type_display',
                 'owner', 'owner_name', 'created_at', 'updated_at', 'boost_score']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_entity_type_display(self, obj):
        return obj.entity_type.title()


class BulkOperationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    operation_type_display = serializers.CharField(source='get_operation_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    duration = serializers.ReadOnlyField()
    
    class Meta:
        model = BulkOperation
        fields = ['id', 'operation_type', 'operation_type_display', 'status', 'status_display',
                 'user', 'user_name', 'entity_type', 'total_records', 'processed_records',
                 'successful_records', 'failed_records', 'progress_percentage', 'duration',
                 'filters', 'operation_data', 'results', 'error_message', 'created_at',
                 'started_at', 'completed_at']
        read_only_fields = ['user', 'created_at', 'started_at', 'completed_at', 
                           'processed_records', 'successful_records', 'failed_records']


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
        fields = ['id', 'item_type', 'description', 'quantity', 'unit_price', 'serial_number']

class TaskTemplateSerializer(serializers.ModelSerializer):
    default_items = DefaultWorkOrderItemSerializer(many=True, required=False)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = TaskTemplate
        fields = [
            'id', 'name', 'description', 'default_title', 'default_description',
            'default_task_type', 'default_priority', 'created_by', 'created_at', 
            'updated_at', 'default_items'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('default_items', [])
        template = TaskTemplate.objects.create(**validated_data)
        for item_data in items_data:
            DefaultWorkOrderItem.objects.create(template=template, **item_data)
        return template

    def update(self, instance, validated_data):
        items_data = validated_data.pop('default_items', None)
        
        # Update the TaskTemplate instance fields
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.default_title = validated_data.get('default_title', instance.default_title)
        instance.default_description = validated_data.get('default_description', instance.default_description)
        instance.default_task_type = validated_data.get('default_task_type', instance.default_task_type)
        instance.default_priority = validated_data.get('default_priority', instance.default_priority)
        instance.save()

        if items_data is not None:
            # Delete items that are not in the new list
            item_ids_to_keep = [item.get('id') for item in items_data if item.get('id')]
            instance.default_items.exclude(id__in=item_ids_to_keep).delete()

            # Create or update items
            for item_data in items_data:
                item_id = item_data.get('id')
                if item_id:
                    # Update existing item
                    item_instance = DefaultWorkOrderItem.objects.get(id=item_id, template=instance)
                    item_instance.item_type = item_data.get('item_type', item_instance.item_type)
                    item_instance.description = item_data.get('description', item_instance.description)
                    item_instance.quantity = item_data.get('quantity', item_instance.quantity)
                    item_instance.unit_price = item_data.get('unit_price', item_instance.unit_price)
                    item_instance.serial_number = item_data.get('serial_number', item_instance.serial_number)
                    item_instance.save()
                else:
                    # Create new item
                    DefaultWorkOrderItem.objects.create(template=instance, **item_data)
        
        return instance
