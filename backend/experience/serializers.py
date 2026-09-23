from rest_framework import serializers

from experience.models import (
    Certification,
    Education,
    ProfessionalExperience,
    Project,
    Specialization,
    Tag,
)

# Public fields shared by every CredentialEntry (certifications, specializations).
CREDENTIAL_FIELDS = [
    "id",
    "name",
    "issuer",
    "issue_date",
    "expiration_date",
    "credential_id",
    "credential_url",
    "description",
]


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = [
            "id",
            "institution",
            "degree",
            "field_of_study",
            "grade",
            "location",
            "start_date",
            "end_date",
            "is_current",
            "description",
        ]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class TagWithKindSerializer(TagSerializer):
    """For entries that mix tag kinds, so the frontend can group them."""

    class Meta(TagSerializer.Meta):
        fields = [*TagSerializer.Meta.fields, "kind"]


class SpecializationSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = ["id", "name"]


class CertificationSerializer(serializers.ModelSerializer):
    """The view must prefetch specializations filtered on is_visible."""

    tags = TagWithKindSerializer(many=True, read_only=True)
    specializations = SpecializationSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Certification
        fields = [*CREDENTIAL_FIELDS, "tags", "specializations"]


class ProjectSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "title"]


class ExperienceSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessionalExperience
        fields = ["id", "company", "position"]


class ProjectSerializer(serializers.ModelSerializer):
    """experience is null for a side project; missions are plain strings."""

    experience = ExperienceSummarySerializer(read_only=True)
    missions = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="description"
    )
    tags = TagWithKindSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "start_date",
            "end_date",
            "is_current",
            "description",
            "achievements",
            "experience",
            "missions",
            "tags",
        ]


class CertificationSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ["id", "name"]


class SpecializationSerializer(serializers.ModelSerializer):
    """The view must prefetch certifications filtered on is_visible."""

    certifications = CertificationSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Specialization
        fields = [*CREDENTIAL_FIELDS, "certifications"]


class TagDetailSerializer(TagSerializer):
    """A tag with the visible entries tagged with it.

    The view must prefetch projects and certifications filtered on is_visible.
    """

    projects = ProjectSummarySerializer(many=True, read_only=True)
    certifications = CertificationSummarySerializer(many=True, read_only=True)

    class Meta(TagSerializer.Meta):
        fields = [*TagSerializer.Meta.fields, "projects", "certifications"]
