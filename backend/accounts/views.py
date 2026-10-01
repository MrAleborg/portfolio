from functools import wraps

from django.http import HttpResponse
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView


class LoginView(TokenObtainPairView):
    """Login, throttled to slow down password guessing (rate: "login" scope)."""

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


def throttle_login_posts(view):
    """Apply LoginView's rate limit and counter to a Django login view.

    The Django admin login takes the same password as the API one, so it must
    not be a way around the throttle. Only POST (an attempt) is counted.
    """

    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if request.method == "POST" and not ScopedRateThrottle().allow_request(
            request, LoginView
        ):
            return HttpResponse("Too many login attempts.", status=429)
        return view(request, *args, **kwargs)

    return wrapper
