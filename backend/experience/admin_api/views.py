from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from experience.admin_api import serializers
from experience.models import (
    Certification,
    Education,
    Methodology,
    ProfessionalExperience,
    Project,
    Skill,
    Specialization,
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
    queryset = Skill.objects.all()
    serializer_class = serializers.SkillSerializer


class ToolViewSet(AdminViewSet):
    queryset = Tool.objects.all()
    serializer_class = serializers.ToolSerializer


class MethodologyViewSet(AdminViewSet):
    queryset = Methodology.objects.all()
    serializer_class = serializers.MethodologySerializer
