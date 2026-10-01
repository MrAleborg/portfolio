from rest_framework import serializers

from experience.languages import LANGUAGES
from experience.localized import LocalizedField, LocalizedText
from experience.models import (
    Certification,
    Education,
    Hobby,
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
    degree = LocalizedField()
    field_of_study = LocalizedField()
    grade = LocalizedField()
    location = LocalizedField()
    description = LocalizedField()

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
    name = LocalizedField()

    class Meta:
        model = Tag
        fields = ["id", "name"]


class TagWithKindSerializer(TagSerializer):
    """For entries that mix tag kinds, so the frontend can group them."""

    class Meta(TagSerializer.Meta):
        fields = [*TagSerializer.Meta.fields, "kind"]


class SpecializationSummarySerializer(serializers.ModelSerializer):
    name = LocalizedField()

    class Meta:
        model = Specialization
        fields = ["id", "name"]


class CertificationSerializer(serializers.ModelSerializer):
    """The view must prefetch specializations filtered on is_visible."""

    name = LocalizedField()
    description = LocalizedField()
    tags = TagWithKindSerializer(many=True, read_only=True)
    specializations = SpecializationSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Certification
        fields = [*CREDENTIAL_FIELDS, "tags", "specializations"]


class ProjectSummarySerializer(serializers.ModelSerializer):
    title = LocalizedField()

    class Meta:
        model = Project
        fields = ["id", "title"]


class ExperienceSummarySerializer(serializers.ModelSerializer):
    position = LocalizedField()

    class Meta:
        model = ProfessionalExperience
        fields = ["id", "company", "position"]


class MissionListField(serializers.ListField):
    """A project's missions in display order, each a text in every language."""

    child = LocalizedText()

    def to_representation(self, missions):
        return [
            {
                language: getattr(mission, f"description_{language}")
                for language in LANGUAGES
            }
            for mission in missions.all()
        ]


class ProjectSerializer(serializers.ModelSerializer):
    """experience is null for a side project. Missions and achievements are
    lists of texts in every language."""

    title = LocalizedField()
    description = LocalizedField()
    experience = ExperienceSummarySerializer(read_only=True)
    missions = MissionListField(read_only=True)
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
    name = LocalizedField()

    class Meta:
        model = Certification
        fields = ["id", "name"]


class SpecializationSerializer(serializers.ModelSerializer):
    """The view must prefetch certifications filtered on is_visible."""

    name = LocalizedField()
    description = LocalizedField()
    certifications = CertificationSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Specialization
        fields = [*CREDENTIAL_FIELDS, "certifications"]


class TagDetailSerializer(TagSerializer):
    """A tag with the visible entries tagged with it.

    The view must prefetch projects from visible_projects() (which also hides
    projects of invisible experiences) and certifications filtered on
    is_visible.
    """

    projects = ProjectSummarySerializer(many=True, read_only=True)
    certifications = CertificationSummarySerializer(many=True, read_only=True)

    class Meta(TagSerializer.Meta):
        fields = [*TagSerializer.Meta.fields, "projects", "certifications"]


class ExperienceProjectSerializer(ProjectSerializer):
    """A project nested in its experience, so without the experience field."""

    experience = None

    class Meta(ProjectSerializer.Meta):
        fields = [f for f in ProjectSerializer.Meta.fields if f != "experience"]


class ProfessionalExperienceSerializer(serializers.ModelSerializer):
    position = LocalizedField()
    location = LocalizedField()
    description = LocalizedField()
    projects = ExperienceProjectSerializer(many=True, read_only=True)

    class Meta:
        model = ProfessionalExperience
        fields = [
            "id",
            "company",
            "position",
            "employment_type",
            "company_url",
            "location",
            "start_date",
            "end_date",
            "is_current",
            "description",
            "projects",
        ]


class HobbySerializer(serializers.ModelSerializer):
    name = LocalizedField()
    description = LocalizedField()

    class Meta:
        model = Hobby
        fields = ["id", "name", "description"]
