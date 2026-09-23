from django.db.models import Prefetch
from rest_framework import viewsets

from experience.models import (
    Certification,
    Education,
    Methodology,
    Project,
    Skill,
    Tool,
)
from experience.serializers import (
    EducationSerializer,
    TagDetailSerializer,
    TagSerializer,
)


class EducationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Education.objects.filter(is_visible=True)
    serializer_class = EducationSerializer


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """Base for the tag kinds; subclasses set queryset to their proxy model."""

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == "retrieve":
            queryset = queryset.prefetch_related(
                Prefetch("projects", queryset=Project.objects.filter(is_visible=True)),
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
