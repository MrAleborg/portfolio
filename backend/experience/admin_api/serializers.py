"""Serializers of the admin API: every field, writable except timestamps."""

from rest_framework import serializers

from experience.models import Education

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
