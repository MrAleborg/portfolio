from django.contrib.auth import get_user_model
from rest_framework import exceptions
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.utils import get_md5_hash_password


class StaffTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Only staff users get tokens.

    A non-staff account gets the same error as a wrong password, so the
    response does not tell which accounts exist.
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_staff:
            raise exceptions.AuthenticationFailed(
                self.error_messages["no_active_account"], "no_active_account"
            )
        return data


class RefreshSerializer(TokenRefreshSerializer):
    """Refuses refresh tokens of deleted users and from before a password change.

    Simple JWT does not catch a deleted user, and only checks the password claim
    on access tokens, so a stolen refresh token would keep working after a
    password change.
    """

    def validate(self, attrs):
        refresh = self.token_class(attrs["refresh"])
        user_model = get_user_model()
        try:
            user = user_model.objects.get(
                **{api_settings.USER_ID_FIELD: refresh[api_settings.USER_ID_CLAIM]}
            )
        except user_model.DoesNotExist:
            # Simple JWT lets this one escape as a 500.
            raise exceptions.AuthenticationFailed(
                self.error_messages["no_active_account"], "no_active_account"
            ) from None
        if refresh.get(api_settings.REVOKE_TOKEN_CLAIM) != get_md5_hash_password(
            user.password
        ):
            raise exceptions.AuthenticationFailed(
                "The user's password has been changed.", "password_changed"
            )
        return super().validate(attrs)
