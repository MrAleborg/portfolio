import pytest
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def fast_password_hasher(settings):
    """Hash test passwords quickly (admin_client creates a user per test)."""
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def staff_api_client(admin_user):
    """An API client authenticated as the site admin (a staff superuser)."""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def user_api_client(django_user_model):
    """An API client authenticated as a user who is not staff."""
    user = django_user_model.objects.create_user(username="visitor", password="x")
    client = APIClient()
    client.force_authenticate(user=user)
    return client
