"""Tests for the API root of the experience app.

Route: ``/api/v1/experience/``. It lists a link to every collection so the API
can be browsed from a single entry point.
"""

import pytest
from django.urls import reverse

ROOT_URL = reverse("experience:api-root")

COLLECTIONS = [
    "education",
    "certifications",
    "professional-experiences",
    "projects",
    "specializations",
    "skills",
    "tools",
    "methodologies",
]


def test_route():
    """The URL name resolves to the agreed path."""
    assert ROOT_URL == "/api/v1/experience/"


def test_root_links_to_every_collection(api_client):
    """Each collection is listed under its path, with an absolute URL."""
    response = api_client.get(ROOT_URL)

    assert response.status_code == 200
    assert response.json() == {
        name: f"http://testserver/api/v1/experience/{name}/" for name in COLLECTIONS
    }


@pytest.mark.parametrize("method", ["post", "put", "patch", "delete"])
def test_root_is_read_only(api_client, method):
    """The root only describes the API."""
    response = getattr(api_client, method)(ROOT_URL)

    assert response.status_code == 405
