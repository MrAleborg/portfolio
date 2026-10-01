from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import AllowAny

from owner.models import Profile
from owner.serializers import ProfileSerializer


class ProfileView(generics.RetrieveAPIView):
    """The single profile; 404 until the admin has created it."""

    permission_classes = [AllowAny]
    serializer_class = ProfileSerializer

    def get_object(self):
        return get_object_or_404(Profile)
