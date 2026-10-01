from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from experience.admin_api import serializers
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
    TagCategory,
    Tool,
)


class AdminViewSet(viewsets.ModelViewSet):
    """Full CRUD for the site admin, hidden entries included."""

    permission_classes = [IsAdminUser]


class EducationViewSet(AdminViewSet):
    queryset = Education.objects.all()
    serializer_class = serializers.EducationSerializer


class ProfessionalExperienceViewSet(AdminViewSet):
    queryset = ProfessionalExperience.objects.all()
    serializer_class = serializers.ProfessionalExperienceSerializer


class ProjectViewSet(AdminViewSet):
    queryset = Project.objects.prefetch_related("missions", "tags")
    serializer_class = serializers.ProjectSerializer


class CertificationViewSet(AdminViewSet):
    queryset = Certification.objects.prefetch_related("tags", "specializations")
    serializer_class = serializers.CertificationSerializer


class SpecializationViewSet(AdminViewSet):
    queryset = Specialization.objects.prefetch_related("certifications")
    serializer_class = serializers.SpecializationSerializer


class SkillViewSet(AdminViewSet):
    queryset = Skill.objects.prefetch_related("categories")
    serializer_class = serializers.SkillSerializer


class ToolViewSet(AdminViewSet):
    queryset = Tool.objects.prefetch_related("categories")
    serializer_class = serializers.ToolSerializer


class MethodologyViewSet(AdminViewSet):
    queryset = Methodology.objects.prefetch_related("categories")
    serializer_class = serializers.MethodologySerializer


class TagCategoryViewSet(AdminViewSet):
    queryset = TagCategory.objects.all()
    serializer_class = serializers.TagCategorySerializer


class HobbyViewSet(AdminViewSet):
    queryset = Hobby.objects.all()
    serializer_class = serializers.HobbySerializer


class CommitmentViewSet(AdminViewSet):
    queryset = Commitment.objects.all()
    serializer_class = serializers.CommitmentSerializer


class ScientificCommunicationViewSet(AdminViewSet):
    queryset = ScientificCommunication.objects.all()
    serializer_class = serializers.ScientificCommunicationSerializer
