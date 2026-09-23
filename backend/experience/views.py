from rest_framework import viewsets

from experience.models import Education
from experience.serializers import EducationSerializer


class EducationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Education.objects.filter(is_visible=True)
    serializer_class = EducationSerializer
