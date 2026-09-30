"""Serializer of the admin API: every field, writable except timestamps."""

from experience.localized import LocalizedField
from owner.serializers import ProfileSerializer as PublicProfileSerializer


class ProfileSerializer(PublicProfileSerializer):
    bio = LocalizedField(required=False, allow_blank=True)

    class Meta(PublicProfileSerializer.Meta):
        fields = [*PublicProfileSerializer.Meta.fields, "created_at", "updated_at"]
