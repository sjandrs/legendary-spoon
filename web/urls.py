from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.shortcuts import render
from django.urls import include, path, re_path
from rest_framework.authtoken import views as authtoken_views

from main import views
from main.views import RateLimitedPasswordResetView, spa_view
from main.views_richtext import (
    moderate_richtext,
    notifications,
    richtext_editor,
    richtext_public,
    richtext_submissions,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", views.home, name="home"),
    path(
        "test-forms/",
        lambda request: render(request, "test_forms.html"),
        name="test_forms",
    ),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("register/", views.register, name="register"),
    path(
        "password_reset/",
        RateLimitedPasswordResetView.as_view(template_name="password_reset_form.html"),
        name="password_reset",
    ),
    path(
        "password_reset/done/",
        auth_views.PasswordResetDoneView.as_view(
            template_name="password_reset_done.html"
        ),
        name="password_reset_done",
    ),
    path(
        "reset/<uidb64>/<token>/",
        auth_views.PasswordResetConfirmView.as_view(
            template_name="password_reset_confirm.html"
        ),
        name="password_reset_confirm",
    ),
    path(
        "reset/done/",
        auth_views.PasswordResetCompleteView.as_view(
            template_name="password_reset_complete.html"
        ),
        name="password_reset_complete",
    ),
    path(
        "password_change/",
        auth_views.PasswordChangeView.as_view(
            template_name="password_change_form.html"
        ),
        name="password_change",
    ),
    path(
        "password_change/done/",
        auth_views.PasswordChangeDoneView.as_view(
            template_name="password_change_done.html"
        ),
        name="password_change_done",
    ),
    path("staff-dashboard/", views.staff_dashboard, name="staff_dashboard"),
    path("secret/", views.secret_view, name="secret"),
    path("accounts/", include("allauth.urls")),
    path("ajax/hello/", views.ajax_hello, name="ajax_hello"),
    path("ajax/save/", views.ajax_save_data, name="ajax_save_data"),
    path("ajax/list/", views.ajax_get_list, name="ajax_get_list"),
    path("ajax/html/", views.ajax_html_fragment, name="ajax_html_fragment"),
    path("submit-thought/", richtext_editor, name="richtext_editor"),
    path("thought-submissions/", richtext_submissions, name="richtext_submissions"),
    path(
        "thought/moderate/<int:pk>/<str:action>/",
        moderate_richtext,
        name="moderate_richtext",
    ),
    path("thoughts/", richtext_public, name="richtext_public"),
    path("notifications/", notifications, name="notifications"),
    # API URLs
    path("api/", include("main.api_urls")),
    # SPA catch-all
    re_path(r"^(?!api/|admin/|media/).*$", spa_view, name="spa"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
