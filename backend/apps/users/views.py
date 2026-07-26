import random
from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User, EmailOTP
from apps.users.serializers import (
    RegisterSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    EmailTokenObtainPairSerializer,
    VerifyOTPSerializer,
)


class RegisterView(generics.CreateAPIView):
    """
    REQ C-01 / P-01. Open to anyone. Throttled under the 'auth' scope to
    slow down account-creation abuse.
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        _issue_email_otp(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "detail": "Registration successful. A verification code has been sent to your email.",
            },
            status=status.HTTP_201_CREATED,
        )


def _issue_email_otp(user):
    """Generates a 6-digit OTP valid for 10 minutes. Sending is stubbed
    (would go through an SMS/email gateway in production) — the code is
    logged instead so it's usable in development/demo."""
    code = f"{random.randint(0, 999999):06d}"
    EmailOTP.objects.create(
        user=user,
        code=code,
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    print(f"[DEV] Email OTP for {user.email}: {code}")  # replace with real email/SMS send
    return code


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "Invalid email or code."}, status=status.HTTP_400_BAD_REQUEST)

        otp = user.email_otps.filter(code=code, used=False).order_by("-created_at").first()
        if not otp or not otp.is_valid():
            return Response({"detail": "Invalid or expired code."}, status=status.HTTP_400_BAD_REQUEST)

        otp.used = True
        otp.save(update_fields=["used"])
        user.email_verified = True
        user.save(update_fields=["email_verified"])

        return Response({"detail": "Email verified successfully."})


class EmailTokenObtainPairView(TokenObtainPairView):
    """Login endpoint (REQ: secure authentication, proposal 3.6 JWT design)."""

    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [AllowAny]
    throttle_scope = "auth"


class LogoutView(APIView):
    """Blacklists the supplied refresh token so it can no longer be used."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({"detail": "Invalid or already-expired token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Logged out successfully."}, status=status.HTTP_205_RESET_CONTENT)


class MeView(generics.RetrieveUpdateAPIView):
    """Authenticated user's own profile."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password updated successfully."})
