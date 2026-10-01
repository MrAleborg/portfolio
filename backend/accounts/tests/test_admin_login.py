"""Tests for the throttling of the Django admin login (``/admin/login/``).

It takes the same password as the API login, so it shares its rate limit and
its attempts counter: guessing through one door doesn't reset the other.
"""

import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db

ADMIN_LOGIN_URL = reverse("admin:login")
API_LOGIN_URL = reverse("accounts:jwt-create")


def admin_login(client, password="wrong"):
    return client.post(
        ADMIN_LOGIN_URL,
        {"username": "admin", "password": password, "next": "/admin/"},
    )


def test_admin_login_is_throttled_after_five_attempts_a_minute(client):
    statuses = [admin_login(client).status_code for _ in range(6)]

    assert statuses == [200] * 5 + [429]


def test_admin_login_form_can_always_be_opened(client):
    statuses = [client.get(ADMIN_LOGIN_URL).status_code for _ in range(6)]

    assert statuses == [200] * 6


def test_admin_login_still_works_within_the_limit(client, admin_user):
    response = admin_login(client, password="password")

    assert response.status_code == 302


def test_admin_login_shares_its_attempts_with_the_api_login(client, api_client):
    for _ in range(5):
        api_client.post(
            API_LOGIN_URL, {"username": "admin", "password": "wrong"}, format="json"
        )

    response = admin_login(client)

    assert response.status_code == 429
