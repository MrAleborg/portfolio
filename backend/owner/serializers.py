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
