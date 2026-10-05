"""Serializer of the admin API: every field, writable except timestamps."""

from rest_framework import serializers

from experience.localized import LocalizedField
from owner.models import ContactLink
from owner.serializers import ProfileSerializer as PublicProfileSerializer


class ProfileSerializer(PublicProfileSerializer):
    bio = LocalizedField(required=False, allow_blank=True)

    class Meta(PublicProfileSerializer.Meta):
        fields = [*PublicProfileSerializer.Meta.fields, "created_at", "updated_at"]


class ContactLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactLink
        fields = [
            "id",
            "kind",
            "url",
            "display_order",
            "is_visible",
            "created_at",
            "updated_at",
        ]
