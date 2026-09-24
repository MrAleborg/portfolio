from django.urls import path
from djoser.views import UserViewSet
from rest_framework_simplejwt import views as jwt_views

app_name = "accounts"

# Only the djoser routes the site admin needs; signup, activation and password
# reset are left out (see docs/auth.md to add password reset later).
urlpatterns = [
    path(
        "jwt/create/", jwt_views.TokenObtainPairView.as_view(), name="jwt-create"
    ),
    path(
        "jwt/refresh/", jwt_views.TokenRefreshView.as_view(), name="jwt-refresh"
    ),
    path("jwt/verify/", jwt_views.TokenVerifyView.as_view(), name="jwt-verify"),
    path(
        "jwt/blacklist/",
        jwt_views.TokenBlacklistView.as_view(),
        name="jwt-blacklist",
    ),
    path("users/me/", UserViewSet.as_view({"get": "me"}), name="user-me"),
    path(
        "users/set_password/",
        UserViewSet.as_view({"post": "set_password"}),
        name="user-set-password",
    ),
]
