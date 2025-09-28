from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views, search_views
from .api_auth_views import LoginView, LogoutView, UserDetailView
# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'posts', api_views.PostViewSet, basename='post')
# ... existing router registrations
router.register(r'task-types', api_views.TaskTypeViewSet, basename='tasktype')

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

    # Auth
    path('auth/login/', LoginView.as_view(), name='api_login'),
    path('auth/logout/', LogoutView.as_view(), name='api_logout'),
    path('auth/user/', UserDetailView.as_view(), name='api_user_detail'),
]
