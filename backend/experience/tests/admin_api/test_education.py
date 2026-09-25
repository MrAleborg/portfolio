"""Tests for the admin education endpoints.

Routes: ``education/`` (list, create) and ``education/{id}/`` (retrieve,
update, partial update, delete) under ``/api/v1/admin/``. Unlike the public
API, hidden entries are listed and the internal fields are returned and
writable (except the timestamps).
"""

from datetime import date

import pytest

from experience.models import Education
from experience.tests.admin_api.helpers import (
    detail_url,
    list_url,
    listed_ids,
    timestamps,
)

pytestmark = pytest.mark.django_db

LIST_URL = list_url("education")


def make_education(**kwargs):
    """Create an education entry; only pass the fields the test cares about."""
    fields = {
        "institution": "University",
        "degree": "MSc",
        "start_date": date(2020, 9, 1),
    }
    fields.update(kwargs)
    return Education.objects.create(**fields)


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert LIST_URL == "/api/v1/admin/education/"
    assert detail_url("education", 1) == "/api/v1/admin/education/1/"


def test_list_includes_hidden_entries_in_display_order(staff_api_client):
    """The admin sees everything, in the same order as the public site."""
    hidden = make_education(is_visible=False, display_order=0)
    old = make_education(start_date=date(2010, 9, 1), display_order=1)
    new = make_education(start_date=date(2015, 9, 1), display_order=1)

    response = staff_api_client.get(LIST_URL)

    assert response.status_code == 200
    assert listed_ids(response) == [hidden.id, new.id, old.id]


def test_detail_returns_every_field(staff_api_client):
    """The detail includes the internal fields the public API hides."""
    education = make_education(
        institution="Université de Rennes",
        degree="Master",
        field_of_study="Computer Science",
        grade="Distinction",
        location="Rennes",
        start_date=date(2015, 9, 1),
        end_date=date(2017, 6, 30),
        description="Thesis on compilers.",
        display_order=3,
        is_visible=False,
    )

    response = staff_api_client.get(detail_url("education", education.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": education.id,
        "institution": "Université de Rennes",
        "degree": "Master",
        "field_of_study": "Computer Science",
        "grade": "Distinction",
        "location": "Rennes",
        "start_date": "2015-09-01",
        "end_date": "2017-06-30",
        "is_current": False,
        "description": "Thesis on compilers.",
        "display_order": 3,
        "is_visible": False,
        **timestamps(education),
    }


def test_create_with_required_fields_only(staff_api_client):
    """Optional fields default like in the model: visible, ongoing, empty texts."""
    response = staff_api_client.post(
        LIST_URL,
        {"institution": "University", "degree": "MSc", "start_date": "2024-09-01"},
        format="json",
    )

    assert response.status_code == 201
    education = Education.objects.get()
    assert response.json() == {
        "id": education.id,
        "institution": "University",
        "degree": "MSc",
        "field_of_study": "",
        "grade": "",
        "location": "",
        "start_date": "2024-09-01",
        "end_date": None,
        "is_current": True,
        "description": "",
        "display_order": 0,
        "is_visible": True,
        **timestamps(education),
    }


def test_create_without_required_fields_is_a_bad_request(staff_api_client):
    """Each missing required field is reported."""
    response = staff_api_client.post(LIST_URL, {}, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {"institution", "degree", "start_date"}


def test_read_only_fields_are_ignored_on_write(staff_api_client):
    """id, is_current and the timestamps cannot be forced by the client."""
    response = staff_api_client.post(
        LIST_URL,
        {
            "id": 999,
            "institution": "University",
            "degree": "MSc",
            "start_date": "2024-09-01",
            "end_date": "2025-06-30",
            "is_current": True,
            "created_at": "2000-01-01T00:00:00Z",
        },
        format="json",
    )

    education = Education.objects.get()
    assert education.id != 999
    assert education.created_at.year != 2000
    assert response.json()["is_current"] is False


def test_update_requires_required_fields(staff_api_client):
    """PUT is a full update: the required fields must all be sent."""
    education = make_education()

    response = staff_api_client.put(
        detail_url("education", education.id), {"degree": "BSc"}, format="json"
    )

    assert response.status_code == 400
    assert set(response.json()) == {"institution", "start_date"}


def test_update_sets_sent_fields_and_keeps_omitted_optional_ones(staff_api_client):
    """PUT sets what is sent; an omitted optional field keeps its stored value."""
    education = make_education(grade="Distinction", is_visible=False)

    response = staff_api_client.put(
        detail_url("education", education.id),
        {"institution": "School", "degree": "BSc", "start_date": "2012-09-01"},
        format="json",
    )

    assert response.status_code == 200
    education.refresh_from_db()
    assert education.institution == "School"
    assert education.degree == "BSc"
    assert education.start_date == date(2012, 9, 1)
    assert education.grade == "Distinction"
    assert education.is_visible is False


def test_partial_update_changes_only_sent_fields(staff_api_client):
    """PATCH is how the admin hides an entry or moves it in the list."""
    education = make_education(degree="MSc")

    response = staff_api_client.patch(
        detail_url("education", education.id),
        {"is_visible": False, "display_order": 5},
        format="json",
    )

    assert response.status_code == 200
    education.refresh_from_db()
    assert education.is_visible is False
    assert education.display_order == 5
    assert education.degree == "MSc"


def test_hidden_entry_can_be_edited(staff_api_client):
    """Hidden entries stay reachable in the admin API, unlike the public one."""
    education = make_education(is_visible=False)

    response = staff_api_client.patch(
        detail_url("education", education.id), {"is_visible": True}, format="json"
    )

    assert response.status_code == 200


def test_delete_removes_the_entry(staff_api_client):
    """DELETE answers 204 and the entry is gone."""
    education = make_education()

    response = staff_api_client.delete(detail_url("education", education.id))

    assert response.status_code == 204
    assert not Education.objects.exists()


def test_detail_of_missing_entry_is_not_found(staff_api_client):
    """An unknown id answers 404."""
    response = staff_api_client.get(detail_url("education", 999))

    assert response.status_code == 404
