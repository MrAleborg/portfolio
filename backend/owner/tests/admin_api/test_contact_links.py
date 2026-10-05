"""Tests for the admin contact link endpoints.

Routes: ``/api/v1/admin/profile/contact-links/`` (list, create) and
``/api/v1/admin/profile/contact-links/{id}/`` (retrieve, update, partial
update, delete), reserved to staff users. Unlike the public API, hidden links
are listed and every field is returned and writable, except the id and the
timestamps. A url that is not https://, http:// or mailto: is refused (400),
and so is an unknown kind.
"""

import pytest
from django.urls import reverse

from experience.tests.admin_api.helpers import timestamps
from owner.models import ContactLink

pytestmark = pytest.mark.django_db

LIST_URL = reverse("owner-admin:contact-link-list")


def detail_url(pk):
    return reverse("owner-admin:contact-link-detail", args=[pk])


def make_link(**kwargs):
    """Create a link; only pass the fields the test cares about."""
    fields = {"kind": "email", "url": "mailto:ada@example.com"}
    fields.update(kwargs)
    return ContactLink.objects.create(**fields)


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert LIST_URL == "/api/v1/admin/profile/contact-links/"
    assert detail_url(1) == "/api/v1/admin/profile/contact-links/1/"


@pytest.mark.parametrize("method", ["get", "post"])
def test_anonymous_request_on_the_list_is_unauthorized(api_client, method):
    response = getattr(api_client, method)(LIST_URL)

    assert response.status_code == 401


@pytest.mark.parametrize("method", ["get", "put", "patch", "delete"])
def test_anonymous_request_on_a_link_is_unauthorized(api_client, method):
    link = make_link()

    response = getattr(api_client, method)(detail_url(link.id))

    assert response.status_code == 401


@pytest.mark.parametrize("method", ["get", "post"])
def test_user_who_is_not_staff_is_forbidden_on_the_list(user_api_client, method):
    response = getattr(user_api_client, method)(LIST_URL)

    assert response.status_code == 403


@pytest.mark.parametrize("method", ["get", "put", "patch", "delete"])
def test_user_who_is_not_staff_is_forbidden_on_a_link(user_api_client, method):
    link = make_link()

    response = getattr(user_api_client, method)(detail_url(link.id))

    assert response.status_code == 403
    assert ContactLink.objects.filter(pk=link.pk).exists()


def test_list_includes_hidden_links_in_display_order(staff_api_client):
    """The admin sees everything, in the same order as the public site."""
    late = make_link(kind="website", url="https://example.com", display_order=2)
    hidden = make_link(kind="other", url="https://x.example.com", is_visible=False)
    first = make_link(kind="github", url="https://github.com/ada")

    response = staff_api_client.get(LIST_URL)

    assert response.status_code == 200
    assert [entry["id"] for entry in response.json()] == [hidden.id, first.id, late.id]


