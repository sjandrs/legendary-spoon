from __future__ import annotations

from typing import Any, Iterable

from rest_framework.permissions import SAFE_METHODS, BasePermission


def _is_authenticated(request: Any) -> bool:
    """Runtime-safe auth check with permissive typing.

    DRF's Request.user is dynamic per AUTH_USER_MODEL. We avoid strict typing
    to keep permissions generic across CustomUser variants.
    """
    user: Any = getattr(request, "user", None)
    return bool(user and getattr(user, "is_authenticated", False))


def _in_groups(user: Any, group_names: Iterable[str]) -> bool:
    """Return True if the user is in any of the named groups.

    Uses duck typing and guards to keep static analyzers satisfied without
    coupling to a concrete User type.
    """
    try:
        groups = getattr(user, "groups", None)
        if groups is None:
            return False
        return bool(groups.filter(name__in=list(group_names)).exists())
    except Exception:
        return False


class IsManager(BasePermission):
    """Allows access only to users in Sales Manager or Admin groups."""

    manager_groups = {"Sales Manager", "Admin"}

    def has_permission(self, request: Any, view: Any) -> bool:  # type: ignore[override]
        if not _is_authenticated(request):
            return False
        user = getattr(request, "user", None)
        return _in_groups(user, self.manager_groups)


class IsOwnerOrManager(BasePermission):
    """
    Allow read for owner or manager; managers full access,
    owners restricted to their objects.
    """

    def has_permission(self, request: Any, view: Any) -> bool:  # type: ignore[override]
        if not _is_authenticated(request):
            return False

        # For QuoteItem access, check ownership through the quote->deal->account chain
        if (
            hasattr(view, "get_queryset")
            and getattr(view.get_queryset().model, "__name__", "") == "QuoteItem"
        ):
            user = getattr(request, "user", None)
            # Managers always allowed
            if _in_groups(user, ["Sales Manager", "Admin"]):
                return True

            # For quote item creation, check if user owns the related deal
            if request.method == "POST":
                quote_id = request.data.get("quote")
                if quote_id:
                    try:
                        # Import here to avoid circular imports
                        from main.models import Quote

                        quote = Quote.objects.select_related("deal__account").get(
                            id=quote_id
                        )
                        return quote.deal.account.owner == user
                    except Exception:
                        return False
                return False

            # For GET requests (list/detail), check if user owns quote items through deal ownership
            if request.method == "GET":
                try:
                    from main.models import QuoteItem

                    has_accessible_items = QuoteItem.objects.filter(
                        quote__deal__account__owner=user
                    ).exists()
                    return has_accessible_items
                except Exception:
                    return False

            # For other methods, deny
            return False

        return True

    def has_object_permission(
        self, request: Any, view: Any, obj: Any
    ) -> bool:  # type: ignore[override]
        # Managers always allowed
        if _in_groups(getattr(request, "user", None), ["Sales Manager", "Admin"]):
            return True
        # Read-only access for owners on SAFE methods
        if request.method in SAFE_METHODS:
            user = getattr(request, "user", None)

            # Special handling for QuoteItem - check ownership through quote->deal->account chain
            if (
                hasattr(obj, "quote")
                and hasattr(obj.quote, "deal")
                and hasattr(obj.quote.deal, "account")
            ):
                return obj.quote.deal.account.owner == user

            # Try common ownership attributes for other models
            for attr in ["owner", "submitted_by", "user", "created_by"]:
                if hasattr(obj, attr) and getattr(obj, attr) == user:
                    return True
        # Write access restricted to managers only
        return False


class FinancialDataPermission(BasePermission):
    """Restrict financial data (payments, journal entries) to managers."""

    def has_permission(self, request: Any, view: Any) -> bool:  # type: ignore[override]
        if not _is_authenticated(request):
            return False
        # Read-only for owners not allowed; only managers
        user = getattr(request, "user", None)
        return _in_groups(user, ["Sales Manager", "Admin"])


class CustomFieldValuePermission(BasePermission):
    """
    Allow managers full access; restrict creation to managers only.
    Owners can read values linked to objects they own (basic heuristic).
    """

    def has_permission(self, request: Any, view: Any) -> bool:  # type: ignore[override]
        if not _is_authenticated(request):
            return False

        user = getattr(request, "user", None)
        # For creation/modification, only managers allowed
        if request.method not in SAFE_METHODS:
            return _in_groups(user, ["Sales Manager", "Admin"])

        # Read access allowed for authenticated users (further restricted by has_object_permission)
        return True

    def has_object_permission(
        self, request: Any, view: Any, obj: Any
    ) -> bool:  # type: ignore[override]
        # Managers allowed
        user = getattr(request, "user", None)
        if _in_groups(user, ["Sales Manager", "Admin"]):
            return True
        if request.method in SAFE_METHODS:
            target = getattr(obj, "content_object", None)
            if target is not None:
                for attr in ["owner", "submitted_by", "user", "created_by"]:
                    u: Any = getattr(request, "user", None)
                    if hasattr(target, attr) and getattr(target, attr) == u:
                        return True
        return False
