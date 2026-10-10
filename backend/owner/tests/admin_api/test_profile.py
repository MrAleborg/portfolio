"""Tests for the admin profile endpoint.

Route: ``/api/v1/admin/profile/``, reserved to staff users. There is one
profile, so the route has no id. GET reads it and PATCH changes it; PUT
replaces it, or creates it when it does not exist yet, which is how the first
profile gets in. It cannot be deleted. Translated fields are read and written
in every language: ``{"en": ..., "fr": ...}``.
"""

import pytest
from django.urls import reverse

from experience.tests.admin_api.helpers import timestamps
from owner.models import Profile

pytestmark = pytest.mark.django_db

URL = reverse("owner-admin:profile")

METHODS = ["get", "put", "patch", "delete"]


def make_profile(**kwargs):
    """Create the profile; only pass the fields the test cares about."""
    fields = {
        "full_name": "Ada Lovelace",
        "headline_en": "Analyst",
        "headline_fr": "Analyste",
    }
    fields.update(kwargs)
    return Profile.objects.create(**fields)


def test_route():
    """The URL name resolves to the agreed path."""
    assert URL == "/api/v1/admin/profile/"


@pytest.mark.parametrize("method", METHODS)
def test_anonymous_request_is_unauthorized(api_client, method):
    """Without a token the API asks for credentials (401), whatever the method."""
    make_profile()

    response = getattr(api_client, method)(URL)

    assert response.status_code == 401


@pytest.mark.parametrize("method", METHODS)
def test_request_of_a_user_who_is_not_staff_is_forbidden(user_api_client, method):
    """A valid token is not enough: the user must be staff (403)."""
    make_profile()

    response = getattr(user_api_client, method)(URL)

    assert response.status_code == 403


def test_get_returns_every_field(staff_api_client):
    """The timestamps come on top of the public fields."""
    profile = make_profile(
        full_name="Ada Lovelace",
        headline_en="Analyst",
        headline_fr="Analyste",
        bio_en="I write programs.",
        bio_fr="J’écris des programmes.",
        desired_role_en="Software engineer",
        desired_role_fr="Ingénieure logiciel",
    )

    response = staff_api_client.get(URL)

    assert response.status_code == 200
    assert response.json() == {
        "full_name": "Ada Lovelace",
        "headline": {"en": "Analyst", "fr": "Analyste"},
        "bio": {"en": "I write programs.", "fr": "J’écris des programmes."},
        "desired_role": {"en": "Software engineer", "fr": "Ingénieure logiciel"},
        **timestamps(profile),
    }


def test_get_is_not_found_before_the_profile_is_created(staff_api_client):
    response = staff_api_client.get(URL)

    assert response.status_code == 404


def test_put_creates_the_profile_when_there_is_none(staff_api_client):
    """The bio and the desired role are optional: empty in every language."""
    response = staff_api_client.put(
        URL,
        {
            "full_name": "Ada Lovelace",
            "headline": {"en": "Analyst", "fr": "Analyste"},
        },
        format="json",
    )

    assert response.status_code == 201
    profile = Profile.objects.get()
    assert response.json() == {
        "full_name": "Ada Lovelace",
        "headline": {"en": "Analyst", "fr": "Analyste"},
        "bio": {"en": "", "fr": ""},
        "desired_role": {"en": "", "fr": ""},
        **timestamps(profile),
    }


def test_put_replaces_the_existing_profile(staff_api_client):
    """No second profile: the one row is updated."""
    make_profile()

    response = staff_api_client.put(
        URL,
        {
            "full_name": "Grace Hopper",
            "headline": {"en": "Admiral", "fr": "Amirale"},
            "bio": {"en": "I wrote compilers.", "fr": "J’ai écrit des compilateurs."},
            "desired_role": {"en": "Compiler engineer", "fr": "Ingénieure compilateur"},
        },
        format="json",
    )

    assert response.status_code == 200
    profile = Profile.objects.get()
    assert profile.full_name == "Grace Hopper"
    assert profile.headline_en == "Admiral"
    assert profile.headline_fr == "Amirale"
    assert profile.bio_en == "I wrote compilers."
    assert profile.bio_fr == "J’ai écrit des compilateurs."
    assert profile.desired_role_en == "Compiler engineer"
    assert profile.desired_role_fr == "Ingénieure compilateur"


