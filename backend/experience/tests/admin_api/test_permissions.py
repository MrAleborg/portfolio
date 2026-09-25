"""Tests for access control on the admin API (``/api/v1/admin/``).

Every route, including the API root, is reserved to staff users: no token is
a ``401`` and a token of any other user a ``403``. The permission is checked
before the object is looked up, so an unknown id gets the same answers.
"""

import pytest
from django.urls import reverse

from experience.tests.admin_api.helpers import detail_url, list_url

pytestmark = pytest.mark.django_db

ROOT_URL = reverse("experience-admin:api-root")

BASENAMES = [
    "education",
    "professionalexperience",
]

LIST_METHODS = ["get", "post"]
DETAIL_METHODS = ["get", "put", "patch", "delete"]

REQUESTS = [
    *((method, ROOT_URL) for method in ["get"]),
    *((method, list_url(name)) for name in BASENAMES for method in LIST_METHODS),
    *(
        (method, detail_url(name, 999))
        for name in BASENAMES
        for method in DETAIL_METHODS
    ),
]


def request_id(request):
    method, url = request
    return f"{method.upper()} {url}"


def test_root_route():
    """The admin API lives apart from the public API."""
    assert ROOT_URL == "/api/v1/admin/"


@pytest.mark.parametrize(("method", "url"), REQUESTS, ids=map(request_id, REQUESTS))
def test_anonymous_request_is_unauthorized(api_client, method, url):
    """Without a token the API asks for credentials (401), whatever the method."""
    response = getattr(api_client, method)(url)

    assert response.status_code == 401


@pytest.mark.parametrize(("method", "url"), REQUESTS, ids=map(request_id, REQUESTS))
def test_non_staff_user_is_forbidden(user_api_client, method, url):
    """Only the site admin may use the admin API, not any logged-in account."""
    response = getattr(user_api_client, method)(url)

    assert response.status_code == 403


def test_root_lists_the_collections(staff_api_client):
    """The root links to every admin collection."""
    response = staff_api_client.get(ROOT_URL)

    assert response.status_code == 200
    assert set(response.json()) == {
        "education",
        "professional-experiences",
    }


def test_jwt_access_token_grants_access(api_client, admin_user):
    """The token returned by the login route is accepted by the admin API."""
    login = api_client.post(
        reverse("accounts:jwt-create"),
        {"username": admin_user.username, "password": "password"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.json()['access']}")

    response = api_client.get(ROOT_URL)

    assert response.status_code == 200
