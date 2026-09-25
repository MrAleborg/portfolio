"""Tests for the admin professional experience endpoints.

Routes: ``professional-experiences/`` (list, create) and
``professional-experiences/{id}/`` (retrieve, update, partial update, delete)
under ``/api/v1/admin/``. Projects are not nested here: they are edited on
``projects/`` and point to their experience. Deleting an experience deletes
its projects.
"""

from datetime import date

import pytest

from experience.models import ProfessionalExperience, Project
from experience.tests.admin_api.helpers import (
    detail_url,
    list_url,
    listed_ids,
    timestamps,
)

pytestmark = pytest.mark.django_db

BASENAME = "professionalexperience"
LIST_URL = list_url(BASENAME)


def make_experience(**kwargs):
    """Create a professional experience; only pass the fields the test cares about."""
    fields = {
        "company": "Acme",
        "position": "Developer",
        "start_date": date(2020, 1, 1),
    }
    fields.update(kwargs)
    return ProfessionalExperience.objects.create(**fields)


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert LIST_URL == "/api/v1/admin/professional-experiences/"
    assert detail_url(BASENAME, 1) == "/api/v1/admin/professional-experiences/1/"


def test_list_includes_hidden_entries_in_display_order(staff_api_client):
    """The admin sees everything, in the same order as the public site."""
    hidden = make_experience(is_visible=False, display_order=0)
    old = make_experience(start_date=date(2010, 1, 1), display_order=1)
    new = make_experience(start_date=date(2015, 1, 1), display_order=1)

    response = staff_api_client.get(LIST_URL)

    assert response.status_code == 200
    assert listed_ids(response) == [hidden.id, new.id, old.id]


def test_detail_returns_every_field_without_projects(staff_api_client):
    """The internal fields are included; projects are managed on their own route."""
    experience = make_experience(
        company="Acme",
        position="Backend developer",
        employment_type=ProfessionalExperience.EmploymentType.CONTRACT,
        company_url="https://acme.example",
        location="Paris",
        start_date=date(2021, 1, 4),
        description="Payments team.",
        display_order=2,
        is_visible=False,
    )
    Project.objects.create(
        experience=experience, title="Billing", start_date=date(2021, 2, 1)
    )

    response = staff_api_client.get(detail_url(BASENAME, experience.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": experience.id,
        "company": "Acme",
        "position": "Backend developer",
        "employment_type": "contract",
        "company_url": "https://acme.example",
        "location": "Paris",
        "start_date": "2021-01-04",
        "end_date": None,
        "is_current": True,
        "description": "Payments team.",
        "display_order": 2,
        "is_visible": False,
        **timestamps(experience),
    }


def test_create_with_required_fields_only(staff_api_client):
    """The employment type defaults to full-time, like in the model."""
    response = staff_api_client.post(
        LIST_URL,
        {"company": "Acme", "position": "Developer", "start_date": "2024-01-01"},
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["employment_type"] == "full_time"
    assert ProfessionalExperience.objects.get().company == "Acme"


def test_create_without_required_fields_is_a_bad_request(staff_api_client):
    """Each missing required field is reported."""
    response = staff_api_client.post(LIST_URL, {}, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {"company", "position", "start_date"}


@pytest.mark.parametrize(
    ("field", "value"),
    [("employment_type", "volunteer"), ("company_url", "not a url")],
)
def test_create_with_invalid_value_is_a_bad_request(staff_api_client, field, value):
    """The employment type must be a known choice and the URL a URL."""
    response = staff_api_client.post(
        LIST_URL,
        {
            "company": "Acme",
            "position": "Developer",
            "start_date": "2024-01-01",
            field: value,
        },
        format="json",
    )

    assert response.status_code == 400
    assert list(response.json()) == [field]


def test_partial_update_changes_only_sent_fields(staff_api_client):
    """PATCH is how the admin hides an entry or changes a single field."""
    experience = make_experience(position="Developer")

    response = staff_api_client.patch(
        detail_url(BASENAME, experience.id),
        {"is_visible": False, "employment_type": "freelance"},
        format="json",
    )

    assert response.status_code == 200
    experience.refresh_from_db()
    assert experience.is_visible is False
    assert experience.employment_type == "freelance"
    assert experience.position == "Developer"


def test_update_replaces_the_entry(staff_api_client):
    """PUT sets every field it is sent."""
    experience = make_experience()

    response = staff_api_client.put(
        detail_url(BASENAME, experience.id),
        {"company": "Globex", "position": "Lead", "start_date": "2019-03-01"},
        format="json",
    )

    assert response.status_code == 200
    experience.refresh_from_db()
    assert (experience.company, experience.position) == ("Globex", "Lead")
    assert experience.start_date == date(2019, 3, 1)


def test_delete_also_deletes_its_projects(staff_api_client):
    """Projects belong to their experience, so they go with it; side projects stay."""
    experience = make_experience()
    Project.objects.create(
        experience=experience, title="Billing", start_date=date(2021, 1, 1)
    )
    side = Project.objects.create(title="Portfolio", start_date=date(2021, 1, 1))

    response = staff_api_client.delete(detail_url(BASENAME, experience.id))

    assert response.status_code == 204
    assert not ProfessionalExperience.objects.exists()
    assert list(Project.objects.all()) == [side]


def test_detail_of_missing_entry_is_not_found(staff_api_client):
    """An unknown id answers 404."""
    response = staff_api_client.get(detail_url(BASENAME, 999))

    assert response.status_code == 404
