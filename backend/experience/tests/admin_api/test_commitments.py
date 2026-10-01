"""Tests for the admin commitment endpoints.

Routes: ``commitments/`` (list, create) and ``commitments/{id}/`` (retrieve,
update, partial update, delete) under ``/api/v1/admin/``. Unlike the public
API, hidden commitments are listed and the internal fields are returned and
writable (except the timestamps). Translated fields are read and written in
every language: ``{"en": ..., "fr": ...}``. Date order is covered in
``test_dates.py``.
"""

from datetime import date

import pytest

from experience.models import Commitment
from experience.tests.admin_api.helpers import (
    detail_url,
    list_url,
    listed_ids,
    timestamps,
)

pytestmark = pytest.mark.django_db

LIST_URL = list_url("commitment")

REQUIRED = {
    "organization": "Red Cross",
    "role": {"en": "Volunteer", "fr": "Bénévole"},
    "start_date": "2024-01-01",
}


def make_commitment(**kwargs):
    """Create a commitment; only pass the fields the test cares about."""
    fields = {
        "organization": "Red Cross",
        "role_en": "Volunteer",
        "role_fr": "Bénévole",
        "start_date": date(2020, 1, 1),
    }
    fields.update(kwargs)
    return Commitment.objects.create(**fields)


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert LIST_URL == "/api/v1/admin/commitments/"
    assert detail_url("commitment", 1) == "/api/v1/admin/commitments/1/"


def test_list_includes_hidden_commitments_in_display_order(staff_api_client):
    """The admin sees everything, in the same order as the public site."""
    hidden = make_commitment(is_visible=False, display_order=0)
    old = make_commitment(start_date=date(2010, 1, 1), display_order=1)
    new = make_commitment(start_date=date(2015, 1, 1), display_order=1)

    response = staff_api_client.get(LIST_URL)

    assert response.status_code == 200
    assert listed_ids(response) == [hidden.id, new.id, old.id]


