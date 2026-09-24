"""Tests for authentication of the site admin.

Routes under ``/api/v1/auth/``: JWT login (``jwt/create/``), refresh, verify,
logout (``jwt/blacklist/``), the current user (``users/me/``) and password
change (``users/set_password/``). Only staff users can get tokens; signup,
activation and password reset are not exposed.
"""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

pytestmark = pytest.mark.django_db

PASSWORD = "correct-horse-battery"

CREATE_URL = reverse("accounts:jwt-create")
REFRESH_URL = reverse("accounts:jwt-refresh")
VERIFY_URL = reverse("accounts:jwt-verify")
BLACKLIST_URL = reverse("accounts:jwt-blacklist")
ME_URL = reverse("accounts:user-me")
SET_PASSWORD_URL = reverse("accounts:user-set-password")


def make_user(**kwargs):
    defaults = {
        "username": "admin",
        "email": "admin@example.com",
        "is_staff": True,
    }
    defaults.update(kwargs)
    return get_user_model().objects.create_user(password=PASSWORD, **defaults)


def login(api_client, username="admin", password=PASSWORD):
    return api_client.post(
        CREATE_URL, {"username": username, "password": password}, format="json"
    )


def authenticate(api_client, access):
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")


def test_routes():
    """The URL names resolve to the agreed paths."""
    assert CREATE_URL == "/api/v1/auth/jwt/create/"
    assert REFRESH_URL == "/api/v1/auth/jwt/refresh/"
    assert VERIFY_URL == "/api/v1/auth/jwt/verify/"
    assert BLACKLIST_URL == "/api/v1/auth/jwt/blacklist/"
    assert ME_URL == "/api/v1/auth/users/me/"
    assert SET_PASSWORD_URL == "/api/v1/auth/users/set_password/"


def test_staff_user_gets_access_and_refresh_tokens(api_client):
    """Logging in as staff returns the token pair the frontend stores."""
    make_user()

    response = login(api_client)

    assert response.status_code == 200
    assert set(response.json()) == {"access", "refresh"}


def test_wrong_password_is_rejected(api_client):
    """A wrong password gets no token."""
    make_user()

    response = login(api_client, password="wrong")

    assert response.status_code == 401


def test_non_staff_user_is_rejected(api_client):
    """Only the site admin may log in, not any account in the database."""
    make_user(is_staff=False)

    response = login(api_client)

    assert response.status_code == 401


def test_inactive_staff_user_is_rejected(api_client):
    """Deactivating an account in the Django admin blocks its login."""
    make_user(is_active=False)

    response = login(api_client)

    assert response.status_code == 401


def test_me_returns_the_current_user(api_client):
    """The frontend can show who is logged in, without internal fields."""
    user = make_user()
    authenticate(api_client, login(api_client).json()["access"])

    response = api_client.get(ME_URL)

    assert response.status_code == 200
    assert response.json() == {
        "id": user.id,
        "username": "admin",
        "email": "admin@example.com",
    }


def test_me_requires_a_token(api_client):
    """Anonymous requests are told to authenticate."""
    response = api_client.get(ME_URL)

    assert response.status_code == 401


def test_me_rejects_an_invalid_token(api_client):
    """A forged or corrupted token is not accepted."""
    authenticate(api_client, "not-a-token")

    response = api_client.get(ME_URL)

    assert response.status_code == 401


@pytest.mark.parametrize("method", ["put", "patch", "delete"])
def test_me_is_read_only(api_client, method):
    """The admin account is managed with createsuperuser, not through the API."""
    make_user()
    authenticate(api_client, login(api_client).json()["access"])

    response = getattr(api_client, method)(ME_URL)

    assert response.status_code == 405


def test_verify_accepts_a_valid_token(api_client):
    """The frontend can check a stored token before using it."""
    make_user()
    access = login(api_client).json()["access"]

    response = api_client.post(VERIFY_URL, {"token": access}, format="json")

    assert response.status_code == 200


def test_refresh_returns_a_new_token_pair(api_client):
    """An expired access token can be renewed without logging in again."""
    make_user()
    refresh = login(api_client).json()["refresh"]

    response = api_client.post(REFRESH_URL, {"refresh": refresh}, format="json")

    assert response.status_code == 200
    assert set(response.json()) == {"access", "refresh"}


def test_refresh_token_cannot_be_reused_after_rotation(api_client):
    """A stolen refresh token stops working once it has been used."""
    make_user()
    refresh = login(api_client).json()["refresh"]
    api_client.post(REFRESH_URL, {"refresh": refresh}, format="json")

    response = api_client.post(REFRESH_URL, {"refresh": refresh}, format="json")

    assert response.status_code == 401


def test_blacklisted_refresh_token_is_rejected(api_client):
    """Logging out makes the refresh token useless."""
    make_user()
    refresh = login(api_client).json()["refresh"]

    logout = api_client.post(BLACKLIST_URL, {"refresh": refresh}, format="json")
    response = api_client.post(REFRESH_URL, {"refresh": refresh}, format="json")

    assert logout.status_code == 200
    assert response.status_code == 401


def test_set_password_changes_the_password(api_client):
    """After a change, only the new password logs in."""
    make_user()
    authenticate(api_client, login(api_client).json()["access"])

    response = api_client.post(
        SET_PASSWORD_URL,
        {"current_password": PASSWORD, "new_password": "a-new-strong-pass-42"},
        format="json",
    )

    assert response.status_code == 204
    api_client.credentials()
    assert login(api_client, password="a-new-strong-pass-42").status_code == 200
    assert login(api_client).status_code == 401


def test_set_password_rejects_a_wrong_current_password(api_client):
    """A stolen access token alone is not enough to change the password."""
    make_user()
    authenticate(api_client, login(api_client).json()["access"])

    response = api_client.post(
        SET_PASSWORD_URL,
        {"current_password": "wrong", "new_password": "a-new-strong-pass-42"},
        format="json",
    )

    assert response.status_code == 400


def test_set_password_requires_a_token(api_client):
    """Anonymous requests cannot change a password."""
    response = api_client.post(
        SET_PASSWORD_URL,
        {"current_password": PASSWORD, "new_password": "a-new-strong-pass-42"},
        format="json",
    )

    assert response.status_code == 401


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("post", "/api/v1/auth/users/"),
        ("get", "/api/v1/auth/users/"),
        ("get", "/api/v1/auth/users/1/"),
        ("post", "/api/v1/auth/users/activation/"),
        ("post", "/api/v1/auth/users/reset_password/"),
        ("post", "/api/v1/auth/users/reset_password_confirm/"),
    ],
)
def test_other_djoser_routes_are_not_exposed(api_client, method, path):
    """No signup, user listing, activation or password reset."""
    make_user()
    authenticate(api_client, login(api_client).json()["access"])

    response = getattr(api_client, method)(path)

    assert response.status_code == 404


def test_public_api_needs_no_token(api_client):
    """Visitors still read the portfolio without logging in."""
    response = api_client.get(reverse("experience:education-list"))

    assert response.status_code == 200


def test_public_api_rejects_an_invalid_token(api_client):
    """A bad Authorization header is an error even on public routes.

    The frontend must drop an expired token instead of sending it.
    """
    authenticate(api_client, "not-a-token")

    response = api_client.get(reverse("experience:education-list"))

    assert response.status_code == 401
