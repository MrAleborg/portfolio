"""Serializers of the admin API: every field, writable except timestamps."""

from django.db import transaction
from rest_framework import serializers

from experience.models import (
    Certification,
    Education,
    Methodology,
    Mission,
    ProfessionalExperience,
    Project,
    Skill,
    Specialization,
    Tool,
)
from experience.serializers import CREDENTIAL_FIELDS

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


class MissionListField(serializers.ListField):
    """A project's missions as plain strings, in display order."""

    child = serializers.CharField()

    def to_representation(self, missions):
        return [mission.description for mission in missions.all()]


class ProjectSerializer(DateRangeSerializer):
    """Sending missions replaces them all, in the order sent."""

    achievements = serializers.ListField(child=serializers.CharField(), required=False)
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
        Mission.objects.bulk_create(
            Mission(project=project, description=description, display_order=order)
            for order, description in enumerate(descriptions)
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

    Saving through the proxy sets the kind. A name is unique within its kind;
    DRF does not derive that validator from the (name, kind) constraint since
    kind is not a field here, so it is checked by hand.
    """

    class Meta:
        fields = ["id", "name"]

    def validate_name(self, value):
        others = self.Meta.model.objects.filter(name=value)
        if self.instance is not None:
            others = others.exclude(pk=self.instance.pk)
        if others.exists():
            raise serializers.ValidationError(
                f"A {self.Meta.model._meta.verbose_name} with this name already exists."
            )
        return value


class SkillSerializer(TagSerializer):
    class Meta(TagSerializer.Meta):
        model = Skill


class ToolSerializer(TagSerializer):
    class Meta(TagSerializer.Meta):
        model = Tool


class MethodologySerializer(TagSerializer):
    class Meta(TagSerializer.Meta):
        model = Methodology
