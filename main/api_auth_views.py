import logging

from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import UserSerializer

logger = logging.getLogger(__name__)


class LoginView(APIView):
    """
    A custom login view that manually authenticates and returns a token.
    This bypasses DRF's ObtainAuthToken and its conflicting serializers.
    """

    permission_classes = [AllowAny]  # Allow anyone to attempt to log in.

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")
        logger.debug(f"Login attempt for username: {username}")

        if not username or not password:
            logger.warning("Login failed: username or password not provided.")
            return Response(
                {"error": "Please provide both username and password"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # The `authenticate` function will check against the backends defined in settings.py
        user = authenticate(request, username=username, password=password)

        if not user:
            logger.warning(
                f"Login failed for username: {username}. Invalid credentials."
            )
            return Response(
                {"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )

        logger.info(f"User {username} authenticated successfully.")
        token, created = Token.objects.get_or_create(user=user)

        return Response({"token": token.key, "user": UserSerializer(user).data})


class LogoutView(APIView):
    """
    Logs out the user by deleting their authentication token.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            request.user.auth_token.delete()
        except (AttributeError, Token.DoesNotExist):
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserDetailView(APIView):
    """
    Returns the user details for the currently authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
