from django.core.validators import RegexValidator
from rest_framework import serializers

from experience.localized import LocalizedField
from owner.models import ContactLink, Profile


class ProfileSerializer(serializers.ModelSerializer):
    headline = LocalizedField()
    bio = LocalizedField()

    class Meta:
        model = Profile
        fields = ["full_name", "headline", "bio"]


class ContactLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactLink
        fields = ["kind", "url"]


# Name and subject go into an email header: no control character (C0, DEL, C1)
# nor Unicode line separator may pass, Python's email policy refuses them all.
no_control_characters = RegexValidator(
    r"[\x00-\x1f\x7f-\x9f\u2028\u2029]",
    message="Control characters are not allowed.",
    inverse_match=True,
)


class ContactMessageSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, validators=[no_control_characters])
    email = serializers.EmailField()
    subject = serializers.CharField(
        min_length=3, max_length=150, validators=[no_control_characters]
    )
    message = serializers.CharField(min_length=10, max_length=5000)
    # Honeypot: real visitors never see this field, bots fill it in.
    website = serializers.CharField(required=False, allow_blank=True)
