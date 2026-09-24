import pytest
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def fast_password_hasher(settings):
    """Hash test passwords quickly (admin_client creates a user per test)."""
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@pytest.fixture
def api_client():
    return APIClient()
