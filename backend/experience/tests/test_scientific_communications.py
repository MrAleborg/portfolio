"""Tests for the read-only scientific communication endpoints.

Routes: ``scientific-communications/`` (list) and
``scientific-communications/{id}/`` (detail) under ``/api/v1/experience/``.
Only visible communications are exposed, ordered by ``display_order`` then
newest ``date``, and write methods are rejected. The title is returned in every
language: ``{"en": ..., "fr": ...}``.
"""

from datetime import date

import pytest
from django.urls import reverse

from experience.models import ScientificCommunication

pytestmark = pytest.mark.django_db

LIST_URL = reverse("experience:scientific-communication-list")


def detail_url(pk):
    return reverse("experience:scientific-communication-detail", args=[pk])


def make_communication(**kwargs):
    """Create a communication; only pass the fields the test cares about."""
    fields = {
        "title_en": "Static analysis",
        "title_fr": "Analyse statique",
        "authors": "A. Lovelace",
        "kind": "talk",
        "venue": "PyCon",
        "date": date(2024, 5, 1),
    }
    fields.update(kwargs)
    return ScientificCommunication.objects.create(**fields)


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert LIST_URL == "/api/v1/experience/scientific-communications/"
    assert detail_url(1) == "/api/v1/experience/scientific-communications/1/"


def test_list_hides_invisible_communications(api_client):
    """Communications with is_visible=False are not listed."""
    visible = make_communication()
    make_communication(is_visible=False)

    response = api_client.get(LIST_URL)

    assert [entry["id"] for entry in response.json()] == [visible.id]


def test_list_is_ordered_by_display_order_then_newest_date(api_client):
    """display_order wins over dates; ties are broken by newest date."""
    old = make_communication(date=date(2015, 1, 1), display_order=1)
    new = make_communication(date=date(2020, 1, 1), display_order=1)
    pinned = make_communication(date=date(2010, 1, 1), display_order=0)

    response = api_client.get(LIST_URL)

    assert [entry["id"] for entry in response.json()] == [pinned.id, new.id, old.id]


def test_detail_returns_public_fields(api_client):
    """The detail exposes public fields, nothing internal.

    is_visible, display_order, created_at and updated_at must not leak.
    """
    communication = make_communication(
        kind="paper",
        title_en="Type inference at scale",
        title_fr="Inférence de types à grande échelle",
        authors="A. Lovelace, C. Babbage",
        venue="ICSE 2024",
        date=date(2024, 4, 20),
        url="https://example.org/paper",
        description_en="Private note.",
        description_fr="Note privée.",
        display_order=2,
    )

    response = api_client.get(detail_url(communication.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": communication.id,
        "kind": "paper",
        "title": {
            "en": "Type inference at scale",
            "fr": "Inférence de types à grande échelle",
        },
        "authors": "A. Lovelace, C. Babbage",
        "venue": "ICSE 2024",
        "date": "2024-04-20",
        "url": "https://example.org/paper",
    }


def test_list_items_have_the_detail_shape(api_client):
    """List and detail share one shape, so the frontend needs a single type."""
    communication = make_communication()

    listed = api_client.get(LIST_URL).json()[0]
    detailed = api_client.get(detail_url(communication.id)).json()

    assert listed == detailed


def test_detail_of_invisible_communication_is_not_found(api_client):
    """A hidden communication cannot be reached by guessing its id."""
    communication = make_communication(is_visible=False)

    response = api_client.get(detail_url(communication.id))

    assert response.status_code == 404


def test_detail_of_missing_communication_is_not_found(api_client):
    """An unknown id answers 404."""
    response = api_client.get(detail_url(999))

    assert response.status_code == 404


def test_list_is_read_only(api_client):
    """Communications are managed in the admin, so the API refuses creation."""
    response = api_client.post(LIST_URL, {"venue": "X"})

    assert response.status_code == 405


@pytest.mark.parametrize("method", ["put", "patch", "delete"])
def test_detail_is_read_only(api_client, method):
    """Communications are managed in the admin, so the API refuses changes."""
    communication = make_communication()

    response = getattr(api_client, method)(detail_url(communication.id))

    assert response.status_code == 405
