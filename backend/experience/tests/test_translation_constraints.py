"""Tests for the translation rules enforced by the database.

A translated text is stored as one column per language (grade_en, grade_fr).
An optional one is filled in every language or left empty in all of them. The
rule is a check constraint, so it holds for the admin API, the Django admin
(which validates constraints in ``full_clean``) and any other writer.
"""

from datetime import date

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from experience.languages import LANGUAGES
from experience.models import (
    Certification,
    Education,
    ProfessionalExperience,
    Project,
    Skill,
    Specialization,
    Tool,
)

pytestmark = pytest.mark.django_db

# Required fields of each model, and its optional translated fields.
ROWS = {
    Education: {
        "institution": "University",
        "degree_en": "MSc",
        "degree_fr": "Master",
        "start_date": date(2020, 9, 1),
    },
    ProfessionalExperience: {
        "company": "Acme",
        "position_en": "Developer",
        "position_fr": "Développeur",
        "start_date": date(2020, 1, 1),
    },
    Project: {
        "title_en": "Portfolio",
        "title_fr": "Portfolio",
        "start_date": date(2024, 1, 1),
    },
    Certification: {
        "name_en": "PCAP",
        "name_fr": "PCAP",
        "issuer": "Python Institute",
        "issue_date": date(2024, 1, 1),
    },
    Specialization: {
        "name_en": "Python Path",
        "name_fr": "Parcours Python",
        "issuer": "Python Institute",
        "issue_date": date(2024, 1, 1),
    },
}
OPTIONAL_TRANSLATIONS = [
    (Education, "field_of_study"),
    (Education, "grade"),
    (Education, "location"),
    (ProfessionalExperience, "location"),
    *((model, "description") for model in ROWS),
]


def case_id(case):
    model, field = case
    return f"{model.__name__}.{field}"


def only_in(field, language):
    """The field filled in `language` only, empty in the others."""
    return {
        f"{field}_{other}": "Text" if other == language else "" for other in LANGUAGES
    }


@pytest.mark.parametrize("language", LANGUAGES)
@pytest.mark.parametrize("case", OPTIONAL_TRANSLATIONS, ids=case_id)
def test_optional_translation_cannot_be_filled_in_one_language_only(case, language):
    model, field = case
    with pytest.raises(IntegrityError):
        model.objects.create(**ROWS[model], **only_in(field, language))


@pytest.mark.parametrize("case", OPTIONAL_TRANSLATIONS, ids=case_id)
@pytest.mark.parametrize("text", ["", "Text"], ids=["empty", "filled"])
def test_optional_translation_can_be_empty_or_filled_in_every_language(case, text):
    model, field = case
    model.objects.create(
        **ROWS[model], **{f"{field}_{language}": text for language in LANGUAGES}
    )


def test_full_clean_reports_the_translation_rule():
    """Model validation (used by the Django admin forms) catches the rule too."""
    education = Education(**ROWS[Education], **only_in("grade", "en"))

    with pytest.raises(ValidationError):
        education.full_clean()


def test_full_clean_refuses_a_required_translation_missing_a_language():
    """Required texts are not blank in any language (the admin form refuses)."""
    education = Education(**{**ROWS[Education], "degree_fr": ""})

    with pytest.raises(ValidationError) as error:
        education.full_clean()

    assert "degree_fr" in error.value.message_dict


@pytest.mark.parametrize("language", LANGUAGES)
def test_tag_name_is_unique_within_its_kind_in_each_language(language):
    """Two skills cannot share a name in any language."""
    Skill.objects.create(name_en="Project management", name_fr="Gestion de projet")
    names = {"name_en": "Other", "name_fr": "Autre"}
    names[f"name_{language}"] = {"en": "Project management", "fr": "Gestion de projet"}[
        language
    ]

    with pytest.raises(IntegrityError):
        Skill.objects.create(**names)


def test_tag_name_may_be_shared_by_another_kind():
    Skill.objects.create(name_en="Python", name_fr="Python")

    Tool.objects.create(name_en="Python", name_fr="Python")


@pytest.mark.parametrize(
    "achievements",
    [[], [{"en": "Won an award", "fr": "A remporté un prix"}]],
    ids=["none", "one"],
)
def test_project_achievements_in_every_language_are_valid(achievements):
    """The shape the API serves: a list of {en, fr} texts, possibly empty."""
    project = Project(**ROWS[Project], achievements=achievements)

    project.full_clean()


@pytest.mark.parametrize(
    "achievements",
    [
        "Won an award",
        {"en": "Won an award", "fr": "A remporté un prix"},
        ["Won an award"],
        [{"en": "Won an award"}],
        [{"en": "Won an award", "fr": ""}],
        [{"en": "Won an award", "fr": "  "}],
        [{"en": "Won an award", "fr": 1}],
        [{"en": "Won an award", "fr": "A remporté un prix", "de": "Preis"}],
    ],
    ids=[
        "text",
        "object",
        "plain text item",
        "missing language",
        "empty language",
        "whitespace-only language",
        "not a text",
        "unknown language",
    ],
)
def test_full_clean_refuses_achievements_not_in_every_language(achievements):
    """The Django admin edits the JSON by hand; the API's shape must still hold."""
    project = Project(**ROWS[Project], achievements=achievements)

    with pytest.raises(ValidationError) as error:
        project.full_clean()

    assert list(error.value.message_dict) == ["achievements"]