def test_put_without_desired_role_keeps_the_stored_one(staff_api_client):
    """An omitted optional field is left alone on PUT, as the bio is."""
    make_profile(desired_role_en="Software engineer", desired_role_fr="Ingénieure")

    response = staff_api_client.put(
        URL,
        {
            "full_name": "Ada Lovelace",
            "headline": {"en": "Analyst", "fr": "Analyste"},
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["desired_role"] == {
        "en": "Software engineer",
        "fr": "Ingénieure",
    }


def test_put_without_required_fields_is_a_bad_request(staff_api_client):
    """Each missing required field is reported, and nothing is created."""
    response = staff_api_client.put(URL, {}, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {"full_name", "headline"}
    assert not Profile.objects.exists()


def test_put_refuses_a_headline_missing_a_language(staff_api_client):
    """Every language must be filled in; the error names the missing one."""
    response = staff_api_client.put(
        URL,
        {"full_name": "Ada Lovelace", "headline": {"en": "Analyst", "fr": ""}},
        format="json",
    )

    assert response.status_code == 400
    assert response.json() == {"headline": {"fr": ["This field may not be blank."]}}


def test_put_refuses_a_bio_filled_in_one_language(staff_api_client):
    """The bio is filled in every language or left empty in all."""
    response = staff_api_client.put(
        URL,
        {
            "full_name": "Ada Lovelace",
            "headline": {"en": "Analyst", "fr": "Analyste"},
            "bio": {"en": "I write programs.", "fr": ""},
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.json() == {
        "bio": {"fr": ["Fill in every language, or leave them all empty."]}
    }


@pytest.mark.parametrize("method", ["put", "patch"])
def test_desired_role_filled_in_one_language_is_refused(staff_api_client, method):
    """Like the bio, the desired role is filled in every language or none."""
    make_profile()

    response = getattr(staff_api_client, method)(
        URL,
        {
            "full_name": "Ada Lovelace",
            "headline": {"en": "Analyst", "fr": "Analyste"},
            "desired_role": {"en": "Software engineer", "fr": ""},
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.json() == {
        "desired_role": {"fr": ["Fill in every language, or leave them all empty."]}
    }
    assert Profile.objects.get().desired_role_en == ""


def test_timestamps_are_ignored_on_write(staff_api_client):
    """created_at cannot be forced by the client."""
    staff_api_client.put(
        URL,
        {
            "full_name": "Ada Lovelace",
            "headline": {"en": "Analyst", "fr": "Analyste"},
            "created_at": "2000-01-01T00:00:00Z",
        },
        format="json",
    )

    assert Profile.objects.get().created_at.year != 2000


def test_patch_changes_only_sent_fields(staff_api_client):
    """PATCH is how the admin edits the bio alone."""
    make_profile()

    response = staff_api_client.patch(
        URL,
        {"bio": {"en": "I write programs.", "fr": "J’écris des programmes."}},
        format="json",
    )

    assert response.status_code == 200
    profile = Profile.objects.get()
    assert profile.bio_en == "I write programs."
    assert profile.bio_fr == "J’écris des programmes."
    assert profile.full_name == "Ada Lovelace"
    assert profile.headline_en == "Analyst"


def test_patch_changes_the_desired_role_alone(staff_api_client):
    make_profile(bio_en="I write programs.", bio_fr="J’écris des programmes.")

    response = staff_api_client.patch(
        URL,
        {"desired_role": {"en": "Software engineer", "fr": "Ingénieure logiciel"}},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["desired_role"] == {
        "en": "Software engineer",
        "fr": "Ingénieure logiciel",
    }
    profile = Profile.objects.get()
    assert profile.desired_role_en == "Software engineer"
    assert profile.desired_role_fr == "Ingénieure logiciel"
    assert profile.bio_en == "I write programs."


def test_patch_is_not_found_before_the_profile_is_created(staff_api_client):
    """Only PUT creates the profile."""
    response = staff_api_client.patch(URL, {"full_name": "Ada Lovelace"}, format="json")

    assert response.status_code == 404
    assert not Profile.objects.exists()


def test_delete_is_not_allowed(staff_api_client):
    """The profile can be emptied, not removed."""
    make_profile()

    response = staff_api_client.delete(URL)

    assert response.status_code == 405
    assert Profile.objects.exists()
