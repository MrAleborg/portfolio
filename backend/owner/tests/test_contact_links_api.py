"""Tests for the read-only contact links endpoint.

Route: ``/api/v1/profile/contact-links/``. It is open to everyone and returns
a plain list of ``{"kind", "url"}``. Only visible links are listed, ordered by
``display_order`` then id; nothing else about a link is exposed. Write methods
are rejected.
"""

import pytest
from django.urls import reverse

from owner.models import ContactLink

pytestmark = pytest.mark.django_db

URL = reverse("owner:contact-link-list")


def make_link(**kwargs):
    """Create a link; only pass the fields the test cares about."""
    fields = {"kind": "email", "url": "mailto:ada@example.com"}
    fields.update(kwargs)
    return ContactLink.objects.create(**fields)


def test_route():
    """The URL name resolves to the agreed path."""
    assert URL == "/api/v1/profile/contact-links/"


def test_list_is_empty_without_links(api_client):
    """The list answers with a plain JSON list, without pagination envelope."""
    response = api_client.get(URL)

    assert response.status_code == 200
    assert response.json() == []


def test_list_returns_only_kind_and_url(api_client):
    """No id, display_order, is_visible or timestamps leak."""
    make_link(kind="github", url="https://github.com/ada", display_order=4)

    response = api_client.get(URL)

    assert response.status_code == 200
    assert response.json() == [{"kind": "github", "url": "https://github.com/ada"}]


def test_list_hides_invisible_links(api_client):
    make_link(kind="email", url="mailto:ada@example.com")
    make_link(kind="other", url="https://secret.example.com", is_visible=False)

    response = api_client.get(URL)

    assert response.status_code == 200
    assert [link["kind"] for link in response.json()] == ["email"]


def test_list_is_ordered_by_display_order_then_id(api_client):
    make_link(kind="website", url="https://example.com", display_order=2)
    make_link(kind="github", url="https://github.com/ada", display_order=1)
    make_link(kind="linkedin", url="https://linkedin.com/in/ada", display_order=1)

    response = api_client.get(URL)

    assert response.status_code == 200
    assert [link["kind"] for link in response.json()] == [
        "github",
        "linkedin",
        "website",
    ]


@pytest.mark.parametrize("method", ["post", "put", "patch", "delete"])
def test_is_read_only(api_client, method):
    """Links are edited through the admin API only."""
    make_link()

    response = getattr(api_client, method)(URL)

    assert response.status_code == 405
    assert ContactLink.objects.count() == 1
