"""Tests for the read-only project endpoints.

Routes: ``projects/`` (list, filterable with ``?experience={id}``,
``?side_project=true|false`` and ``?tag={id}``) and ``projects/{id}/``
(detail) under ``/api/v1/experience/``. Only visible projects of visible
experiences (or side projects) are exposed, ordered by ``display_order`` then
newest ``start_date``, and write methods are rejected.
"""

from datetime import date

import pytest
from django.urls import reverse

from experience.models import (
    Methodology,
    Mission,
    ProfessionalExperience,
    Project,
    Skill,
    Tool,
)

pytestmark = pytest.mark.django_db

LIST_URL = reverse("experience:project-list")


def detail_url(pk):
    return reverse("experience:project-detail", args=[pk])


def make_experience(**kwargs):
    """Create a professional experience; only pass the fields the test cares about."""
    fields = {
        "company": "Acme",
        "position": "Developer",
        "start_date": date(2020, 1, 1),
    }
    fields.update(kwargs)
    return ProfessionalExperience.objects.create(**fields)


def make_project(**kwargs):
    """Create a side project by default; pass experience= for a work project."""
    fields = {"title": "Portfolio", "start_date": date(2024, 1, 1)}
    fields.update(kwargs)
    return Project.objects.create(**fields)


def listed_ids(response):
    return [entry["id"] for entry in response.json()]


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert LIST_URL == "/api/v1/experience/projects/"
    assert detail_url(1) == "/api/v1/experience/projects/1/"


def test_list_is_empty_without_projects(api_client):
    """The list answers with a plain JSON list, without pagination envelope."""
    response = api_client.get(LIST_URL)

    assert response.status_code == 200
    assert response.json() == []


def test_list_hides_invisible_projects(api_client):
    """Projects with is_visible=False are not listed."""
    visible = make_project()
    make_project(is_visible=False)

    response = api_client.get(LIST_URL)

    assert listed_ids(response) == [visible.id]


def test_list_hides_projects_of_invisible_experiences(api_client):
    """Hiding an experience hides its projects too."""
    visible = make_project(experience=make_experience())
    make_project(experience=make_experience(is_visible=False))

    response = api_client.get(LIST_URL)

    assert listed_ids(response) == [visible.id]


def test_list_is_ordered_by_display_order_then_newest_start_date(api_client):
    """display_order wins over dates; ties are broken by newest start_date."""
    old = make_project(start_date=date(2015, 1, 1), display_order=1)
    new = make_project(start_date=date(2020, 1, 1), display_order=1)
    pinned = make_project(start_date=date(2010, 1, 1), display_order=0)

    response = api_client.get(LIST_URL)

    assert listed_ids(response) == [pinned.id, new.id, old.id]


