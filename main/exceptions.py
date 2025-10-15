from typing import Any, Dict, List

from django.conf import settings
from rest_framework import exceptions as drf_exceptions
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def _flatten_validation_errors(data: Any, prefix: str = "") -> List[Dict[str, str]]:
    """Flatten DRF validation error structures into [{path, message}] items.

    DRF ValidationError detail can be:
    - list of strings
    - dict of field -> list/str/dict
    - string (non-field errors)
    This function normalizes to a flat list with explicit paths for clarity.
    """
    items: List[Dict[str, str]] = []

    if isinstance(data, list):
        for idx, v in enumerate(data):
            path = f"{prefix}[{idx}]" if prefix else f"[{idx}]"
            items.extend(_flatten_validation_errors(v, path))
    elif isinstance(data, dict):
        for key, v in data.items():
            # Django uses "non_field_errors" for object-level errors
            field = "<root>" if key in ("non_field_errors", "__all__") else key
            path = f"{prefix}.{field}" if prefix else field
            items.extend(_flatten_validation_errors(v, path))
    else:
        # Primitive leaf (str/int/etc.)
        msg = str(data)
        items.append({"path": prefix or "<root>", "message": msg})

    return items


def custom_exception_handler(
    exc: Exception, context: Dict[str, Any]
) -> Response | None:
    """Unified exception handler returning canonical error payloads.

    Canonical shapes:
    - 4xx errors: { "detail": string }
    - ValidationError: { "detail": string, "errors": [{"path","message"}, ...] }

    Falls back to DRF's default for non-4xx and when DEBUG is enabled for 5xx
    to preserve useful tracebacks during development.
    """
    response = drf_exception_handler(exc, context)

    # If DRF didn't handle it, return as-is (e.g., non-API exceptions)
    if response is None:
        return response

    status_code = getattr(response, "status_code", 500)
    data = getattr(response, "data", None)

    # Only reshape 4xx responses; keep others as-is unless desired
    if 400 <= status_code < 500:
        # Standardize to {detail} for most exceptions
        detail_msg = None
        if isinstance(exc, drf_exceptions.ValidationError):
            # For validation errors, include a flattened errors array as well
            # DRF may provide a dict/list/string in response.data
            flattened = _flatten_validation_errors(data)
            # Derive a concise detail message
            if flattened:
                detail_msg = "Validation error"
            else:
                # Fallback to string cast of original data
                detail_msg = str(data)
            response.data = {"detail": detail_msg, "errors": flattened}
        else:
            # For standard API exceptions, DRF often gives {"detail": "..."}
            # Normalize any alternative keys like {"error": "..."}
            if isinstance(data, dict):
                if "detail" in data:
                    detail_msg = str(data.get("detail"))
                elif "error" in data:
                    detail_msg = str(data.get("error"))
                else:
                    # Use the first value found
                    try:
                        first = next(iter(data.values()))
                        detail_msg = str(first)
                    except Exception:
                        detail_msg = str(data)
            elif isinstance(data, list):
                # Join list messages
                detail_msg = "; ".join(str(x) for x in data)
            else:
                detail_msg = str(data)

            response.data = {"detail": detail_msg}

    # For 5xx in DEBUG keep DRF output for easier debugging
    if status_code >= 500 and getattr(settings, "DEBUG", False):
        return response

    return response
