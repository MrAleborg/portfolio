from django.db.models import Exists, OuterRef, Prefetch, Q
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny

from experience.models import (
    Certification,
    Commitment,
    Education,
    Hobby,
    Methodology,
    ProfessionalExperience,
    Project,
    ScientificCommunication,
    Skill,
    Specialization,
    Tool,
)
from experience.serializers import (
    CertificationSerializer,
    CommitmentSerializer,
    EducationSerializer,
    HobbySerializer,
    ProfessionalExperienceSerializer,
    ProjectSerializer,
    ScientificCommunicationSerializer,
    SpecializationSerializer,
    TagDetailSerializer,
    TagSerializer,
)

# Largest value of a bigint primary key.
MAX_ID = 2**63 - 1


def parse_id(request, name):
    """Return query parameter `name` as an int, or None when it is absent.

    A value that is not an id (not an integer, or outside 1..MAX_ID) is a
    client error (400).
    """
    value = request.query_params.get(name)
    if value is None:
        return None
    error = ValidationError({name: [f"A valid {name} id is required."]})
    try:
        id_ = int(value)
    except ValueError:
        raise error from None
    if not 1 <= id_ <= MAX_ID:
        raise error
    return id_


def visible_projects():
    """Visible projects that are side projects or belong to a visible experience."""
    return Project.objects.filter(is_visible=True).filter(
        Q(experience__isnull=True) | Q(experience__is_visible=True)
    )


class PublicReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    """Base of the public API: anyone can read, since the default is admin only."""

    permission_classes = [AllowAny]


class EducationViewSet(PublicReadOnlyViewSet):
    queryset = Education.objects.filter(is_visible=True)
    serializer_class = EducationSerializer


class CertificationViewSet(PublicReadOnlyViewSet):
    queryset = Certification.objects.filter(is_visible=True).prefetch_related(
        "tags",
        Prefetch(
            "specializations",
            queryset=Specialization.objects.filter(is_visible=True),
        ),
    )
    serializer_class = CertificationSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action != "list":
            return queryset
        tag_id = parse_id(self.request, "tag")
        if tag_id is not None:
            queryset = queryset.filter(tags=tag_id)
        return queryset


class ProfessionalExperienceViewSet(PublicReadOnlyViewSet):
    queryset = ProfessionalExperience.objects.filter(is_visible=True).prefetch_related(
        Prefetch(
            "projects",
            queryset=visible_projects().prefetch_related("missions", "tags"),
        ),
    )
    serializer_class = ProfessionalExperienceSerializer


class ProjectViewSet(PublicReadOnlyViewSet):
    queryset = (
        visible_projects()
        .select_related("experience")
        .prefetch_related("missions", "tags")
    )
    serializer_class = ProjectSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action != "list":
            return queryset
        experience_id = parse_id(self.request, "experience")
        if experience_id is not None:
            queryset = queryset.filter(experience=experience_id)
        side_project = self.request.query_params.get("side_project")
        if side_project == "true":
            queryset = queryset.filter(experience__isnull=True)
        elif side_project == "false":
            queryset = queryset.filter(experience__isnull=False)
        elif side_project is not None:
            raise ValidationError({"side_project": ["Must be true or false."]})
        tag_id = parse_id(self.request, "tag")
        if tag_id is not None:
            queryset = queryset.filter(tags=tag_id)
        return queryset


class SpecializationViewSet(PublicReadOnlyViewSet):
    queryset = Specialization.objects.filter(is_visible=True).prefetch_related(
        Prefetch(
            "certifications",
            queryset=Certification.objects.filter(is_visible=True),
        ),
    )
    serializer_class = SpecializationSerializer


class TagViewSet(PublicReadOnlyViewSet):
    """Base for the tag kinds; subclasses set queryset to their proxy model."""

    def get_queryset(self):
        # Hidden entries must not leak through their tags.
        in_visible_entry = Exists(
            visible_projects().filter(tags=OuterRef("pk"))
        ) | Exists(Certification.objects.filter(is_visible=True, tags=OuterRef("pk")))
        queryset = super().get_queryset().filter(in_visible_entry)
        if self.action == "retrieve":
            queryset = queryset.prefetch_related(
                Prefetch("projects", queryset=visible_projects()),
                Prefetch(
                    "certifications",
                    queryset=Certification.objects.filter(is_visible=True),
                ),
            )
        return queryset

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TagDetailSerializer
        return TagSerializer


class SkillViewSet(TagViewSet):
    queryset = Skill.objects.all()


class ToolViewSet(TagViewSet):
    queryset = Tool.objects.all()


class MethodologyViewSet(TagViewSet):
    queryset = Methodology.objects.all()


class HobbyViewSet(PublicReadOnlyViewSet):
    queryset = Hobby.objects.filter(is_visible=True)
    serializer_class = HobbySerializer


class CommitmentViewSet(PublicReadOnlyViewSet):
    queryset = Commitment.objects.filter(is_visible=True)
    serializer_class = CommitmentSerializer


class ScientificCommunicationViewSet(PublicReadOnlyViewSet):
    queryset = ScientificCommunication.objects.filter(is_visible=True)
    serializer_class = ScientificCommunicationSerializer