def test_detail_returns_every_field(staff_api_client):
    """The detail includes the internal fields the public API hides."""
    commitment = make_commitment(
        kind="other_event",
        organization="Hackathon",
        role_en="Mentor",
        role_fr="Mentor",
        location_en="Paris",
        location_fr="Paris",
        url="https://hackathon.example",
        end_date=date(2021, 6, 30),
        description_en="Coached teams.",
        description_fr="Accompagnement des équipes.",
        display_order=3,
        is_visible=False,
    )

    response = staff_api_client.get(detail_url("commitment", commitment.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": commitment.id,
        "kind": "other_event",
        "organization": "Hackathon",
        "role": {"en": "Mentor", "fr": "Mentor"},
        "location": {"en": "Paris", "fr": "Paris"},
        "url": "https://hackathon.example",
        "start_date": "2020-01-01",
        "end_date": "2021-06-30",
        "is_current": False,
        "description": {"en": "Coached teams.", "fr": "Accompagnement des équipes."},
        "display_order": 3,
        "is_visible": False,
        **timestamps(commitment),
    }


def test_create_with_required_fields_only(staff_api_client):
    """Optional fields default like in the model: an association, visible, ongoing."""
    response = staff_api_client.post(LIST_URL, REQUIRED, format="json")

    assert response.status_code == 201
    commitment = Commitment.objects.get()
    assert response.json() == {
        "id": commitment.id,
        "kind": "association",
        "organization": "Red Cross",
        "role": {"en": "Volunteer", "fr": "Bénévole"},
        "location": {"en": "", "fr": ""},
        "url": "",
        "start_date": "2024-01-01",
        "end_date": None,
        "is_current": True,
        "description": {"en": "", "fr": ""},
        "display_order": 0,
        "is_visible": True,
        **timestamps(commitment),
    }


@pytest.mark.parametrize(("field", "value"), [("kind", "nope"), ("url", "not a url")])
def test_create_with_invalid_value_is_a_bad_request(staff_api_client, field, value):
    """The kind must be a known choice and the URL a URL."""
    response = staff_api_client.post(
        LIST_URL, {**REQUIRED, field: value}, format="json"
    )

    assert response.status_code == 400
    assert list(response.json()) == [field]


def test_create_without_required_fields_is_a_bad_request(staff_api_client):
    """Each missing required field is reported."""
    response = staff_api_client.post(LIST_URL, {}, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {"organization", "role", "start_date"}


def test_create_refuses_a_role_missing_a_language(staff_api_client):
    """Every language must be filled in; the error names the missing one."""
    response = staff_api_client.post(
        LIST_URL, {**REQUIRED, "role": {"en": "Volunteer", "fr": ""}}, format="json"
    )

    assert response.status_code == 400
    assert response.json() == {"role": {"fr": ["This field may not be blank."]}}


def test_create_refuses_a_location_filled_in_one_language(staff_api_client):
    """An optional text is filled in every language or left empty in all."""
    response = staff_api_client.post(
        LIST_URL, {**REQUIRED, "location": {"en": "Lyon", "fr": ""}}, format="json"
    )

    assert response.status_code == 400
    assert response.json() == {
        "location": {"fr": ["Fill in every language, or leave them all empty."]}
    }


def test_read_only_fields_are_ignored_on_write(staff_api_client):
    """id, is_current and the timestamps cannot be forced by the client."""
    response = staff_api_client.post(
        LIST_URL,
        {
            **REQUIRED,
            "id": 999,
            "end_date": "2025-06-30",
            "is_current": True,
            "created_at": "2000-01-01T00:00:00Z",
        },
        format="json",
    )

    commitment = Commitment.objects.get()
    assert commitment.id != 999
    assert commitment.created_at.year != 2000
    assert response.json()["is_current"] is False


def test_update_requires_required_fields(staff_api_client):
    """PUT is a full update: the required fields must all be sent."""
    commitment = make_commitment()

    response = staff_api_client.put(
        detail_url("commitment", commitment.id),
        {"organization": "Red Cross", "start_date": "2024-01-01"},
        format="json",
    )

    assert response.status_code == 400
    assert set(response.json()) == {"role"}


def test_update_sets_sent_fields_and_keeps_omitted_optional_ones(staff_api_client):
    """PUT sets what is sent; an omitted optional field keeps its stored value."""
    commitment = make_commitment(location_en="Lyon", location_fr="Lyon")

    response = staff_api_client.put(
        detail_url("commitment", commitment.id),
        {**REQUIRED, "organization": "Croix-Rouge", "kind": "other_event"},
        format="json",
    )

    assert response.status_code == 200
    commitment.refresh_from_db()
    assert commitment.organization == "Croix-Rouge"
    assert commitment.kind == "other_event"
    assert (commitment.location_en, commitment.location_fr) == ("Lyon", "Lyon")


def test_partial_update_changes_only_sent_fields(staff_api_client):
    """PATCH is how the admin hides a commitment or moves it in the list."""
    commitment = make_commitment()

    response = staff_api_client.patch(
        detail_url("commitment", commitment.id),
        {"is_visible": False, "display_order": 5},
        format="json",
    )

    assert response.status_code == 200
    commitment.refresh_from_db()
    assert (commitment.is_visible, commitment.display_order) == (False, 5)
    assert commitment.organization == "Red Cross"


def test_partial_update_of_a_translated_field(staff_api_client):
    """PATCH on a translated field sets every language at once."""
    commitment = make_commitment()

    response = staff_api_client.patch(
        detail_url("commitment", commitment.id),
        {"role": {"en": "Treasurer", "fr": "Trésorier"}},
        format="json",
    )

    assert response.status_code == 200
    commitment.refresh_from_db()
    assert (commitment.role_en, commitment.role_fr) == ("Treasurer", "Trésorier")
    assert commitment.organization == "Red Cross"


def test_delete_removes_the_commitment(staff_api_client):
    """DELETE answers 204 and the commitment is gone."""
    commitment = make_commitment()

    response = staff_api_client.delete(detail_url("commitment", commitment.id))

    assert response.status_code == 204
    assert not Commitment.objects.exists()
