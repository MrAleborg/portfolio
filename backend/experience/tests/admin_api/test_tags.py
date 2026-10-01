"""Tests for the admin tag endpoints: skills, tools and methodologies.

Routes: ``skills/``, ``tools/`` and ``methodologies/`` (list, create) and
their ``{id}/`` detail (retrieve, update, partial update, delete) under
``/api/v1/admin/``. The kind comes from the route, and a name is unique
within its kind, in each language. The three kinds behave the same, so every test runs once per
kind through the ``route`` fixture.
"""

from datetime import date

import pytest

from experience.languages import LANGUAGES
from experience.models import Methodology, Project, Skill, Tag, TagCategory, Tool
from experience.tests.admin_api.helpers import detail_url, list_url, listed_ids

pytestmark = pytest.mark.django_db

# (URL basename, path segment, proxy model, another kind's proxy model)
TAG_ROUTES = [
    ("skill", "skills", Skill, Tool),
    ("tool", "tools", Tool, Methodology),
    ("methodology", "methodologies", Methodology, Skill),
]


@pytest.fixture(params=TAG_ROUTES, ids=[route[0] for route in TAG_ROUTES])
def route(request):
    """Run the test once for each tag kind."""
    return request.param


def test_routes(route):
    """URL names resolve to the agreed paths (other tests only use the names)."""
    basename, segment, _, _ = route

    assert list_url(basename) == f"/api/v1/admin/{segment}/"
    assert detail_url(basename, 1) == f"/api/v1/admin/{segment}/1/"


def test_list_returns_only_tags_of_its_kind_by_name(staff_api_client, route):
    """Each route lists its own kind, ordered by name."""
    basename, _, model, other = route
    second = model.objects.create(name_en="B", name_fr="B")
    first = model.objects.create(name_en="A", name_fr="A")
    other.objects.create(name_en="C", name_fr="C")

    response = staff_api_client.get(list_url(basename))

    assert response.status_code == 200
    assert listed_ids(response) == [first.id, second.id]


