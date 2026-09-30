from rest_framework import serializers

from experience.localized import LocalizedField
from owner.models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    headline = LocalizedField()
    bio = LocalizedField()

    class Meta:
        model = Profile
        fields = ["full_name", "headline", "bio"]
