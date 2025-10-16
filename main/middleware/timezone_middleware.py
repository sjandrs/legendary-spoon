from django.utils import timezone


class APITimezoneMiddleware:
    """
    Activate user timezone for each request if client provides X-Timezone header.
    Falls back to default TIME_ZONE if header missing or invalid.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        tz = request.headers.get("X-Timezone") or request.META.get("HTTP_X_TIMEZONE")
        if tz:
            try:
                timezone.activate(tz)
            except Exception:
                # Ignore bad timezone values
                timezone.deactivate()
        response = self.get_response(request)
        return response
