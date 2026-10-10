"""Serializer of the admin API: every field, writable except timestamps."""

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from experience.localized import LocalizedField
from owner.models import ContactLink
from owner.serializers import ProfileSerializer as PublicProfileSerializer


class ProfileSerializer(PublicProfileSerializer):
    bio = LocalizedField(required=False, allow_blank=True)
    desired_role = LocalizedField(required=False, allow_blank=True)

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

    def validate(self, attrs):
        # DRF does not run Model.clean(): run it on what the link will become,
        # so a PATCH of the url alone is checked against the stored kind.
        current = self.instance
        link = ContactLink(
            kind=attrs.get("kind", current.kind if current else ""),
            url=attrs.get("url", current.url if current else ""),
        )
        try:
            link.clean()
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.message_dict) from error
        return attrs