def test_detail_returns_public_fields(api_client):
    """The detail exposes public fields, its experience, missions and tags.

    The experience is a short summary. Missions are plain strings in their
    display order. Tags carry their kind and follow the Tag ordering (kind,
    then name). is_visible, display_order, created_at and updated_at must not
    leak.
    """
    experience = make_experience(company="Acme", position="Backend Developer")
    project = make_project(
        experience=experience,
        title="Billing API",
        start_date=date(2021, 3, 1),
        end_date=date(2022, 6, 30),
        description="Rewrote billing.",
        achievements=["Cut invoice time by 80%"],
    )
    Mission.objects.create(project=project, description="Second", display_order=1)
    Mission.objects.create(project=project, description="First", display_order=0)
    skill = Skill.objects.create(name="Python")
    tool = Tool.objects.create(name="Django")
    methodology = Methodology.objects.create(name="Scrum")
    project.tags.add(skill, tool, methodology)

    response = api_client.get(detail_url(project.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": project.id,
        "title": "Billing API",
        "start_date": "2021-03-01",
        "end_date": "2022-06-30",
        "is_current": False,
        "description": "Rewrote billing.",
        "achievements": ["Cut invoice time by 80%"],
        "experience": {
            "id": experience.id,
            "company": "Acme",
            "position": "Backend Developer",
        },
        "missions": ["First", "Second"],
        "tags": [
            {"id": methodology.id, "name": "Scrum", "kind": "methodology"},
            {"id": skill.id, "name": "Python", "kind": "skill"},
            {"id": tool.id, "name": "Django", "kind": "tool"},
        ],
    }


def test_detail_of_side_project_has_no_experience(api_client):
    """A side project answers experience: null, and an ongoing one is current."""
    project = make_project(end_date=None)

    response = api_client.get(detail_url(project.id))

    assert response.json()["experience"] is None
    assert response.json()["is_current"] is True


def test_list_items_have_the_detail_shape(api_client):
    """List and detail share one shape, so the frontend needs a single type."""
    project = make_project(experience=make_experience())
    Mission.objects.create(project=project, description="Build it")
    project.tags.add(Skill.objects.create(name="Python"))

    listed = api_client.get(LIST_URL).json()[0]
    detailed = api_client.get(detail_url(project.id)).json()

    assert listed == detailed


def test_list_filters_by_experience(api_client):
    """?experience={id} keeps only the projects of that experience."""
    experience = make_experience()
    work = make_project(experience=experience)
    make_project(experience=make_experience())
    make_project()

    response = api_client.get(LIST_URL, {"experience": experience.id})

    assert listed_ids(response) == [work.id]


def test_list_filters_side_projects(api_client):
    """?side_project=true keeps projects without an experience."""
    side = make_project()
    make_project(experience=make_experience())

    response = api_client.get(LIST_URL, {"side_project": "true"})

    assert listed_ids(response) == [side.id]


def test_list_filters_work_projects(api_client):
    """?side_project=false keeps projects attached to an experience."""
    make_project()
    work = make_project(experience=make_experience())

    response = api_client.get(LIST_URL, {"side_project": "false"})

    assert listed_ids(response) == [work.id]


def test_list_filters_by_tag(api_client):
    """?tag={id} keeps only the projects tagged with it."""
    python = Skill.objects.create(name="Python")
    tagged = make_project(title="Tagged")
    tagged.tags.add(python)
    make_project(title="Untagged")

    response = api_client.get(LIST_URL, {"tag": python.id})

    assert listed_ids(response) == [tagged.id]


def test_list_filters_combine(api_client):
    """Several filters narrow the list together.

    Each other project fails exactly one filter, so dropping either filter
    makes the test fail.
    """
    python = Skill.objects.create(name="Python")
    side = make_project()
    work = make_project(experience=make_experience())
    side.tags.add(python)
    work.tags.add(python)
    make_project(title="Untagged side project")

    response = api_client.get(LIST_URL, {"tag": python.id, "side_project": "true"})

    assert listed_ids(response) == [side.id]


@pytest.mark.parametrize("name", ["experience", "tag"])
def test_list_filter_by_unknown_id_is_empty(api_client, name):
    """An unknown id matches nothing, it is not an error."""
    make_project()

    response = api_client.get(LIST_URL, {name: 999})

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.parametrize(
    ("name", "value"),
    [("experience", "acme"), ("tag", "python"), ("side_project", "yes")],
)
def test_list_filter_with_invalid_value_is_a_bad_request(api_client, name, value):
    """Ids must be integers and side_project must be true or false."""
    response = api_client.get(LIST_URL, {name: value})

    assert response.status_code == 400


@pytest.mark.parametrize("name", ["experience", "tag"])
@pytest.mark.parametrize("value", ["99999999999999999999", "-1"])
def test_list_filter_with_out_of_range_id_is_a_bad_request(api_client, name, value):
    """Ids are positive and fit in the database; others are client errors, not 500."""
    response = api_client.get(LIST_URL, {name: value})

    assert response.status_code == 400


@pytest.mark.parametrize(
    ("name", "value"),
    [("experience", "999"), ("tag", "999"), ("tag", "python"), ("side_project", "yes")],
)
def test_detail_ignores_list_filters(api_client, name, value):
    """Filters belong to the list; a detail URL answers the same with or without them."""
    project = make_project()

    response = api_client.get(detail_url(project.id), {name: value})

    assert response.status_code == 200


def test_detail_of_invisible_project_is_not_found(api_client):
    """A hidden project cannot be reached by guessing its id."""
    project = make_project(is_visible=False)

    response = api_client.get(detail_url(project.id))

    assert response.status_code == 404


def test_detail_of_project_of_invisible_experience_is_not_found(api_client):
    """A project of a hidden experience cannot be reached by its id either."""
    project = make_project(experience=make_experience(is_visible=False))

    response = api_client.get(detail_url(project.id))

    assert response.status_code == 404


def test_detail_of_missing_project_is_not_found(api_client):
    """An unknown id answers 404."""
    response = api_client.get(detail_url(999))

    assert response.status_code == 404


def test_list_is_read_only(api_client):
    """Projects are managed in the admin, so the API refuses creation."""
    response = api_client.post(LIST_URL, {"title": "X"})

    assert response.status_code == 405


@pytest.mark.parametrize("method", ["put", "patch", "delete"])
def test_detail_is_read_only(api_client, method):
    """Projects are managed in the admin, so the API refuses changes."""
    project = make_project()

    response = getattr(api_client, method)(detail_url(project.id))

    assert response.status_code == 405
