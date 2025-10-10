# All imports at top of file
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET

from .models import Notification, RichTextContent


# View for user to see their notifications
@login_required
def notifications(request):
    notes = request.user.notifications.order_by("-created_at")
    return render(request, "notifications.html", {"notifications": notes})


# Public view for approved rich text content
@require_GET
def richtext_public(request):
    items = RichTextContent.objects.filter(approved=True).order_by("-created_at")
    return render(request, "richtext_public.html", {"items": items})


@login_required
@csrf_exempt
def richtext_editor(request):
    if request.method == "POST":
        content = request.POST.get("content", "")
        obj = RichTextContent.objects.create(user=request.user, content=content)
        return JsonResponse({"status": "success", "content": obj.content, "id": obj.id})
    return render(request, "richtext_editor.html")


# View to list and moderate submitted rich text content
@staff_member_required
def richtext_submissions(request):
    submissions = RichTextContent.objects.all().order_by("-created_at")
    return render(request, "richtext_submissions.html", {"submissions": submissions})


# Approve/reject actions
@staff_member_required
def moderate_richtext(request, pk, action):
    obj = get_object_or_404(RichTextContent, pk=pk)
    if request.method == "POST":
        notes = request.POST.get("moderation_notes", "")
        obj.moderation_notes = notes
        user_email = obj.user.email if obj.user and obj.user.email else None
        if action == "approve":
            obj.approved = True
            obj.rejection_reason = ""
            obj.save()
            # In-app notification
            if obj.user:
                Notification.objects.create(
                    user=obj.user,
                    message=f"Your content submitted on {obj.created_at} has been "
                    f"approved. Moderator notes: {notes}",
                )
            if user_email:
                send_mail(
                    "Your submission has been approved",
                    f"Your content submitted on {obj.created_at} has been approved."
                    f"\n\nModerator notes: {notes}",
                    None,
                    [user_email],
                    fail_silently=True,
                )
        elif action == "reject":
            obj.approved = False
            obj.rejection_reason = request.POST.get("rejection_reason", "")
            obj.save()
            # In-app notification
            if obj.user:
                Notification.objects.create(
                    user=obj.user,
                    message=f"Your content submitted on {obj.created_at} was rejected. "
                    f"Reason: {obj.rejection_reason} Moderator notes: {notes}",
                )
            if user_email:
                send_mail(
                    "Your submission has been rejected",
                    f"Your content submitted on {obj.created_at} was rejected."
                    f"\nReason: {obj.rejection_reason}\nModerator notes: {notes}",
                    None,
                    [user_email],
                    fail_silently=True,
                )
        else:
            obj.save()
        return redirect("richtext_submissions")
    return render(request, "moderate_richtext.html", {"obj": obj, "action": action})
