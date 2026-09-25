"""Tests for the admin tag endpoints: skills, tools and methodologies.

Routes: ``skills/``, ``tools/`` and ``methodologies/`` (list, create) and
their ``{id}/`` detail (retrieve, update, partial update, delete) under
``/api/v1/admin/``. The kind comes from the route, and a name is unique
within its kind. The three kinds behave the same, so every test runs once per
kind through the ``route`` fixture.
"""

from datetime import date

import pytest

from experience.models import Methodology, Project, Skill, Tag, Tool
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
    second = model.objects.create(name="B")
    first = model.objects.create(name="A")
    other.objects.create(name="C")

    response = staff_api_client.get(list_url(basename))

    assert response.status_code == 200
    assert listed_ids(response) == [first.id, second.id]


def test_detail_returns_id_and_name(staff_api_client, route):
    """A tag has no other editable field; its kind is the route."""
    basename, _, model, _ = route
    tag = model.objects.create(name="Python")

    response = staff_api_client.get(detail_url(basename, tag.id))

    assert response.status_code == 200
    assert response.json() == {"id": tag.id, "name": "Python"}


def test_create_sets_the_kind_of_the_route(staff_api_client, route):
    """The client only sends a name; the route decides the kind."""
    basename, _, model, _ = route

    response = staff_api_client.post(
        list_url(basename), {"name": "Python"}, format="json"
    )

    assert response.status_code == 201
    tag = Tag.objects.get()
    assert response.json() == {"id": tag.id, "name": "Python"}
    assert tag.kind == model.KIND


def test_create_ignores_a_kind_in_the_payload(staff_api_client, route):
    """A kind in the body cannot move a tag to another route."""
    basename, _, model, other = route

    staff_api_client.post(
        list_url(basename), {"name": "Python", "kind": other.KIND}, format="json"
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
    model.objects.create(name="Python")

    response = staff_api_client.post(
        list_url(basename), {"name": "Python"}, format="json"
    )

    assert response.status_code == 400
    assert list(response.json()) == ["name"]


def test_same_name_is_allowed_in_another_kind(staff_api_client, route):
    """Uniqueness is per kind, so a skill and a tool may share a name."""
    basename, _, _, other = route
    other.objects.create(name="Python")

    response = staff_api_client.post(
        list_url(basename), {"name": "Python"}, format="json"
    )

    assert response.status_code == 201


def test_rename(staff_api_client, route):
    """PATCH renames the tag, and keeping its own name is not a duplicate."""
    basename, _, model, _ = route
    tag = model.objects.create(name="Pyhton")

    renamed = staff_api_client.patch(
        detail_url(basename, tag.id), {"name": "Python"}, format="json"
    )
    unchanged = staff_api_client.put(
        detail_url(basename, tag.id), {"name": "Python"}, format="json"
    )

    assert renamed.status_code == 200
    assert unchanged.status_code == 200
    tag.refresh_from_db()
    assert tag.name == "Python"


def test_rename_to_a_taken_name_is_a_bad_request(staff_api_client, route):
    """Renaming cannot create a duplicate either."""
    basename, _, model, _ = route
    model.objects.create(name="Python")
    tag = model.objects.create(name="Go")

    response = staff_api_client.patch(
        detail_url(basename, tag.id), {"name": "Python"}, format="json"
    )

    assert response.status_code == 400
    assert list(response.json()) == ["name"]


def test_delete_unlinks_the_tag_from_projects(staff_api_client, route):
    """Deleting a tag keeps the entries that used it."""
    basename, _, model, _ = route
    tag = model.objects.create(name="Python")
    project = Project.objects.create(title="Portfolio", start_date=date(2024, 1, 1))
    project.tags.add(tag)

    response = staff_api_client.delete(detail_url(basename, tag.id))

    assert response.status_code == 204
    assert not Tag.objects.exists()
    assert list(project.tags.all()) == []


@pytest.mark.parametrize("method", ["get", "patch", "delete"])
def test_tag_of_another_kind_is_not_found(staff_api_client, route, method):
    """Tag ids are shared across kinds, but a route only reaches its own kind."""
    basename, _, _, other = route
    tag = other.objects.create(name="Python")

    response = getattr(staff_api_client, method)(
        detail_url(basename, tag.id), {"name": "Go"}, format="json"
    )

    assert response.status_code == 404
    assert Tag.objects.get().name == "Python"
