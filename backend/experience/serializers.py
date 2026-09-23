from rest_framework import serializers

from experience.models import Certification, Education, Project, Tag


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


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class ProjectSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "title"]


class CertificationSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ["id", "name"]


class TagDetailSerializer(TagSerializer):
    """A tag with the visible entries tagged with it.

    The view must prefetch projects and certifications filtered on is_visible.
    """

    projects = ProjectSummarySerializer(many=True, read_only=True)
    certifications = CertificationSummarySerializer(many=True, read_only=True)

    class Meta(TagSerializer.Meta):
        fields = [*TagSerializer.Meta.fields, "projects", "certifications"]
