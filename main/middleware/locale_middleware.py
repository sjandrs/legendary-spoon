from django.utils import translation


class APILanguageMiddleware:
    """
    Lightweight middleware that activates the best-matched language for each request
    based on the Accept-Language header (and other Django strategies) and sets the
    Content-Language header on the response.

    This focuses on API requests and avoids URL prefix handling. It complements
    existing i18n-ready strings without requiring URL language patterns.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Determine language from the request headers/cookies using Django's helper
        language = translation.get_language_from_request(request)
        translation.activate(language)
        request.LANGUAGE_CODE = language

        try:
            response = self.get_response(request)
        finally:
            # Ensure we always deactivate to avoid leaking state between requests
            translation.deactivate()

        # Advertise the chosen language
        try:
            response["Content-Language"] = language
        except Exception:
            # Non-standard responses may not support header assignment; ignore
            pass

        return response
