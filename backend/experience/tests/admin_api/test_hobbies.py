"""Tests for the admin hobby endpoints.

Routes: ``hobbies/`` (list, create) and ``hobbies/{id}/`` (retrieve, update,
partial update, delete) under ``/api/v1/admin/``. Unlike the public API,
hidden hobbies are listed and the internal fields are returned and writable
(except the timestamps). Translated fields are read and written in every
language: ``{"en": ..., "fr": ...}``.
"""

import pytest

from experience.models import Hobby
from experience.tests.admin_api.helpers import (
    detail_url,
    list_url,
    listed_ids,
    timestamps,
)

pytestmark = pytest.mark.django_db

LIST_URL = list_url("hobby")


def make_hobby(**kwargs):
    """Create a hobby; only pass the fields the test cares about."""
    fields = {"name_en": "Climbing", "name_fr": "Escalade"}
    fields.update(kwargs)
    return Hobby.objects.create(**fields)


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert LIST_URL == "/api/v1/admin/hobbies/"
    assert detail_url("hobby", 1) == "/api/v1/admin/hobbies/1/"


def test_list_includes_hidden_hobbies_in_display_order(staff_api_client):
    """The admin sees everything, in the same order as the public site."""
    hidden = make_hobby(name_en="Zen", name_fr="Zen", is_visible=False, display_order=0)
    chess = make_hobby(name_en="Chess", name_fr="Échecs", display_order=1)
    biking = make_hobby(name_en="Biking", name_fr="Vélo", display_order=1)

    response = staff_api_client.get(LIST_URL)

    assert response.status_code == 200
    assert listed_ids(response) == [hidden.id, biking.id, chess.id]


def test_detail_returns_every_field(staff_api_client):
    """The detail includes the internal fields the public API hides."""
    hobby = make_hobby(
        description_en="Bouldering on weekends.",
        description_fr="Du bloc le week-end.",
        display_order=3,
        is_visible=False,
    )

    response = staff_api_client.get(detail_url("hobby", hobby.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": hobby.id,
        "name": {"en": "Climbing", "fr": "Escalade"},
        "description": {
            "en": "Bouldering on weekends.",
            "fr": "Du bloc le week-end.",
        },
        "display_order": 3,
        "is_visible": False,
        **timestamps(hobby),
    }


def test_create_with_required_fields_only(staff_api_client):
    """Optional fields default like in the model: visible, empty description."""
    response = staff_api_client.post(
        LIST_URL, {"name": {"en": "Climbing", "fr": "Escalade"}}, format="json"
    )

    assert response.status_code == 201
    hobby = Hobby.objects.get()
    assert response.json() == {
        "id": hobby.id,
        "name": {"en": "Climbing", "fr": "Escalade"},
        "description": {"en": "", "fr": ""},
        "display_order": 0,
        "is_visible": True,
        **timestamps(hobby),
    }


def test_create_without_a_name_is_a_bad_request(staff_api_client):
    """The missing required field is reported."""
    response = staff_api_client.post(LIST_URL, {}, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {"name"}


def test_create_refuses_a_name_missing_a_language(staff_api_client):
    """Every language must be filled in; the error names the missing one."""
    response = staff_api_client.post(
        LIST_URL, {"name": {"en": "Climbing", "fr": ""}}, format="json"
    )

    assert response.status_code == 400
    assert response.json() == {"name": {"fr": ["This field may not be blank."]}}


def test_create_refuses_a_description_filled_in_one_language(staff_api_client):
    """An optional text is filled in every language or left empty in all."""
    response = staff_api_client.post(
        LIST_URL,
        {
            "name": {"en": "Climbing", "fr": "Escalade"},
            "description": {"en": "Bouldering", "fr": ""},
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.json() == {
        "description": {"fr": ["Fill in every language, or leave them all empty."]}
    }


def test_read_only_fields_are_ignored_on_write(staff_api_client):
    """id and the timestamps cannot be forced by the client."""
    staff_api_client.post(
        LIST_URL,
        {
            "id": 999,
            "name": {"en": "Climbing", "fr": "Escalade"},
            "created_at": "2000-01-01T00:00:00Z",
        },
        format="json",
    )

    hobby = Hobby.objects.get()
    assert hobby.id != 999
    assert hobby.created_at.year != 2000


def test_update_requires_the_name(staff_api_client):
    """PUT is a full update: the required fields must all be sent."""
    hobby = make_hobby()

    response = staff_api_client.put(detail_url("hobby", hobby.id), {}, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {"name"}


def test_update_sets_sent_fields_and_keeps_omitted_optional_ones(staff_api_client):
    """PUT sets what is sent; an omitted optional field keeps its stored value."""
    hobby = make_hobby(
        description_en="Bouldering", description_fr="Du bloc", is_visible=False
    )

    response = staff_api_client.put(
        detail_url("hobby", hobby.id),
        {"name": {"en": "Chess", "fr": "Échecs"}},
        format="json",
    )

    assert response.status_code == 200
    hobby.refresh_from_db()
    assert (hobby.name_en, hobby.name_fr) == ("Chess", "Échecs")
    assert (hobby.description_en, hobby.description_fr) == ("Bouldering", "Du bloc")
    assert hobby.is_visible is False


def test_partial_update_changes_only_sent_fields(staff_api_client):
    """PATCH is how the admin hides a hobby or moves it in the list."""
    hobby = make_hobby()

    response = staff_api_client.patch(
        detail_url("hobby", hobby.id),
        {"is_visible": False, "display_order": 5},
        format="json",
    )

    assert response.status_code == 200
    hobby.refresh_from_db()
    assert hobby.is_visible is False
    assert hobby.display_order == 5
    assert (hobby.name_en, hobby.name_fr) == ("Climbing", "Escalade")


def test_partial_update_of_a_translated_field(staff_api_client):
    """PATCH on a translated field sets every language at once."""
    hobby = make_hobby()

    response = staff_api_client.patch(
        detail_url("hobby", hobby.id),
        {"description": {"en": "Bouldering", "fr": "Du bloc"}},
        format="json",
    )

    assert response.status_code == 200
    hobby.refresh_from_db()
    assert (hobby.description_en, hobby.description_fr) == ("Bouldering", "Du bloc")
    assert (hobby.name_en, hobby.name_fr) == ("Climbing", "Escalade")


def test_hidden_hobby_can_be_edited(staff_api_client):
    """Hidden hobbies stay reachable in the admin API, unlike the public one."""
    hobby = make_hobby(is_visible=False)

    response = staff_api_client.patch(
        detail_url("hobby", hobby.id), {"is_visible": True}, format="json"
    )

    assert response.status_code == 200


def test_delete_removes_the_hobby(staff_api_client):
    """DELETE answers 204 and the hobby is gone."""
    hobby = make_hobby()

    response = staff_api_client.delete(detail_url("hobby", hobby.id))

    assert response.status_code == 204
    assert not Hobby.objects.exists()


def test_detail_of_missing_hobby_is_not_found(staff_api_client):
    """An unknown id answers 404."""
    response = staff_api_client.get(detail_url("hobby", 999))

    assert response.status_code == 404
