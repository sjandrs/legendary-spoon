# Advanced AJAX examples

import json

from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import views as auth_views
from django.contrib.auth.decorators import login_required, permission_required
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .forms import CustomUserCreationForm


# 1. AJAX POST: Save Data
@csrf_exempt
@require_POST
def ajax_save_data(request):
    try:
        data = json.loads(request.body)
        # Simulate saving data (e.g., to DB)
        saved_value = data.get("value", "No value provided")
        return JsonResponse({"status": "success", "saved": saved_value})
    except Exception as e:
        return JsonResponse({"status": "error", "error": str(e)}, status=400)


# 2. AJAX: Return a List
@require_GET
def ajax_get_list(request):
    items = [
        {"id": 1, "name": "Item One"},
        {"id": 2, "name": "Item Two"},
        {"id": 3, "name": "Item Three"},
    ]
    return JsonResponse({"items": items})


# 3. AJAX: Return HTML fragment
@require_GET
def ajax_html_fragment(request):
    html = """
    <div style='color: #2c3e50; font-weight: bold;'>
        <p>This is an HTML fragment returned by AJAX!</p>
    </div>
    """
    return JsonResponse({"html": html})


# Example AJAX view
@require_GET
def ajax_hello(request):
    data = {
        "message": "Hello from Django AJAX!",
        "user": request.user.username if request.user.is_authenticated else "Anonymous",
    }
    return JsonResponse(data)


# Example: Staff-only view
@staff_member_required
def staff_dashboard(request):
    from .models import CustomUser

    users = CustomUser.objects.all()
    context = {
        "users": users,
    }
    return render(request, "staff_dashboard.html", context)


# Example: Custom permission view
@permission_required("main.can_view_secret", raise_exception=True)
def secret_view(request):
    return render(request, "secret.html")


class RateLimitedPasswordResetView(auth_views.PasswordResetView):
    RATE_LIMIT_MINUTES = 5

    def dispatch(self, request, *args, **kwargs):
        last_request = request.session.get("last_password_reset_request")
        now = timezone.now().timestamp()
        if last_request and now - last_request < self.RATE_LIMIT_MINUTES * 60:
            return render(
                request,
                "password_reset_form.html",
                {
                    "form": self.get_form(),
                    "error": f"You can only request a password reset "
                    f"every {self.RATE_LIMIT_MINUTES} minutes.",
                },
            )
        response = super().dispatch(request, *args, **kwargs)
        if request.method == "POST" and response.status_code == 302:
            request.session["last_password_reset_request"] = now
        return response


def register(request):
    if request.method == "POST":
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("login")
    else:
        form = CustomUserCreationForm()
    return render(request, "register.html", {"form": form})


def login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect("home")
        else:
            messages.error(request, "Invalid username or password")
    return render(request, "login.html")


def logout_view(request):
    logout(request)
    return redirect("login")


@login_required
def home(request):
    from django.db.models import Count

    from .models import Post

    total_posts = Post.objects.count()
    posts_today = Post.objects.filter(created_at__date=timezone.now().date()).count()

    # Example of another statistic
    posts_by_author = (
        Post.objects.values("author__username")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    context = {
        "user": request.user,
        "total_posts": total_posts,
        "posts_today": posts_today,
        "posts_by_author": posts_by_author,
    }
    return render(request, "home.html", context)


@login_required
def spa_view(request, path=None):
    return render(request, "index.html")


# Create your views here.
