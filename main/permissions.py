from __future__ import annotations

from typing import Any, Iterable

from rest_framework.permissions import SAFE_METHODS, BasePermission


def _is_authenticated(request: Any) -> bool:
    """Runtime-safe authentication check with permissive typing for Pyright.

    DRF's Request.user is dynamically typed based on AUTH_USER_MODEL. We avoid
    strict typing here to keep permissions generic across CustomUser variants.
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
        return _in_groups(getattr(request, "user", None), self.manager_groups)


class IsOwnerOrManager(BasePermission):
    """
    Allow read for owner or manager; managers full access,
    owners restricted to their objects.
    """

    def has_permission(self, request: Any, view: Any) -> bool:  # type: ignore[override]
        return _is_authenticated(request)

    def has_object_permission(
        self, request: Any, view: Any, obj: Any
    ) -> bool:  # type: ignore[override]
        # Managers always allowed
        if _in_groups(getattr(request, "user", None), ["Sales Manager", "Admin"]):
            return True
        # Read-only access for owners on SAFE methods
        if request.method in SAFE_METHODS:
            # Try common ownership attributes
            for attr in ["owner", "submitted_by", "user", "created_by"]:
                u: Any = getattr(request, "user", None)
                if hasattr(obj, attr) and getattr(obj, attr) == u:
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
        manager_groups = ["Sales Manager", "Admin"]
        return _in_groups(user, manager_groups)


class CustomFieldValuePermission(BasePermission):
    """
    Allow managers full access; owners can read values linked to objects
    they own (basic heuristic).
    """

    def has_permission(self, request: Any, view: Any) -> bool:  # type: ignore[override]
        return _is_authenticated(request)

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
