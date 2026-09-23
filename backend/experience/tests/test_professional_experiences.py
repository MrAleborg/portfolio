"""Tests for the read-only professional experience endpoints.

Routes: ``professional-experiences/`` (list) and
``professional-experiences/{id}/`` (detail) under ``/api/v1/experience/``.
Only visible experiences are exposed, ordered by ``display_order`` then newest
``start_date``, each with its visible projects nested, and write methods are
rejected.
"""

from datetime import date

import pytest
from django.urls import reverse

from experience.models import Mission, ProfessionalExperience, Project, Skill

pytestmark = pytest.mark.django_db

LIST_URL = reverse("experience:professionalexperience-list")


def detail_url(pk):
    return reverse("experience:professionalexperience-detail", args=[pk])


def make_experience(**kwargs):
    """Create a professional experience; only pass the fields the test cares about."""
    fields = {
        "company": "Acme",
        "position": "Developer",
        "start_date": date(2020, 1, 1),
    }
    fields.update(kwargs)
    return ProfessionalExperience.objects.create(**fields)


def make_project(experience, **kwargs):
    """Create a project of `experience`; only pass the fields the test cares about."""
    fields = {"title": "Billing API", "start_date": date(2021, 1, 1)}
    fields.update(kwargs)
    return Project.objects.create(experience=experience, **fields)


def listed_ids(response):
    return [entry["id"] for entry in response.json()]


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert LIST_URL == "/api/v1/experience/professional-experiences/"
    assert detail_url(1) == "/api/v1/experience/professional-experiences/1/"


def test_list_is_empty_without_experiences(api_client):
    """The list answers with a plain JSON list, without pagination envelope."""
    response = api_client.get(LIST_URL)

    assert response.status_code == 200
    assert response.json() == []


def test_list_hides_invisible_experiences(api_client):
    """Experiences with is_visible=False are not listed."""
    visible = make_experience()
    make_experience(is_visible=False)

    response = api_client.get(LIST_URL)

    assert listed_ids(response) == [visible.id]


def test_list_is_ordered_by_display_order_then_newest_start_date(api_client):
    """display_order wins over dates; ties are broken by newest start_date."""
    old = make_experience(start_date=date(2015, 1, 1), display_order=1)
    new = make_experience(start_date=date(2020, 1, 1), display_order=1)
    pinned = make_experience(start_date=date(2010, 1, 1), display_order=0)

    response = api_client.get(LIST_URL)

    assert listed_ids(response) == [pinned.id, new.id, old.id]


def test_detail_returns_public_fields(api_client):
    """The detail exposes public fields and its projects in full.

    Nested projects have the projects/ shape minus experience, which would
    only repeat the parent. is_visible, display_order, created_at and
    updated_at must not leak.
    """
    experience = make_experience(
        company="Acme",
        position="Backend Developer",
        employment_type=ProfessionalExperience.EmploymentType.CONTRACT,
        company_url="https://acme.example.com",
        location="Paris",
        start_date=date(2020, 1, 1),
        end_date=date(2023, 12, 31),
        description="Payments team.",
    )
    project = make_project(
        experience,
        title="Billing API",
        start_date=date(2021, 3, 1),
        end_date=None,
        description="Rewrote billing.",
        achievements=["Cut invoice time by 80%"],
    )
    Mission.objects.create(project=project, description="Design the API")
    skill = Skill.objects.create(name="Python")
    project.tags.add(skill)

    response = api_client.get(detail_url(experience.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": experience.id,
        "company": "Acme",
        "position": "Backend Developer",
        "employment_type": "contract",
        "company_url": "https://acme.example.com",
        "location": "Paris",
        "start_date": "2020-01-01",
        "end_date": "2023-12-31",
        "is_current": False,
        "description": "Payments team.",
        "projects": [
            {
                "id": project.id,
                "title": "Billing API",
                "start_date": "2021-03-01",
                "end_date": None,
                "is_current": True,
                "description": "Rewrote billing.",
                "achievements": ["Cut invoice time by 80%"],
                "missions": ["Design the API"],
                "tags": [{"id": skill.id, "name": "Python", "kind": "skill"}],
            }
        ],
    }


def test_detail_hides_invisible_projects(api_client):
    """Hidden projects are left out of their experience."""
    experience = make_experience()
    visible = make_project(experience, title="Visible")
    make_project(experience, title="Hidden", is_visible=False)

    response = api_client.get(detail_url(experience.id))

    assert [p["id"] for p in response.json()["projects"]] == [visible.id]


def test_detail_lists_projects_in_their_display_order(api_client):
    """Nested projects follow the projects/ ordering."""
    experience = make_experience()
    old = make_project(experience, start_date=date(2015, 1, 1), display_order=1)
    new = make_project(experience, start_date=date(2020, 1, 1), display_order=1)
    pinned = make_project(experience, start_date=date(2010, 1, 1), display_order=0)

    response = api_client.get(detail_url(experience.id))

    ids = [p["id"] for p in response.json()["projects"]]
    assert ids == [pinned.id, new.id, old.id]


def test_list_items_have_the_detail_shape(api_client):
    """List and detail share one shape, so the frontend needs a single type."""
    experience = make_experience()
    project = make_project(experience)
    Mission.objects.create(project=project, description="Build it")
    project.tags.add(Skill.objects.create(name="Python"))

    listed = api_client.get(LIST_URL).json()[0]
    detailed = api_client.get(detail_url(experience.id)).json()

    assert listed == detailed


def test_detail_of_invisible_experience_is_not_found(api_client):
    """A hidden experience cannot be reached by guessing its id."""
    experience = make_experience(is_visible=False)

    response = api_client.get(detail_url(experience.id))

    assert response.status_code == 404


def test_detail_of_missing_experience_is_not_found(api_client):
    """An unknown id answers 404."""
    response = api_client.get(detail_url(999))

    assert response.status_code == 404


def test_list_is_read_only(api_client):
    """Experiences are managed in the admin, so the API refuses creation."""
    response = api_client.post(LIST_URL, {"company": "X"})

    assert response.status_code == 405


@pytest.mark.parametrize("method", ["put", "patch", "delete"])
def test_detail_is_read_only(api_client, method):
    """Experiences are managed in the admin, so the API refuses changes."""
    experience = make_experience()

    response = getattr(api_client, method)(detail_url(experience.id))

    assert response.status_code == 405
