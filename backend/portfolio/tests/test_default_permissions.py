"""Tests for the permission a view gets when it does not declare one.

Public views opt in with ``AllowAny``; a new view that forgets to choose must
not be open to the world.
"""

from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.views import APIView


class UndeclaredPermissionView(APIView):
    def get(self, request):
        return Response({"secret": "data"})


def test_a_view_without_declared_permissions_refuses_anonymous_requests():
    request = APIRequestFactory().get("/")

    response = UndeclaredPermissionView.as_view()(request)

    assert response.status_code in (401, 403)


def test_a_view_without_declared_permissions_accepts_staff(admin_user):
    request = APIRequestFactory().get("/")
    force_authenticate(request, user=admin_user)

    response = UndeclaredPermissionView.as_view()(request)

    assert response.status_code == 200
