from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views, search_views
from .api_auth_views import LoginView, LogoutView, UserDetailView
# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'posts', api_views.PostViewSet, basename='post')
router.register(r'tags', api_views.TagViewSet, basename='tag')
router.register(r'accounts', api_views.AccountViewSet, basename='account')
router.register(r'contacts', api_views.ContactViewSet, basename='contact')
router.register(r'projects', api_views.ProjectViewSet, basename='project')
router.register(r'deals', api_views.DealViewSet, basename='deal')
router.register(r'deal-stages', api_views.DealStageViewSet, basename='dealstage')
router.register(r'interactions', api_views.InteractionViewSet, basename='interaction')
router.register(r'quotes', api_views.QuoteViewSet, basename='quote')
router.register(r'quote-items', api_views.QuoteItemViewSet, basename='quoteitem')
router.register(r'invoices', api_views.InvoiceViewSet, basename='invoice')
router.register(r'invoice-items', api_views.InvoiceItemViewSet, basename='invoiceitem')
router.register(r'custom-fields', api_views.CustomFieldViewSet, basename='customfield')
router.register(r'custom-field-values', api_views.CustomFieldValueViewSet, basename='customfieldvalue')
router.register(r'activity-logs', api_views.ActivityLogViewSet, basename='activitylog')
router.register(r'project-templates', api_views.ProjectTemplateViewSet, basename='projecttemplate')
router.register(r'default-work-order-items', api_views.DefaultWorkOrderItemViewSet, basename='defaultworkorderitem')
router.register(r'project-types', api_views.ProjectTypeViewSet, basename='projecttype')
router.register(r'ledger-accounts', api_views.LedgerAccountViewSet, basename='ledgeraccount')
router.register(r'journal-entries', api_views.JournalEntryViewSet, basename='journalentry')
router.register(r'work-orders', api_views.WorkOrderViewSet, basename='workorder')
router.register(r'line-items', api_views.LineItemViewSet, basename='lineitem')
router.register(r'payments', api_views.PaymentViewSet, basename='payment')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', api_views.DashboardStatsView.as_view(), name='dashboard-stats'),
    # ... existing url patterns
    path('kb/', api_views.KnowledgeBaseView.as_view(), name='kb-list'),
    path('kb/<str:file_name>/', api_views.MarkdownFileView.as_view(), name='kb-file'),
    
    # Search
    path('search/', search_views.SearchAPIView.as_view(), name='api_search'),
    path('search/filters/', search_views.SearchFiltersAPIView.as_view(), name='api_search_filters'),
    path('my-contacts/', api_views.MyContactsView.as_view(), name='my-contacts'),

    # Auth
    path('auth/login/', LoginView.as_view(), name='api_login'),
    path('auth/logout/', LogoutView.as_view(), name='api_logout'),
    path('auth/user/', UserDetailView.as_view(), name='api_user_detail'),

    # User Roles
    path('user-roles/', api_views.UserRoleManagementView.as_view(), name='user-roles'),
]
