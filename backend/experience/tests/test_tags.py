"""Tests for the read-only tag endpoints: skills, tools and methodologies.

Routes: ``skills/``, ``tools/`` and ``methodologies/`` (list) and their
``{id}/`` detail under ``/api/v1/experience/``. The three kinds behave the
same, so every test runs once per kind through the ``route`` fixture.
"""

from datetime import date

import pytest
from django.urls import reverse

from experience.models import Certification, Methodology, Project, Skill, Tool

pytestmark = pytest.mark.django_db

# (URL basename, path segment, proxy model) for each tag kind.
TAG_ROUTES = [
    ("skill", "skills", Skill),
    ("tool", "tools", Tool),
    ("methodology", "methodologies", Methodology),
]


@pytest.fixture(params=TAG_ROUTES, ids=[route[0] for route in TAG_ROUTES])
def route(request):
    """Run the test once for each tag kind."""
    return request.param


def list_url(basename):
    return reverse(f"experience:{basename}-list")


def detail_url(basename, pk):
    return reverse(f"experience:{basename}-detail", args=[pk])


def make_project(**kwargs):
    """Create a project; only pass the fields the test cares about."""
    fields = {"title": "Portfolio", "start_date": date(2024, 1, 1)}
    fields.update(kwargs)
    return Project.objects.create(**fields)


def make_certification(**kwargs):
    """Create a certification; only pass the fields the test cares about."""
    fields = {"name": "AWS SAA", "issuer": "AWS", "issue_date": date(2024, 1, 1)}
    fields.update(kwargs)
    return Certification.objects.create(**fields)


def test_routes(route):
    """URL names resolve to the agreed paths (other tests only use the names)."""
    basename, segment, _ = route

    assert list_url(basename) == f"/api/v1/experience/{segment}/"
    assert detail_url(basename, 1) == f"/api/v1/experience/{segment}/1/"


def test_list_is_empty_without_tags(api_client, route):
    """The list answers with a plain JSON list, without pagination envelope."""
    basename, _, _ = route

    response = api_client.get(list_url(basename))

    assert response.status_code == 200
    assert response.json() == []


def test_list_only_returns_tags_of_its_kind_ordered_by_name(api_client, route):
    """A route lists only its own kind, sorted by name, as {id, name}.

    kind is not returned: the route already tells it.
    """
    basename, _, model = route
    b = model.objects.create(name="B")
    a = model.objects.create(name="A")
    for other in (Skill, Tool, Methodology):
        if other is not model:
            other.objects.create(name="Other")

    response = api_client.get(list_url(basename))

    assert response.json() == [
        {"id": a.id, "name": "A"},
        {"id": b.id, "name": "B"},
    ]


def test_detail_returns_visible_projects_and_certifications(api_client, route):
    """The detail lists what is tagged with it ("everything about Python").

    Related entries are short summaries; hidden and untagged ones are left out.
    """
    basename, _, model = route
    tag = model.objects.create(name="Python")
    project = make_project(title="Portfolio")
    hidden_project = make_project(title="Secret", is_visible=False)
    certification = make_certification(name="PCAP")
    hidden_certification = make_certification(name="Old", is_visible=False)
    for entry in (project, hidden_project, certification, hidden_certification):
        entry.tags.add(tag)
    make_project(title="Untagged")

    response = api_client.get(detail_url(basename, tag.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": tag.id,
        "name": "Python",
        "projects": [{"id": project.id, "title": "Portfolio"}],
        "certifications": [{"id": certification.id, "name": "PCAP"}],
    }


def test_detail_of_tag_of_another_kind_is_not_found(api_client, route):
    """skills/{id}/ does not serve a tool, even though both live in Tag."""
    basename, _, model = route
    other_model = next(m for _, _, m in TAG_ROUTES if m is not model)
    other = other_model.objects.create(name="Python")

    response = api_client.get(detail_url(basename, other.id))

    assert response.status_code == 404


def test_detail_of_missing_tag_is_not_found(api_client, route):
    """An unknown id answers 404."""
    basename, _, _ = route

    response = api_client.get(detail_url(basename, 999))

    assert response.status_code == 404


def test_list_is_read_only(api_client, route):
    """Tags are managed in the admin, so the API refuses creation."""
    basename, _, _ = route

    response = api_client.post(list_url(basename), {"name": "X"})

    assert response.status_code == 405


@pytest.mark.parametrize("method", ["put", "patch", "delete"])
def test_detail_is_read_only(api_client, route, method):
    """Tags are managed in the admin, so the API refuses changes."""
    basename, _, model = route
    tag = model.objects.create(name="Python")

    response = getattr(api_client, method)(detail_url(basename, tag.id))

    assert response.status_code == 405
