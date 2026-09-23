from rest_framework import serializers

from experience.models import Education


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
