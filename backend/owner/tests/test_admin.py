"""Tests for the profile in the Django admin.

Smoke tests like the experience ones: the pages load for a superuser. There is
one profile, so it can be added only while there is none, and never deleted.
"""

import pytest
from django.urls import reverse

from owner.models import ContactLink, Profile

pytestmark = pytest.mark.django_db

CHANGELIST_URL = reverse("admin:owner_profile_changelist")
ADD_URL = reverse("admin:owner_profile_add")


def make_profile():
    return Profile.objects.create(
        full_name="Ada Lovelace", headline_en="Analyst", headline_fr="Analyste"
    )


def test_changelist_loads(admin_client):
    make_profile()

    response = admin_client.get(CHANGELIST_URL)

    assert response.status_code == 200


def test_change_page_loads(admin_client):
    profile = make_profile()

    response = admin_client.get(
        reverse("admin:owner_profile_change", args=[profile.pk])
    )

    assert response.status_code == 200


def test_profile_can_be_added_while_there_is_none(admin_client):
    response = admin_client.get(ADD_URL)

    assert response.status_code == 200


def test_a_second_profile_cannot_be_added(admin_client):
    make_profile()

    response = admin_client.get(ADD_URL)

    assert response.status_code == 403


def test_profile_cannot_be_deleted(admin_client):
    profile = make_profile()

    response = admin_client.get(
        reverse("admin:owner_profile_delete", args=[profile.pk])
    )

    assert response.status_code == 403


def test_contact_link_changelist_loads(admin_client):
    ContactLink.objects.create(kind="email", url="mailto:ada@example.com")

    response = admin_client.get(reverse("admin:owner_contactlink_changelist"))

    assert response.status_code == 200


def test_contact_link_can_be_added(admin_client):
    response = admin_client.get(reverse("admin:owner_contactlink_add"))

    assert response.status_code == 200


def test_contact_link_with_a_forbidden_url_is_refused_by_the_admin_form(admin_client):
    response = admin_client.post(
        reverse("admin:owner_contactlink_add"),
        {
            "kind": "other",
            "url": "javascript:alert(1)",
            "display_order": 0,
            "is_visible": "on",
        },
    )

    assert response.status_code == 200
    assert "url" in response.context["adminform"].form.errors
    assert not ContactLink.objects.exists()
