from django.utils.safestring import mark_safe
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin, GroupAdmin
from django.contrib.auth.models import Group, Permission
from django import forms
from django.contrib.contenttypes.models import ContentType
from django.core.paginator import Paginator
from .models import CustomUser, Category, Tag, Page, Post, Comment, RichTextContent, Account, Contact, Task, Deal, DealStage, Interaction, Quote, QuoteItem, Invoice, InvoiceItem, CustomField, CustomFieldValue, TaskTemplate, DefaultWorkOrderItem, TaskType

class HistoryPaginationMixin:
    history_per_page = 20

    def history_view(self, request, object_id, extra_context=None):
        from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
        from django.contrib.auth import get_user_model
        
        obj = self.get_object(request, object_id)
        action_list = LogEntry.objects.filter(
            object_id=object_id,
            content_type_id=ContentType.objects.get_for_model(obj).pk
        ).select_related().order_by('-action_time')

        # Filtering
        user_id = request.GET.get('user_id')
        action_flag = request.GET.get('action_flag')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if user_id:
            action_list = action_list.filter(user_id=user_id)
        if action_flag:
            action_list = action_list.filter(action_flag=action_flag)
        if start_date:
            action_list = action_list.filter(action_time__date__gte=start_date)
        if end_date:
            action_list = action_list.filter(action_time__date__lte=end_date)


        paginator = Paginator(action_list, self.history_per_page)
        page_number = request.GET.get('page', 1)
        page_obj = paginator.get_page(page_number)

        extra_context = extra_context or {}
        extra_context['action_list'] = page_obj
        
        # For filter dropdowns
        User = get_user_model()
        # Get users who have logged an action for this object
        relevant_user_ids = LogEntry.objects.filter(
            object_id=object_id,
            content_type_id=ContentType.objects.get_for_model(obj).pk
        ).values_list('user_id', flat=True).distinct()
        extra_context['users'] = User.objects.filter(id__in=relevant_user_ids)

        extra_context['action_flags'] = [
            {'value': ADDITION, 'name': 'Addition'},
            {'value': CHANGE, 'name': 'Change'},
            {'value': DELETION, 'name': 'Deletion'},
        ]
        # Pass current filters to re-populate form
        current_filters = {
            'user_id': user_id,
            'action_flag': action_flag,
            'start_date': start_date,
            'end_date': end_date,
        }
        extra_context['current_filters'] = current_filters
        extra_context['query_params'] = request.GET.copy()
        if 'page' in extra_context['query_params']:
            del extra_context['query_params']['page']
        
        return super().history_view(request, object_id, extra_context)

class PermissionsCheckboxSelectMultiple(forms.CheckboxSelectMultiple):
    def render(self, name, value, attrs=None, renderer=None):
        # Get all permissions, grouped by content type (model)
        content_types = ContentType.objects.all().prefetch_related('permission_set')
        
        output = '<div class="permission-matrix">'
        output += '<table>'
        output += '<thead><tr><th>Model</th><th>Permissions</th></tr></thead>'
        output += '<tbody>'

        for ct in content_types:
            # We only want to show models from our app, for example.
            # This can be customized to show all models if needed.
            if ct.app_label not in ['main', 'auth']: # Customize app labels as needed
                continue

            permissions = ct.permission_set.all()
            if not permissions:
                continue

            output += f'<tr>'
            output += f'<td>{ct.name}</td>'
            output += f'<td>'
            for perm in permissions:
                checked = 'checked' if value and perm.id in value else ''
                output += f'<label style="display: block;">'
                output += f'<input type="checkbox" name="{name}" value="{perm.id}" {checked}> '
                output += f'{perm.name}'
                output += f'</label>'
            output += f'</td>'
            output += f'</tr>'

        output += '</tbody></table>'
        output += '</div>'

		

        return mark_safe(output)
class GroupAdminForm(forms.ModelForm):
    class Meta:
        model = Group
        fields = '__all__'
    
    permissions = forms.ModelMultipleChoiceField(
        Permission.objects.all(),
        widget=PermissionsCheckboxSelectMultiple,
        required=False
    )

class CustomGroupAdmin(HistoryPaginationMixin, GroupAdmin):
    form = GroupAdminForm

# Unregister the original Group admin and register our custom one
admin.site.unregister(Group)
admin.site.register(Group, CustomGroupAdmin)

# RichTextContent admin registration
@admin.register(RichTextContent)
class RichTextContentAdmin(HistoryPaginationMixin, admin.ModelAdmin):
	list_display = ("user", "created_at", "content")
	search_fields = ("content",)

admin.site.register(CustomUser, UserAdmin)

# CMS admin registrations
@admin.register(Category)
class CategoryAdmin(HistoryPaginationMixin, admin.ModelAdmin):
	prepopulated_fields = {"slug": ("name",)}
	list_display = ("name", "slug")

@admin.register(Tag)
class TagAdmin(HistoryPaginationMixin, admin.ModelAdmin):
	prepopulated_fields = {"slug": ("name",)}
	list_display = ("name", "slug")

