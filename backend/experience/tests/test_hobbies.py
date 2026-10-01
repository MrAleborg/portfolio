"""Tests for the read-only hobby endpoints.

Routes: ``hobbies/`` (list) and ``hobbies/{id}/`` (detail) under
``/api/v1/experience/``. Only visible hobbies are exposed, ordered by
``display_order`` then ``name_en``, and write methods are rejected.
Translated fields are returned in every language: ``{"en": ..., "fr": ...}``.
"""

import pytest
from django.urls import reverse

from experience.models import Hobby

pytestmark = pytest.mark.django_db

LIST_URL = reverse("experience:hobby-list")


def detail_url(pk):
    return reverse("experience:hobby-detail", args=[pk])


def make_hobby(**kwargs):
    """Create a hobby; only pass the fields the test cares about."""
    fields = {"name_en": "Climbing", "name_fr": "Escalade"}
    fields.update(kwargs)
    return Hobby.objects.create(**fields)


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert LIST_URL == "/api/v1/experience/hobbies/"
    assert detail_url(1) == "/api/v1/experience/hobbies/1/"


def test_list_is_empty_without_hobbies(api_client):
    """The list answers with a plain JSON list, without pagination envelope."""
    response = api_client.get(LIST_URL)

    assert response.status_code == 200
    assert response.json() == []


def test_list_hides_invisible_hobbies(api_client):
    """Hobbies with is_visible=False are not listed."""
    visible = make_hobby()
    make_hobby(name_en="Secret", name_fr="Secret", is_visible=False)

    response = api_client.get(LIST_URL)

    assert [entry["id"] for entry in response.json()] == [visible.id]


def test_list_is_ordered_by_display_order_then_name(api_client):
    """display_order wins over names; ties are broken by English name."""
    chess = make_hobby(name_en="Chess", name_fr="Échecs", display_order=1)
    biking = make_hobby(name_en="Biking", name_fr="Vélo", display_order=1)
    pinned = make_hobby(name_en="Zen", name_fr="Zen", display_order=0)

    response = api_client.get(LIST_URL)

    assert [entry["id"] for entry in response.json()] == [
        pinned.id,
        biking.id,
        chess.id,
    ]


def test_detail_returns_public_fields(api_client):
    """The detail exposes public fields, nothing internal.

    is_visible, display_order, created_at and updated_at must not leak.
    """
    hobby = make_hobby(
        description_en="Bouldering on weekends.",
        description_fr="Du bloc le week-end.",
    )

    response = api_client.get(detail_url(hobby.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": hobby.id,
        "name": {"en": "Climbing", "fr": "Escalade"},
        "description": {
            "en": "Bouldering on weekends.",
            "fr": "Du bloc le week-end.",
        },
    }


def test_detail_returns_empty_descriptions_in_every_language(api_client):
    """An optional description left empty is still returned in each language."""
    hobby = make_hobby()

    response = api_client.get(detail_url(hobby.id))

    assert response.json()["description"] == {"en": "", "fr": ""}


def test_list_items_have_the_detail_shape(api_client):
    """List and detail share one shape, so the frontend needs a single type."""
    hobby = make_hobby()

    listed = api_client.get(LIST_URL).json()[0]
    detailed = api_client.get(detail_url(hobby.id)).json()

    assert listed == detailed


def test_detail_of_invisible_hobby_is_not_found(api_client):
    """A hidden hobby cannot be reached by guessing its id."""
    hobby = make_hobby(is_visible=False)

    response = api_client.get(detail_url(hobby.id))

    assert response.status_code == 404


def test_detail_of_missing_hobby_is_not_found(api_client):
    """An unknown id answers 404."""
    response = api_client.get(detail_url(999))

    assert response.status_code == 404


def test_list_is_read_only(api_client):
    """Hobbies are managed in the admin, so the API refuses creation."""
    response = api_client.post(LIST_URL, {"name_en": "X"})

    assert response.status_code == 405


@pytest.mark.parametrize("method", ["put", "patch", "delete"])
def test_detail_is_read_only(api_client, method):
    """Hobbies are managed in the admin, so the API refuses changes."""
    hobby = make_hobby()

    response = getattr(api_client, method)(detail_url(hobby.id))

    assert response.status_code == 405
