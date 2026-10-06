import logging

from django.conf import settings
from django.core.mail import EmailMessage
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import APIException
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from owner.models import ContactLink, Profile
from owner.serializers import (
    ContactLinkSerializer,
    ContactMessageSerializer,
    ProfileSerializer,
)
from owner.throttles import CountValidRequestsThrottle

logger = logging.getLogger(__name__)


class ProfileView(generics.RetrieveAPIView):
    """The single profile; 404 until the admin has created it."""

    permission_classes = [AllowAny]
    serializer_class = ProfileSerializer

    def get_object(self):
        return get_object_or_404(Profile)


class ContactLinkListView(generics.ListAPIView):
    """The links where visitors can reach the owner."""

    permission_classes = [AllowAny]
    queryset = ContactLink.objects.filter(is_visible=True)
    serializer_class = ContactLinkSerializer


class ContactUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Messages cannot be sent right now. Please try again later."
    default_code = "contact_unavailable"


class ContactMessageView(APIView):
    """Receive a message from a visitor; 204 when it is accepted."""

    permission_classes = [AllowAny]
    # JSON only: a plain cross-site HTML form cannot send it.
    parser_classes = [JSONParser]
    throttle_scope = "contact"

    def post(self, request):
        # Refuse over the limit up front, but count only valid messages.
        throttle = CountValidRequestsThrottle()
        if not throttle.allow_request(request, self):
            self.throttled(request, throttle.wait())
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        throttle.record()
        message = serializer.validated_data
        if not settings.CONTACT_EMAIL:
            raise ContactUnavailable
        if message.get("website"):
            # A bot filled the honeypot: pretend it worked, send nothing.
            return Response(status=204)
        email = EmailMessage(
            # Fixed subject: nothing the visitor typed ends up in a header.
            subject="New message from the portfolio",
            body=(
                f"Name: {message['name']}\n"
                f"Email: {message['email']}\n\n"
                f"{message['message']}\n"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[settings.CONTACT_EMAIL],
            reply_to=[message["email"]],
        )
        try:
            email.send()
        except Exception as error:
            logger.exception("Could not send a contact message")
            raise ContactUnavailable from error
        return Response(status=204)
