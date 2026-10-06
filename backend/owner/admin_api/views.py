from django.shortcuts import get_object_or_404
from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from owner.admin_api.serializers import ContactLinkSerializer, ProfileSerializer
from owner.models import ContactLink, Profile


class ProfileView(generics.RetrieveUpdateAPIView):
    """The single profile. PUT creates it when there is none yet."""

    permission_classes = [IsAdminUser]
    serializer_class = ProfileSerializer

    def get_object(self):
        profile = get_object_or_404(Profile)
        self.check_object_permissions(self.request, profile)
        return profile

    def put(self, request, *args, **kwargs):
        profile = Profile.objects.first()
        serializer = self.get_serializer(profile, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            serializer.data,
            status=status.HTTP_200_OK if profile else status.HTTP_201_CREATED,
        )


class ContactLinkViewSet(viewsets.ModelViewSet):
    """Full CRUD on the contact links, hidden ones included."""

    permission_classes = [IsAdminUser]
    queryset = ContactLink.objects.all()
    serializer_class = ContactLinkSerializer
