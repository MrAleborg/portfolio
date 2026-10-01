"""Serializers of the admin API: every field, writable except timestamps."""

from django.db import transaction
from rest_framework import serializers

from experience.languages import LANGUAGES
from experience.localized import LocalizedField, LocalizedText
from experience.models import (
    Certification,
    Commitment,
    Education,
    Hobby,
    Methodology,
    Mission,
    ProfessionalExperience,
    Project,
    Skill,
    Specialization,
    Tool,
)
from experience.serializers import CREDENTIAL_FIELDS, MissionListField

# Fields of every entry that the public API hides.
INTERNAL_FIELDS = ["display_order", "is_visible", "created_at", "updated_at"]


def check_dates(serializer, attrs, start, end, message):
    """Refuse an `end` date earlier than the `start` date.

    On a partial update a date missing from attrs is taken from the stored
    instance, so both dates are always compared.
    """

    def current(name):
        if name in attrs:
            return attrs[name]
        return getattr(serializer.instance, name, None)

    start_value, end_value = current(start), current(end)
    if start_value and end_value and end_value < start_value:
        raise serializers.ValidationError({end: [message]})


class DateRangeSerializer(serializers.ModelSerializer):
    """Base for DateRangeEntry models."""

    description = LocalizedField(required=False, allow_blank=True)

    def validate(self, attrs):
        check_dates(
            self,
            attrs,
            "start_date",
            "end_date",
            "The end date cannot be before the start date.",
        )
        return attrs


class CredentialSerializer(serializers.ModelSerializer):
    """Base for CredentialEntry models."""

    name = LocalizedField()
    description = LocalizedField(required=False, allow_blank=True)

    def validate(self, attrs):
        check_dates(
            self,
            attrs,
            "issue_date",
            "expiration_date",
            "The expiration date cannot be before the issue date.",
        )
        return attrs


class EducationSerializer(DateRangeSerializer):
    degree = LocalizedField()
    field_of_study = LocalizedField(required=False, allow_blank=True)
    grade = LocalizedField(required=False, allow_blank=True)
    location = LocalizedField(required=False, allow_blank=True)

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
            *INTERNAL_FIELDS,
        ]


class ProfessionalExperienceSerializer(DateRangeSerializer):
    position = LocalizedField()
    location = LocalizedField(required=False, allow_blank=True)

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
            *INTERNAL_FIELDS,
        ]


class ProjectSerializer(DateRangeSerializer):
    """Sending missions replaces them all, in the order sent."""

    title = LocalizedField()
    achievements = serializers.ListField(child=LocalizedText(), required=False)
    missions = MissionListField(required=False)

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
            *INTERNAL_FIELDS,
        ]

    @transaction.atomic
    def create(self, validated_data):
        missions = validated_data.pop("missions", [])
        project = super().create(validated_data)
        self.set_missions(project, missions)
        return project

    @transaction.atomic
    def update(self, instance, validated_data):
        missions = validated_data.pop("missions", None)
        project = super().update(instance, validated_data)
        if missions is not None:
            project.missions.all().delete()
            self.set_missions(project, missions)
        return project

    @staticmethod
    def set_missions(project, descriptions):
        """Create the missions; each description is a text in every language."""
        Mission.objects.bulk_create(
            Mission(
                project=project,
                display_order=order,
                **{
                    f"description_{language}": texts[language] for language in LANGUAGES
                },
            )
            for order, texts in enumerate(descriptions)
        )


class CertificationSerializer(CredentialSerializer):
    """The link to specializations is edited on the specialization."""

    specializations = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Certification
        fields = [*CREDENTIAL_FIELDS, "tags", "specializations", *INTERNAL_FIELDS]


class SpecializationSerializer(CredentialSerializer):
    class Meta:
        model = Specialization
        fields = [*CREDENTIAL_FIELDS, "certifications", *INTERNAL_FIELDS]


class TagSerializer(serializers.ModelSerializer):
    """Base for the tag kinds; subclasses set Meta.model to their proxy.

    Saving through the proxy sets the kind. A name is unique within its kind,
    in each language; DRF does not derive that validator from the
    (name_<language>, kind) constraints since kind is not a field here, so it
    is checked by hand.
    """

    name = LocalizedField()

    class Meta:
        fields = ["id", "name"]

    def validate_name(self, columns):
        """`columns` is {"name_en": ..., "name_fr": ...}; errors are per language."""
        others = self.Meta.model.objects.all()
        if self.instance is not None:
            others = others.exclude(pk=self.instance.pk)
        message = (
            f"A {self.Meta.model._meta.verbose_name} with this name already exists."
        )
        errors = {
            language: [message]
            for language in LANGUAGES
            if others.filter(
                **{f"name_{language}": columns[f"name_{language}"]}
            ).exists()
        }
        if errors:
            raise serializers.ValidationError(errors)
        return columns


class SkillSerializer(TagSerializer):
    class Meta(TagSerializer.Meta):
        model = Skill


class ToolSerializer(TagSerializer):
    class Meta(TagSerializer.Meta):
        model = Tool


class MethodologySerializer(TagSerializer):
    class Meta(TagSerializer.Meta):
        model = Methodology


class HobbySerializer(serializers.ModelSerializer):
    name = LocalizedField()
    description = LocalizedField(required=False, allow_blank=True)

    class Meta:
        model = Hobby
        fields = ["id", "name", "description", *INTERNAL_FIELDS]


class CommitmentSerializer(DateRangeSerializer):
    role = LocalizedField()
    location = LocalizedField(required=False, allow_blank=True)

    class Meta:
        model = Commitment
        fields = [
            "id",
            "kind",
            "organization",
            "role",
            "location",
            "url",
            "start_date",
            "end_date",
            "is_current",
            "description",
            *INTERNAL_FIELDS,
        ]
