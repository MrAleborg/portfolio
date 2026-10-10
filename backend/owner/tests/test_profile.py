"""Tests for the read-only profile endpoint.

Route: ``/api/v1/profile/``. It returns the owner's profile: full name, and
headline, bio and desired role in every language (``{"en": ..., "fr": ...}``). There is one
profile, so no id; until the admin has created it the answer is ``404``.
Write methods are rejected.
"""

import pytest
from django.urls import reverse

from owner.models import Profile

pytestmark = pytest.mark.django_db

URL = reverse("owner:profile")


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
    assert URL == "/api/v1/profile/"


def test_not_found_before_the_profile_is_created(api_client):
    response = api_client.get(URL)

    assert response.status_code == 404


def test_returns_the_profile_in_every_language(api_client):
    """Only the public fields: no id, no timestamps."""
    make_profile(
        full_name="Ada Lovelace",
        headline_en="Analyst",
        headline_fr="Analyste",
        bio_en="I write programs.",
        bio_fr="J’écris des programmes.",
        desired_role_en="Software engineer",
        desired_role_fr="Ingénieure logiciel",
    )

    response = api_client.get(URL)

    assert response.status_code == 200
    assert response.json() == {
        "full_name": "Ada Lovelace",
        "headline": {"en": "Analyst", "fr": "Analyste"},
        "bio": {"en": "I write programs.", "fr": "J’écris des programmes."},
        "desired_role": {"en": "Software engineer", "fr": "Ingénieure logiciel"},
    }


def test_desired_role_is_empty_in_every_language_when_unset(api_client):
    """The desired role is optional: both languages come back as empty texts."""
    make_profile()

    response = api_client.get(URL)

    assert response.json()["desired_role"] == {"en": "", "fr": ""}


@pytest.mark.parametrize("method", ["post", "put", "patch", "delete"])
def test_is_read_only(api_client, method):
    """The profile is edited through the admin API only."""
    make_profile()

    response = getattr(api_client, method)(URL)

    assert response.status_code == 405
