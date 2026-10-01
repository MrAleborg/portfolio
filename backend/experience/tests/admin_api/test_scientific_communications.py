"""Tests for the admin scientific communication endpoints.

Routes: ``scientific-communications/`` (list, create) and
``scientific-communications/{id}/`` (retrieve, update, partial update, delete)
under ``/api/v1/admin/``. Unlike the public API, hidden communications are
listed and the internal fields are returned and writable (except the
timestamps). The title is read and written in every language:
``{"en": ..., "fr": ...}``.
"""

from datetime import date

import pytest

from experience.models import ScientificCommunication
from experience.tests.admin_api.helpers import (
    detail_url,
    list_url,
    listed_ids,
    timestamps,
)

pytestmark = pytest.mark.django_db

LIST_URL = list_url("scientific-communication")

REQUIRED = {
    "title": {"en": "Static analysis", "fr": "Analyse statique"},
    "authors": "A. Lovelace",
    "kind": "talk",
    "venue": "PyCon",
    "date": "2024-05-01",
}


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
    assert LIST_URL == "/api/v1/admin/scientific-communications/"
    assert (
        detail_url("scientific-communication", 1)
        == "/api/v1/admin/scientific-communications/1/"
    )


def test_list_includes_hidden_communications_in_display_order(staff_api_client):
    """The admin sees everything, in the same order as the public site."""
    hidden = make_communication(is_visible=False, display_order=0)
    old = make_communication(date=date(2010, 1, 1), display_order=1)
    new = make_communication(date=date(2015, 1, 1), display_order=1)

    response = staff_api_client.get(LIST_URL)

    assert response.status_code == 200
    assert listed_ids(response) == [hidden.id, new.id, old.id]


def test_detail_returns_every_field(staff_api_client):
    """The detail includes the internal fields the public API hides."""
    communication = make_communication(
        kind="poster",
        title_en="Type inference at scale",
        title_fr="Inférence de types à grande échelle",
        authors="A. Lovelace, C. Babbage",
        venue="ICSE 2024",
        date=date(2024, 4, 20),
        url="https://example.org/poster",
        description_en="Shown in room B.",
        description_fr="Présentée en salle B.",
        display_order=3,
        is_visible=False,
    )

    response = staff_api_client.get(
        detail_url("scientific-communication", communication.id)
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": communication.id,
        "kind": "poster",
        "title": {
            "en": "Type inference at scale",
            "fr": "Inférence de types à grande échelle",
        },
        "authors": "A. Lovelace, C. Babbage",
        "venue": "ICSE 2024",
        "date": "2024-04-20",
        "url": "https://example.org/poster",
        "description": {"en": "Shown in room B.", "fr": "Présentée en salle B."},
        "display_order": 3,
        "is_visible": False,
        **timestamps(communication),
    }


def test_create_with_required_fields_only(staff_api_client):
    """Optional fields default like in the model: no URL or description, visible."""
    response = staff_api_client.post(LIST_URL, REQUIRED, format="json")

    assert response.status_code == 201
    communication = ScientificCommunication.objects.get()
    assert response.json() == {
        "id": communication.id,
        "kind": "talk",
        "title": {"en": "Static analysis", "fr": "Analyse statique"},
        "authors": "A. Lovelace",
        "venue": "PyCon",
        "date": "2024-05-01",
        "url": "",
        "description": {"en": "", "fr": ""},
        "display_order": 0,
        "is_visible": True,
        **timestamps(communication),
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
    """Each missing required field is reported, the kind included (no default)."""
    response = staff_api_client.post(LIST_URL, {}, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {"title", "authors", "kind", "venue", "date"}


def test_create_refuses_a_title_missing_a_language(staff_api_client):
    """Every language must be filled in; the error names the missing one."""
    response = staff_api_client.post(
        LIST_URL,
        {**REQUIRED, "title": {"en": "Static analysis", "fr": ""}},
        format="json",
    )

    assert response.status_code == 400
    assert response.json() == {"title": {"fr": ["This field may not be blank."]}}


def test_create_refuses_a_description_filled_in_one_language(staff_api_client):
    """An optional text is filled in every language or left empty in all."""
    response = staff_api_client.post(
        LIST_URL,
        {**REQUIRED, "description": {"en": "Shown in room B.", "fr": ""}},
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
        {**REQUIRED, "id": 999, "created_at": "2000-01-01T00:00:00Z"},
        format="json",
    )

    communication = ScientificCommunication.objects.get()
    assert communication.id != 999
    assert communication.created_at.year != 2000


def test_update_requires_required_fields(staff_api_client):
    """PUT is a full update: the required fields must all be sent."""
    communication = make_communication()

    response = staff_api_client.put(
        detail_url("scientific-communication", communication.id),
        {
            "authors": "A. Lovelace",
            "kind": "talk",
            "venue": "PyCon",
            "date": "2024-05-01",
        },
        format="json",
    )

    assert response.status_code == 400
    assert set(response.json()) == {"title"}


def test_update_sets_sent_fields_and_keeps_omitted_optional_ones(staff_api_client):
    """PUT sets what is sent; an omitted optional field keeps its stored value."""
    communication = make_communication(url="https://example.org/talk")

    response = staff_api_client.put(
        detail_url("scientific-communication", communication.id),
        {**REQUIRED, "venue": "EuroPython", "kind": "poster"},
        format="json",
    )

    assert response.status_code == 200
    communication.refresh_from_db()
    assert communication.venue == "EuroPython"
    assert communication.kind == "poster"
    assert communication.url == "https://example.org/talk"


def test_partial_update_changes_only_sent_fields(staff_api_client):
    """PATCH is how the admin hides a communication or moves it in the list."""
    communication = make_communication()

    response = staff_api_client.patch(
        detail_url("scientific-communication", communication.id),
        {"is_visible": False, "display_order": 5},
        format="json",
    )

    assert response.status_code == 200
    communication.refresh_from_db()
    assert (communication.is_visible, communication.display_order) == (False, 5)
    assert communication.venue == "PyCon"


def test_partial_update_of_a_translated_field(staff_api_client):
    """PATCH on a translated field sets every language at once."""
    communication = make_communication()

    response = staff_api_client.patch(
        detail_url("scientific-communication", communication.id),
        {"title": {"en": "Dataflow analysis", "fr": "Analyse de flot de données"}},
        format="json",
    )

    assert response.status_code == 200
    communication.refresh_from_db()
    assert (communication.title_en, communication.title_fr) == (
        "Dataflow analysis",
        "Analyse de flot de données",
    )
    assert communication.venue == "PyCon"


def test_delete_removes_the_communication(staff_api_client):
    """DELETE answers 204 and the communication is gone."""
    communication = make_communication()

    response = staff_api_client.delete(
        detail_url("scientific-communication", communication.id)
    )

    assert response.status_code == 204
    assert not ScientificCommunication.objects.exists()
