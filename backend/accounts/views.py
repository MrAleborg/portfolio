from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView


class LoginView(TokenObtainPairView):
    """Login, throttled to slow down password guessing (rate: "login" scope)."""

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"
