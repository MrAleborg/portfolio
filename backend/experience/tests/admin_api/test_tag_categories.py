"""Tests for the admin tag category endpoints.

Routes: ``tag-categories/`` (list, create) and ``tag-categories/{id}/``
(retrieve, update, partial update, delete) under ``/api/v1/admin/``. A domain
has no parent; a category sits under a domain. The depth rules of the model
come back as a 400 on ``parent``.
"""

import pytest

from experience.models import Skill, TagCategory
from experience.tests.admin_api.helpers import detail_url, list_url, listed_ids

pytestmark = pytest.mark.django_db


def make_category(name="AI", parent=None, position=0):
    return TagCategory.objects.create(
        name_en=name, name_fr=f"{name} fr", parent=parent, position=position
    )


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert list_url("tag-category") == "/api/v1/admin/tag-categories/"
    assert detail_url("tag-category", 1) == "/api/v1/admin/tag-categories/1/"


def test_list_returns_domains_and_categories_by_position_then_name(staff_api_client):
    beta = make_category("Beta", position=1)
    alpha = make_category("Alpha", position=1)
    child = make_category("Child", parent=beta, position=0)
    gamma = make_category("Gamma", position=0)

    response = staff_api_client.get(list_url("tag-category"))

    assert response.status_code == 200
    assert listed_ids(response) == [child.id, gamma.id, alpha.id, beta.id]


def test_detail_returns_every_field(staff_api_client):
    domain = make_category("AI")
    category = make_category("GenAI", parent=domain, position=3)

    response = staff_api_client.get(detail_url("tag-category", category.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": category.id,
        "name": {"en": "GenAI", "fr": "GenAI fr"},
        "parent": domain.id,
        "position": 3,
    }


def test_create_a_domain_with_a_name_only(staff_api_client):
    response = staff_api_client.post(
        list_url("tag-category"), {"name": {"en": "AI", "fr": "IA"}}, format="json"
    )

    assert response.status_code == 201
    domain = TagCategory.objects.get()
    assert response.json() == {
        "id": domain.id,
        "name": {"en": "AI", "fr": "IA"},
        "parent": None,
        "position": 0,
    }


def test_create_a_category_under_a_domain(staff_api_client):
    domain = make_category("AI")

    response = staff_api_client.post(
        list_url("tag-category"),
        {"name": {"en": "GenAI", "fr": "IA gen"}, "parent": domain.id},
        format="json",
    )

    assert response.status_code == 201
    assert TagCategory.objects.get(pk=response.json()["id"]).parent == domain


def test_create_without_a_name_is_a_bad_request(staff_api_client):
    response = staff_api_client.post(list_url("tag-category"), {}, format="json")

    assert response.status_code == 400
    assert list(response.json()) == ["name"]


def test_create_refuses_a_name_missing_a_language(staff_api_client):
    response = staff_api_client.post(
        list_url("tag-category"), {"name": {"en": "AI", "fr": ""}}, format="json"
    )

    assert response.status_code == 400
    assert response.json() == {"name": {"fr": ["This field may not be blank."]}}


def test_create_under_a_category_is_a_bad_request(staff_api_client):
    category = make_category("GenAI", parent=make_category("AI"))

    response = staff_api_client.post(
        list_url("tag-category"),
        {"name": {"en": "RAG", "fr": "RAG"}, "parent": category.id},
        format="json",
    )

    assert response.status_code == 400
    assert list(response.json()) == ["parent"]
    assert TagCategory.objects.count() == 2


def test_a_domain_with_categories_cannot_be_given_a_parent(staff_api_client):
    domain = make_category("AI")
    make_category("GenAI", parent=domain)
    other = make_category("Software")

    response = staff_api_client.patch(
        detail_url("tag-category", domain.id), {"parent": other.id}, format="json"
    )

    assert response.status_code == 400
    assert list(response.json()) == ["parent"]
    domain.refresh_from_db()
    assert domain.parent is None


def test_a_category_holding_tags_cannot_lose_its_parent(staff_api_client):
    category = make_category("GenAI", parent=make_category("AI"))
    Skill.objects.create(name_en="LLMs", name_fr="LLMs").categories.add(category)

    response = staff_api_client.patch(
        detail_url("tag-category", category.id), {"parent": None}, format="json"
    )

    assert response.status_code == 400
    assert list(response.json()) == ["parent"]
    category.refresh_from_db()
    assert category.parent is not None


def test_a_category_cannot_be_its_own_parent(staff_api_client):
    category = make_category("GenAI", parent=make_category("AI"))

    response = staff_api_client.patch(
        detail_url("tag-category", category.id), {"parent": category.id}, format="json"
    )

    assert response.status_code == 400
    assert list(response.json()) == ["parent"]


def test_partial_update_renames_and_moves_a_category(staff_api_client):
    category = make_category("GenAI", parent=make_category("AI"))
    other = make_category("Software")

    response = staff_api_client.patch(
        detail_url("tag-category", category.id),
        {"name": {"en": "LLMs", "fr": "LLMs"}, "parent": other.id, "position": 4},
        format="json",
    )

    assert response.status_code == 200
    category.refresh_from_db()
    assert (category.name_en, category.parent, category.position) == (
        "LLMs",
        other,
        4,
    )


def test_delete_a_domain_deletes_its_categories_and_keeps_the_tags(staff_api_client):
    domain = make_category("AI")
    category = make_category("GenAI", parent=domain)
    skill = Skill.objects.create(name_en="LLMs", name_fr="LLMs")
    skill.categories.add(category)

    response = staff_api_client.delete(detail_url("tag-category", domain.id))

    assert response.status_code == 204
    assert not TagCategory.objects.exists()
    assert Skill.objects.filter(pk=skill.pk).exists()


def test_detail_of_a_missing_category_is_not_found(staff_api_client):
    response = staff_api_client.get(detail_url("tag-category", 999))

    assert response.status_code == 404
