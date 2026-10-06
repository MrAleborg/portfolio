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


class ContactMessageSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    message = serializers.CharField(min_length=10, max_length=5000)
    # Honeypot: real visitors never see this field, bots fill it in.
    website = serializers.CharField(required=False, allow_blank=True)
