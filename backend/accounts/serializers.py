from rest_framework import exceptions
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


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
