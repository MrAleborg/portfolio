"""Tests for the tag category tree: domains -> categories -> tags.

A domain is a top-level TagCategory (no parent), a category is a child of a
domain. Tags attach to categories only. ``kind`` is unrelated to the tree.
"""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.urls import reverse

from experience import models
from experience.languages import LANGUAGES
from experience.models import Skill

pytestmark = pytest.mark.django_db


def make_category(name, parent=None):
    return models.TagCategory.objects.create(name_en=name, name_fr=name, parent=parent)


def make_skill(name="Python", **fields):
    return Skill.objects.create(name_en=name, name_fr=name, **fields)


def test_category_can_sit_under_a_domain():
    domain = make_category("Artificial Intelligence & Data Science")
    category = models.TagCategory(name_en="GenAI", name_fr="GenAI", parent=domain)

    category.full_clean()


def test_category_cannot_sit_under_another_category():
    domain = make_category("AI")
    category = make_category("GenAI", parent=domain)
    too_deep = models.TagCategory(name_en="RAG", name_fr="RAG", parent=category)

    with pytest.raises(ValidationError) as error:
        too_deep.full_clean()

    assert "parent" in error.value.message_dict


def test_domain_with_categories_cannot_be_given_a_parent():
    domain = make_category("AI")
    make_category("GenAI", parent=domain)
    other_domain = make_category("Software")

    domain.parent = other_domain
    with pytest.raises(ValidationError) as error:
        domain.full_clean()

    assert "parent" in error.value.message_dict


def test_category_cannot_be_its_own_parent():
    category = make_category("GenAI")

    category.parent = category
    with pytest.raises(ValidationError) as error:
        category.full_clean()

    assert "parent" in error.value.message_dict


def test_deleting_a_domain_deletes_its_categories_and_keeps_the_tags():
    domain = make_category("AI")
    category = make_category("GenAI", parent=domain)
    skill = make_skill("LLMs")
    skill.categories.add(category)

    domain.delete()

    assert not models.TagCategory.objects.filter(pk=category.pk).exists()
    assert Skill.objects.filter(pk=skill.pk).exists()
    assert skill.categories.count() == 0


def test_tag_can_belong_to_two_categories():
    domain = make_category("AI")
    genai = make_category("GenAI", parent=domain)
    mlops = make_category("MLOps", parent=domain)
    skill = make_skill("Docker")

    skill.categories.add(genai, mlops)

    assert set(skill.categories.all()) == {genai, mlops}
    assert list(genai.tags.all()) == [skill]


def test_category_is_managed_in_the_admin(admin_client):
    domain = make_category("AI")
    category = make_category("GenAI", parent=domain)

    changelist = admin_client.get(reverse("admin:experience_tagcategory_changelist"))
    change = admin_client.get(
        reverse("admin:experience_tagcategory_change", args=[category.pk])
    )

    assert changelist.status_code == 200
    assert change.status_code == 200


def test_tag_admin_edits_categories_and_note(admin_client):
    skill = make_skill()

    response = admin_client.get(reverse("admin:experience_tag_change", args=[skill.pk]))

    fields = response.context["adminform"].form.fields
    assert {"categories", "note_en", "note_fr"} <= fields.keys()


@pytest.mark.parametrize("language", LANGUAGES)
def test_note_cannot_be_filled_in_one_language_only(language):
    notes = {
        f"note_{other}": "Daily" if other == language else "" for other in LANGUAGES
    }

    with pytest.raises(IntegrityError):
        make_skill(**notes)


@pytest.mark.parametrize("text", ["", "Daily"], ids=["empty", "filled"])
def test_note_can_be_empty_or_filled_in_every_language(text):
    skill = make_skill(**{f"note_{language}": text for language in LANGUAGES})

    skill.refresh_from_db()
    assert skill.note_en == text
    assert skill.note_fr == text