def test_detail_returns_id_and_name(staff_api_client, route):
    """A tag's kind is the route, so it is not a field."""
    basename, _, model, _ = route
    tag = model.objects.create(
        name_en="Project management", name_fr="Gestion de projet"
    )

    response = staff_api_client.get(detail_url(basename, tag.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": tag.id,
        "name": {"en": "Project management", "fr": "Gestion de projet"},
        "categories": [],
        "note": {"en": "", "fr": ""},
    }


def test_create_sets_the_kind_of_the_route(staff_api_client, route):
    """The client only sends a name; the route decides the kind."""
    basename, _, model, _ = route

    response = staff_api_client.post(
        list_url(basename), {"name": {"en": "Python", "fr": "Python"}}, format="json"
    )

    assert response.status_code == 201
    tag = Tag.objects.get()
    assert response.json() == {
        "id": tag.id,
        "name": {"en": "Python", "fr": "Python"},
        "categories": [],
        "note": {"en": "", "fr": ""},
    }
    assert tag.kind == model.KIND


def test_create_ignores_a_kind_in_the_payload(staff_api_client, route):
    """A kind in the body cannot move a tag to another route."""
    basename, _, model, other = route

    staff_api_client.post(
        list_url(basename),
        {"name": {"en": "Python", "fr": "Python"}, "kind": other.KIND},
        format="json",
    )

    assert Tag.objects.get().kind == model.KIND


def test_create_without_name_is_a_bad_request(staff_api_client, route):
    """The name is required."""
    basename, _, _, _ = route

    response = staff_api_client.post(list_url(basename), {}, format="json")

    assert response.status_code == 400
    assert list(response.json()) == ["name"]


def test_create_with_duplicate_name_is_a_bad_request(staff_api_client, route):
    """A name is unique within its kind: a 400, not a database error."""
    basename, _, model, _ = route
    model.objects.create(name_en="Python", name_fr="Python")

    response = staff_api_client.post(
        list_url(basename), {"name": {"en": "Python", "fr": "Python"}}, format="json"
    )

    assert response.status_code == 400
    assert list(response.json()) == ["name"]


def test_name_taken_in_one_language_is_a_bad_request(staff_api_client, route):
    """Uniqueness holds per language; the error names the clashing one."""
    basename, _, model, _ = route
    model.objects.create(name_en="Project management", name_fr="Gestion de projet")

    response = staff_api_client.post(
        list_url(basename),
        {"name": {"en": "Project management", "fr": "Management de projet"}},
        format="json",
    )

    assert response.status_code == 400
    assert list(response.json()["name"]) == ["en"]


@pytest.mark.parametrize("language", LANGUAGES)
def test_name_longer_than_the_column_is_a_bad_request(
    staff_api_client, route, language
):
    """The name columns hold 100 characters; the error names the language."""
    basename, _, _, _ = route
    name = {"en": "Python", "fr": "Python", language: "x" * 101}

    response = staff_api_client.post(list_url(basename), {"name": name}, format="json")

    assert response.status_code == 400
    assert list(response.json()["name"]) == [language]
    assert not Tag.objects.exists()


def test_same_name_is_allowed_in_another_kind(staff_api_client, route):
    """Uniqueness is per kind, so a skill and a tool may share a name."""
    basename, _, _, other = route
    other.objects.create(name_en="Python", name_fr="Python")

    response = staff_api_client.post(
        list_url(basename), {"name": {"en": "Python", "fr": "Python"}}, format="json"
    )

    assert response.status_code == 201


def test_rename(staff_api_client, route):
    """PATCH renames the tag, and keeping its own name is not a duplicate."""
    basename, _, model, _ = route
    tag = model.objects.create(name_en="Pyhton", name_fr="Pyhton")

    renamed = staff_api_client.patch(
        detail_url(basename, tag.id),
        {"name": {"en": "Python", "fr": "Python"}},
        format="json",
    )
    unchanged = staff_api_client.put(
        detail_url(basename, tag.id),
        {"name": {"en": "Python", "fr": "Python"}},
        format="json",
    )

    assert renamed.status_code == 200
    assert unchanged.status_code == 200
    tag.refresh_from_db()
    assert (tag.name_en, tag.name_fr) == ("Python", "Python")


def test_rename_to_a_taken_name_is_a_bad_request(staff_api_client, route):
    """Renaming cannot create a duplicate either."""
    basename, _, model, _ = route
    model.objects.create(name_en="Python", name_fr="Python")
    tag = model.objects.create(name_en="Go", name_fr="Go")

    response = staff_api_client.patch(
        detail_url(basename, tag.id),
        {"name": {"en": "Python", "fr": "Python"}},
        format="json",
    )

    assert response.status_code == 400
    assert list(response.json()) == ["name"]


def test_delete_unlinks_the_tag_from_projects(staff_api_client, route):
    """Deleting a tag keeps the entries that used it."""
    basename, _, model, _ = route
    tag = model.objects.create(name_en="Python", name_fr="Python")
    project = Project.objects.create(
        title_en="Portfolio", title_fr="Portfolio", start_date=date(2024, 1, 1)
    )
    project.tags.add(tag)

    response = staff_api_client.delete(detail_url(basename, tag.id))

    assert response.status_code == 204
    assert not Tag.objects.exists()
    assert list(project.tags.all()) == []


@pytest.mark.parametrize("method", ["get", "patch", "delete"])
def test_tag_of_another_kind_is_not_found(staff_api_client, route, method):
    """Tag ids are shared across kinds, but a route only reaches its own kind."""
    basename, _, _, other = route
    tag = other.objects.create(name_en="Python", name_fr="Python")

    response = getattr(staff_api_client, method)(
        detail_url(basename, tag.id), {"name": {"en": "Go", "fr": "Go"}}, format="json"
    )

    assert response.status_code == 404
    assert Tag.objects.get().name_en == "Python"


def make_category(name="GenAI", parent=None):
    return TagCategory.objects.create(name_en=name, name_fr=name, parent=parent)


def test_create_with_categories_and_a_note(staff_api_client, route):
    """A tag is created in several categories, with a note in every language."""
    basename, _, model, _ = route
    domain = make_category("AI")
    genai = make_category("GenAI", parent=domain)
    mlops = make_category("MLOps", parent=domain)

    response = staff_api_client.post(
        list_url(basename),
        {
            "name": {"en": "Docker", "fr": "Docker"},
            "categories": [genai.id, mlops.id],
            "note": {"en": "Daily", "fr": "Au quotidien"},
        },
        format="json",
    )

    assert response.status_code == 201
    tag = model.objects.get()
    assert set(tag.categories.all()) == {genai, mlops}
    assert (tag.note_en, tag.note_fr) == ("Daily", "Au quotidien")
    assert set(response.json()["categories"]) == {genai.id, mlops.id}
    assert response.json()["note"] == {"en": "Daily", "fr": "Au quotidien"}


def test_update_sets_categories_and_note(staff_api_client, route):
    """PATCH replaces the categories and the note of an existing tag."""
    basename, _, model, _ = route
    old = make_category("Old", parent=make_category("Domain"))
    new = make_category("New", parent=old.parent)
    tag = model.objects.create(name_en="Docker", name_fr="Docker")
    tag.categories.add(old)

    response = staff_api_client.patch(
        detail_url(basename, tag.id),
        {"categories": [new.id], "note": {"en": "Daily", "fr": "Au quotidien"}},
        format="json",
    )

    assert response.status_code == 200
    assert list(tag.categories.all()) == [new]
    tag.refresh_from_db()
    assert (tag.note_en, tag.note_fr) == ("Daily", "Au quotidien")


def test_a_domain_cannot_be_a_category_of_a_tag(staff_api_client, route):
    """Tags attach to categories only: a domain id is a 400 on categories."""
    basename, _, model, _ = route
    domain = make_category("AI")

    response = staff_api_client.post(
        list_url(basename),
        {"name": {"en": "Docker", "fr": "Docker"}, "categories": [domain.id]},
        format="json",
    )

    assert response.status_code == 400
    assert list(response.json()) == ["categories"]
    assert not model.objects.exists()


def test_note_filled_in_one_language_is_a_bad_request(staff_api_client, route):
    """The note is filled in every language or left empty in all of them."""
    basename, _, model, _ = route

    response = staff_api_client.post(
        list_url(basename),
        {"name": {"en": "Docker", "fr": "Docker"}, "note": {"en": "Daily", "fr": ""}},
        format="json",
    )

    assert response.status_code == 400
    assert response.json() == {
        "note": {"fr": ["Fill in every language, or leave them all empty."]}
    }
    assert not model.objects.exists()