def test_detail_returns_every_field(staff_api_client):
    link = make_link(
        kind="linkedin",
        url="https://linkedin.com/in/ada",
        display_order=3,
        is_visible=False,
    )

    response = staff_api_client.get(detail_url(link.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": link.id,
        "kind": "linkedin",
        "url": "https://linkedin.com/in/ada",
        "display_order": 3,
        "is_visible": False,
        **timestamps(link),
    }


def test_create_with_required_fields_only(staff_api_client):
    """Optional fields default like in the model: first in order, visible."""
    response = staff_api_client.post(
        LIST_URL, {"kind": "github", "url": "https://github.com/ada"}, format="json"
    )

    assert response.status_code == 201
    link = ContactLink.objects.get()
    assert response.json() == {
        "id": link.id,
        "kind": "github",
        "url": "https://github.com/ada",
        "display_order": 0,
        "is_visible": True,
        **timestamps(link),
    }


def test_create_with_every_field(staff_api_client):
    response = staff_api_client.post(
        LIST_URL,
        {
            "kind": "website",
            "url": "http://example.com",
            "display_order": 5,
            "is_visible": False,
        },
        format="json",
    )

    assert response.status_code == 201
    link = ContactLink.objects.get()
    assert (link.kind, link.url, link.display_order, link.is_visible) == (
        "website",
        "http://example.com",
        5,
        False,
    )


def test_create_without_required_fields_is_a_bad_request(staff_api_client):
    response = staff_api_client.post(LIST_URL, {}, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {"kind", "url"}
    assert not ContactLink.objects.exists()


def test_create_refuses_a_forbidden_url(staff_api_client):
    response = staff_api_client.post(
        LIST_URL, {"kind": "other", "url": "javascript:alert(1)"}, format="json"
    )

    assert response.status_code == 400
    assert "url" in response.json()
    assert not ContactLink.objects.exists()


@pytest.mark.parametrize(
    ("kind", "url"),
    [
        ("email", "https://example.com/contact"),
        ("github", "mailto:ada@example.com"),
    ],
)
def test_create_refuses_a_url_that_does_not_fit_the_kind(staff_api_client, kind, url):
    response = staff_api_client.post(
        LIST_URL, {"kind": kind, "url": url}, format="json"
    )

    assert response.status_code == 400
    assert "url" in response.json()
    assert not ContactLink.objects.exists()


def test_create_refuses_an_unknown_kind(staff_api_client):
    response = staff_api_client.post(
        LIST_URL, {"kind": "fax", "url": "https://example.com"}, format="json"
    )

    assert response.status_code == 400
    assert "kind" in response.json()
    assert not ContactLink.objects.exists()


def test_id_and_timestamps_are_ignored_on_write(staff_api_client):
    """The client cannot force the id or created_at."""
    response = staff_api_client.post(
        LIST_URL,
        {
            "id": 4242,
            "kind": "email",
            "url": "mailto:ada@example.com",
            "created_at": "2000-01-01T00:00:00Z",
        },
        format="json",
    )

    assert response.status_code == 201
    link = ContactLink.objects.get()
    assert link.id != 4242
    assert link.created_at.year != 2000


def test_put_replaces_every_field(staff_api_client):
    link = make_link(display_order=3, is_visible=False)

    response = staff_api_client.put(
        detail_url(link.id),
        {
            "kind": "github",
            "url": "https://github.com/ada",
            "display_order": 1,
            "is_visible": True,
        },
        format="json",
    )

    assert response.status_code == 200
    link.refresh_from_db()
    assert (link.kind, link.url, link.display_order, link.is_visible) == (
        "github",
        "https://github.com/ada",
        1,
        True,
    )


def test_put_refuses_a_forbidden_url(staff_api_client):
    link = make_link()

    response = staff_api_client.put(
        detail_url(link.id),
        {"kind": "email", "url": "javascript:alert(1)"},
        format="json",
    )

    assert response.status_code == 400
    assert "url" in response.json()
    link.refresh_from_db()
    assert link.url == "mailto:ada@example.com"


def test_patch_changes_only_sent_fields(staff_api_client):
    link = make_link(display_order=2)

    response = staff_api_client.patch(
        detail_url(link.id), {"is_visible": False}, format="json"
    )

    assert response.status_code == 200
    link.refresh_from_db()
    assert link.is_visible is False
    assert link.url == "mailto:ada@example.com"
    assert link.display_order == 2


def test_patch_refuses_a_forbidden_url(staff_api_client):
    link = make_link()

    response = staff_api_client.patch(
        detail_url(link.id), {"url": "javascript:alert(1)"}, format="json"
    )

    assert response.status_code == 400
    assert "url" in response.json()
    link.refresh_from_db()
    assert link.url == "mailto:ada@example.com"


def test_patch_refuses_a_url_that_does_not_fit_the_stored_kind(staff_api_client):
    """The kind is not sent, so the check runs against the stored one."""
    link = make_link(kind="email", url="mailto:ada@example.com")

    response = staff_api_client.patch(
        detail_url(link.id), {"url": "https://example.com"}, format="json"
    )

    assert response.status_code == 400
    assert "url" in response.json()
    link.refresh_from_db()
    assert link.url == "mailto:ada@example.com"


def test_patch_refuses_an_unknown_kind(staff_api_client):
    link = make_link()

    response = staff_api_client.patch(
        detail_url(link.id), {"kind": "fax"}, format="json"
    )

    assert response.status_code == 400
    assert "kind" in response.json()
    link.refresh_from_db()
    assert link.kind == "email"


def test_delete_removes_the_link(staff_api_client):
    link = make_link()

    response = staff_api_client.delete(detail_url(link.id))

    assert response.status_code == 204
    assert not ContactLink.objects.exists()