@admin.register(Page)
class PageAdmin(HistoryPaginationMixin, admin.ModelAdmin):
	prepopulated_fields = {"slug": ("title",)}
	list_display = ("title", "status", "published", "author", "created_at", "updated_at", "image_preview")
	list_filter = ("status", "published", "author")
	search_fields = ("title", "content", "rich_content")

	def image_preview(self, obj):
		if obj.image:
			return f'<img src="{obj.image.url}" style="max-height:40px;max-width:60px;" />'
		return ""
	image_preview.allow_tags = True
	image_preview.short_description = "Image"

@admin.register(Post)
class PostAdmin(HistoryPaginationMixin, admin.ModelAdmin):
	prepopulated_fields = {"slug": ("title",)}
	list_display = ("title", "status", "published", "author", "created_at", "updated_at", "image_preview")
	list_filter = ("status", "published", "author", "categories", "tags")
	search_fields = ("title", "content", "rich_content")
	filter_horizontal = ("categories", "tags")

	def image_preview(self, obj):
		if obj.image:
			return f'<img src="{obj.image.url}" style="max-height:40px;max-width:60px;" />'
		return ""
	image_preview.allow_tags = True
	image_preview.short_description = "Image"

@admin.register(Comment)
class CommentAdmin(HistoryPaginationMixin, admin.ModelAdmin):
	list_display = ("post", "author", "approved", "created_at")
	list_filter = ("approved", "created_at", "author")
	search_fields = ("content",)

# CRM admin registrations
from .models import Account, Contact, Task, Deal, DealStage, Interaction, Quote, QuoteItem, Invoice, InvoiceItem, CustomField, CustomFieldValue, TaskTemplate, DefaultWorkOrderItem, TaskType

@admin.register(Account)
class AccountAdmin(HistoryPaginationMixin, admin.ModelAdmin):
    list_display = ('name', 'industry', 'owner', 'created_at')
    search_fields = ('name', 'industry')
    list_filter = ('industry', 'owner')

@admin.register(Contact)
class ContactAdmin(HistoryPaginationMixin, admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'account', 'owner')
    search_fields = ('first_name', 'last_name', 'email')
    list_filter = ('account', 'owner')

@admin.register(Task)
class TaskAdmin(HistoryPaginationMixin, admin.ModelAdmin):
    list_display = ('title', 'status', 'priority', 'due_date', 'assigned_to')
    search_fields = ('title', 'description')
    list_filter = ('status', 'priority', 'assigned_to', 'task_type')

@admin.register(Deal)
class DealAdmin(HistoryPaginationMixin, admin.ModelAdmin):
    list_display = ('title', 'account', 'stage', 'value', 'owner')
    search_fields = ('title', 'account__name')
    list_filter = ('stage', 'owner')

@admin.register(DealStage)
class DealStageAdmin(HistoryPaginationMixin, admin.ModelAdmin):
    list_display = ('name', 'order')

@admin.register(Interaction)
class InteractionAdmin(HistoryPaginationMixin, admin.ModelAdmin):
    list_display = ('interaction_type', 'contact', 'account', 'created_by', 'interaction_date')
    search_fields = ('subject', 'body')
    list_filter = ('interaction_type', 'created_by')

@admin.register(Quote)
class QuoteAdmin(HistoryPaginationMixin, admin.ModelAdmin):
    list_display = ('deal', 'valid_until', 'created_at')

@admin.register(QuoteItem)
class QuoteItemAdmin(HistoryPaginationMixin, admin.ModelAdmin):
    list_display = ('quote', 'description', 'quantity', 'unit_price')

@admin.register(Invoice)
class InvoiceAdmin(HistoryPaginationMixin, admin.ModelAdmin):
    list_display = ('deal', 'due_date', 'paid')
    list_filter = ('paid',)

@admin.register(InvoiceItem)
class InvoiceItemAdmin(HistoryPaginationMixin, admin.ModelAdmin):
    list_display = ('invoice', 'description', 'quantity', 'unit_price')

@admin.register(CustomField)
class CustomFieldAdmin(HistoryPaginationMixin, admin.ModelAdmin):
    list_display = ('name', 'field_type', 'content_type')
    list_filter = ('field_type', 'content_type')

@admin.register(CustomFieldValue)
class CustomFieldValueAdmin(HistoryPaginationMixin, admin.ModelAdmin):
    list_display = ('custom_field', 'content_object', 'value')
    # This might be slow on large datasets
    list_filter = ('custom_field',)

@admin.register(TaskTemplate)
class TaskTemplateAdmin(HistoryPaginationMixin, admin.ModelAdmin):
    list_display = ('name', 'created_by', 'created_at')
    search_fields = ('name', 'description', 'default_title')

@admin.register(DefaultWorkOrderItem)
class DefaultWorkOrderItemAdmin(HistoryPaginationMixin, admin.ModelAdmin):
    list_display = ('template', 'item_type', 'description', 'quantity', 'unit_price')
    list_filter = ('item_type', 'template')

@admin.register(TaskType)
class TaskTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)
