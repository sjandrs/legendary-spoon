"""
Rate limiting utilities for analytics endpoints.
Implements Phase 5: Advanced Analytics parameter validation and rate limiting.
"""
import time
from functools import wraps

from django.core.cache import cache
from django.http import JsonResponse


def rate_limit_analytics(max_requests=10, window_seconds=60):
    """
    Rate limiting decorator for analytics endpoints.

    Args:
        max_requests: Maximum requests per window
        window_seconds: Time window in seconds
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            # Get user identifier for rate limiting
            if hasattr(request, "user") and request.user.is_authenticated:
                user_id = request.user.id
            else:
                # Fallback to IP address for anonymous users
                user_id = request.META.get("REMOTE_ADDR", "anonymous")

            # Create cache key
            cache_key = f"analytics_rate_limit:{user_id}"

            # Get current timestamp
            now = int(time.time())
            window_start = now - window_seconds

            # Get existing requests from cache
            requests = cache.get(cache_key, [])

            # Filter requests within current window
            requests = [req_time for req_time in requests if req_time > window_start]

            # Check if limit exceeded
            if len(requests) >= max_requests:
                return JsonResponse(
                    {
                        "error": "Rate limit exceeded",
                        "message": f"Maximum {max_requests} requests per {window_seconds} seconds",
                        "retry_after": window_seconds - (now - min(requests)),
                    },
                    status=429,
                )

            # Add current request to list
            requests.append(now)

            # Update cache
            cache.set(cache_key, requests, timeout=window_seconds + 10)

            # Execute the view
            return view_func(request, *args, **kwargs)

        return wrapped_view

    return decorator
