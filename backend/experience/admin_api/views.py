from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from experience.admin_api import serializers
from experience.models import Education


class AdminViewSet(viewsets.ModelViewSet):
    """Full CRUD for the site admin, hidden entries included."""

    permission_classes = [IsAdminUser]


class EducationViewSet(AdminViewSet):
    queryset = Education.objects.all()
    serializer_class = serializers.EducationSerializer
