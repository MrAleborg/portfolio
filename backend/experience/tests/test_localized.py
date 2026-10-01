"""Tests for LocalizedField, the serializer field of translated text.

A translated field is stored as one column per language (title_en, title_fr)
and exchanged with the API as a single object: {"en": "...", "fr": "..."}.
Every language must be filled in; an optional field is either filled in every
language or left empty in all of them. Errors are nested per language so a
form can show them next to the right input.
"""

from types import SimpleNamespace

from rest_framework import serializers

from experience.localized import LocalizedField
from experience.models import Tag


class EntrySerializer(serializers.Serializer):
    title = LocalizedField()
    grade = LocalizedField(required=False, allow_blank=True)


def validate(data):
    serializer = EntrySerializer(data=data)
    serializer.is_valid()
    return serializer


def test_represents_one_value_per_language():
    entry = SimpleNamespace(
        title_en="Master", title_fr="Master 2", grade_en="", grade_fr=""
    )

    data = EntrySerializer(entry).data

    assert data == {
        "title": {"en": "Master", "fr": "Master 2"},
        "grade": {"en": "", "fr": ""},
    }


def test_writes_one_column_per_language():
    serializer = validate({"title": {"en": "Master", "fr": "Master 2"}})

    assert serializer.errors == {}
    assert serializer.validated_data == {"title_en": "Master", "title_fr": "Master 2"}


def test_optional_field_can_be_omitted():
    """Nothing is written, so the columns keep their current value."""
    serializer = validate({"title": {"en": "Master", "fr": "Master 2"}})

    assert "grade_en" not in serializer.validated_data
    assert "grade_fr" not in serializer.validated_data


def test_optional_field_can_be_empty_in_every_language():
    serializer = validate(
        {"title": {"en": "Master", "fr": "Master 2"}, "grade": {"en": "", "fr": ""}}
    )

    assert serializer.errors == {}
    assert serializer.validated_data["grade_en"] == ""
    assert serializer.validated_data["grade_fr"] == ""


def test_refuses_a_missing_language():
    serializer = validate({"title": {"en": "Master"}})

    assert serializer.errors == {"title": {"fr": ["This field is required."]}}


def test_refuses_an_unknown_language():
    serializer = validate({"title": {"en": "Master", "fr": "Master 2", "de": "M"}})

    assert serializer.errors == {"title": {"de": ["Unknown language."]}}


def test_refuses_a_value_that_is_not_an_object():
    serializer = validate({"title": "Master"})

    assert serializer.errors == {
        "title": ["Expected an object with one text per language: en, fr."]
    }


def test_refuses_a_text_that_is_not_a_string():
    serializer = validate({"title": {"en": "Master", "fr": ["Master 2"]}})

    assert serializer.errors == {"title": {"fr": ["Not a valid string."]}}


def test_required_field_refuses_an_empty_language():
    """Whitespace only counts as empty, as with DRF's CharField."""
    serializer = validate({"title": {"en": "Master", "fr": "  "}})

    assert serializer.errors == {"title": {"fr": ["This field may not be blank."]}}


def test_optional_field_refuses_a_single_empty_language():
    serializer = validate(
        {"title": {"en": "Master", "fr": "Master 2"}, "grade": {"en": "A", "fr": ""}}
    )

    assert serializer.errors == {
        "grade": {"fr": ["Fill in every language, or leave them all empty."]}
    }


def test_trims_whitespace():
    serializer = validate({"title": {"en": " Master ", "fr": "Master 2\n"}})

    assert serializer.validated_data == {"title_en": "Master", "title_fr": "Master 2"}


def test_explicit_max_length_wins_over_the_model_column():
    """On a model serializer the column's limit is only the default."""

    class TagSerializer(serializers.ModelSerializer):
        name = LocalizedField(max_length=200)

        class Meta:
            model = Tag
            fields = ["name"]

    serializer = TagSerializer(data={"name": {"en": "x" * 150, "fr": "y"}})

    assert serializer.is_valid(), serializer.errors
