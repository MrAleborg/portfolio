"""Tests for the read-only commitment endpoints.

Routes: ``commitments/`` (list) and ``commitments/{id}/`` (detail) under
``/api/v1/experience/``. Only visible commitments are exposed, ordered by
``display_order`` then newest ``start_date``, and write methods are rejected.
Translated fields are returned in every language: ``{"en": ..., "fr": ...}``.
"""

from datetime import date

import pytest
from django.urls import reverse

from experience.models import Commitment

pytestmark = pytest.mark.django_db

LIST_URL = reverse("experience:commitment-list")


def detail_url(pk):
    return reverse("experience:commitment-detail", args=[pk])


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
    assert LIST_URL == "/api/v1/experience/commitments/"
    assert detail_url(1) == "/api/v1/experience/commitments/1/"


def test_list_hides_invisible_commitments(api_client):
    """Commitments with is_visible=False are not listed."""
    visible = make_commitment()
    make_commitment(is_visible=False)

    response = api_client.get(LIST_URL)

    assert [entry["id"] for entry in response.json()] == [visible.id]


def test_list_is_ordered_by_display_order_then_newest_start_date(api_client):
    """display_order wins over dates; ties are broken by newest start_date."""
    old = make_commitment(start_date=date(2015, 1, 1), display_order=1)
    new = make_commitment(start_date=date(2020, 1, 1), display_order=1)
    pinned = make_commitment(start_date=date(2010, 1, 1), display_order=0)

    response = api_client.get(LIST_URL)

    assert [entry["id"] for entry in response.json()] == [pinned.id, new.id, old.id]


def test_detail_returns_public_fields(api_client):
    """The detail exposes public fields, nothing internal.

    is_visible, display_order, created_at and updated_at must not leak.
    """
    commitment = make_commitment(
        kind="conference_organization",
        organization="PyCon FR",
        role_en="Organizer",
        role_fr="Organisateur",
        location_en="Lyon",
        location_fr="Lyon",
        url="https://pycon.fr",
        start_date=date(2022, 1, 1),
        end_date=date(2023, 10, 31),
        description_en="Ran the speaker program.",
        description_fr="Responsable du programme des conférences.",
    )

    response = api_client.get(detail_url(commitment.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": commitment.id,
        "kind": "conference_organization",
        "organization": "PyCon FR",
        "role": {"en": "Organizer", "fr": "Organisateur"},
        "location": {"en": "Lyon", "fr": "Lyon"},
        "url": "https://pycon.fr",
        "start_date": "2022-01-01",
        "end_date": "2023-10-31",
        "is_current": False,
        "description": {
            "en": "Ran the speaker program.",
            "fr": "Responsable du programme des conférences.",
        },
    }


def test_detail_marks_ongoing_entry_as_current(api_client):
    """A null end_date means the entry is ongoing."""
    commitment = make_commitment(end_date=None)

    response = api_client.get(detail_url(commitment.id))

    assert response.json()["is_current"] is True


def test_list_items_have_the_detail_shape(api_client):
    """List and detail share one shape, so the frontend needs a single type."""
    commitment = make_commitment()

    listed = api_client.get(LIST_URL).json()[0]
    detailed = api_client.get(detail_url(commitment.id)).json()

    assert listed == detailed


def test_detail_of_invisible_commitment_is_not_found(api_client):
    """A hidden commitment cannot be reached by guessing its id."""
    commitment = make_commitment(is_visible=False)

    response = api_client.get(detail_url(commitment.id))

    assert response.status_code == 404


def test_detail_of_missing_commitment_is_not_found(api_client):
    """An unknown id answers 404."""
    response = api_client.get(detail_url(999))

    assert response.status_code == 404


def test_list_is_read_only(api_client):
    """Commitments are managed in the admin, so the API refuses creation."""
    response = api_client.post(LIST_URL, {"organization": "X"})

    assert response.status_code == 405


@pytest.mark.parametrize("method", ["put", "patch", "delete"])
def test_detail_is_read_only(api_client, method):
    """Commitments are managed in the admin, so the API refuses changes."""
    commitment = make_commitment()

    response = getattr(api_client, method)(detail_url(commitment.id))

    assert response.status_code == 405
