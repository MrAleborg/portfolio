"""Tests for the contact message endpoint.

Route: ``POST /api/v1/profile/contact/``, open to everyone. A visitor sends
``{"name", "email", "message", "website"}``; ``website`` is a honeypot that
real visitors leave empty. A valid message is emailed once, through the default
mailer, from DEFAULT_FROM_EMAIL to CONTACT_EMAIL, with the visitor as Reply-To.
Nothing is stored. The answer is ``204`` with no body. Posting is throttled to
5 per hour. The mailbox is the locmem outbox (``django.core.mail.outbox``).
"""

import logging
from unittest import mock

import pytest
from django.core import mail
from django.urls import reverse

URL = reverse("owner:contact")

OWNER_EMAIL = "owner@example.com"
SENDER_EMAIL = "noreply@example.com"


@pytest.fixture(autouse=True)
def configured_mailbox(settings):
    """The owner's address is set, and mails leave from a known sender."""
    settings.CONTACT_EMAIL = OWNER_EMAIL
    settings.DEFAULT_FROM_EMAIL = SENDER_EMAIL


def test_route():
    """The URL name resolves to the agreed path."""
    assert URL == "/api/v1/profile/contact/"


def valid_message(**overrides):
    """A message the endpoint accepts; override only what a test cares about."""
    fields = {
        "name": "Grace Hopper",
        "email": "grace@example.com",
        "message": "Hello, I would like to talk about a project.",
        "website": "",
    }
    fields.update(overrides)
    return fields


def post(api_client, **overrides):
    return api_client.post(URL, valid_message(**overrides), format="json")


def test_a_valid_message_is_emailed_to_the_owner_and_answered_with_no_content(
    api_client,
):
    response = post(api_client)

    assert response.status_code == 204
    assert response.content == b""
    assert len(mail.outbox) == 1
    sent = mail.outbox[0]
    assert sent.from_email == SENDER_EMAIL
    assert sent.to == [OWNER_EMAIL]
    assert sent.reply_to == ["grace@example.com"]
    assert "Grace Hopper" in sent.body
    assert "grace@example.com" in sent.body
    assert "Hello, I would like to talk about a project." in sent.body


def test_the_honeypot_is_optional(api_client):
    fields = valid_message()
    del fields["website"]

    response = api_client.post(URL, fields, format="json")

    assert response.status_code == 204
    assert len(mail.outbox) == 1


def test_a_filled_honeypot_looks_like_a_success_but_sends_nothing(api_client):
    response = post(api_client, website="https://spam.example.com")

    assert response.status_code == 204
    assert response.content == b""
    assert mail.outbox == []


@pytest.mark.parametrize(
    "overrides",
    [
        {"name": "n" * 100},
        {"message": "m" * 10},
        {"message": "m" * 5000},
    ],
    ids=["name of 100 characters", "message of 10", "message of 5000"],
)
def test_limits_are_inclusive(api_client, overrides):
    response = post(api_client, **overrides)

    assert response.status_code == 204
    assert len(mail.outbox) == 1


def test_a_name_with_a_newline_is_still_sent_and_never_reaches_the_subject(
    api_client,
):
    """The subject is fixed text: visitor input cannot inject a header."""
    response = post(api_client, name="Grace\nBcc: spam@example.com")

    assert response.status_code == 204
    assert len(mail.outbox) == 1
    sent = mail.outbox[0]
    assert "Grace" not in sent.subject
    assert "\n" not in sent.subject
    assert "Bcc" not in sent.extra_headers


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("name", "n" * 101),
        ("email", "not-an-email"),
        ("message", "m" * 9),
        ("message", "m" * 5001),
    ],
    ids=["name over 100", "bad email", "message under 10", "message over 5000"],
)
def test_an_invalid_field_is_a_bad_request_and_sends_nothing(api_client, field, value):
    response = post(api_client, **{field: value})

    assert response.status_code == 400
    assert set(response.json()) == {field}
    assert mail.outbox == []


@pytest.mark.parametrize("field", ["name", "email", "message"])
def test_a_missing_field_is_a_bad_request_and_sends_nothing(api_client, field):
    fields = valid_message()
    del fields[field]

    response = api_client.post(URL, fields, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {field}
    assert mail.outbox == []


def test_the_sixth_message_within_the_hour_is_throttled(api_client):
    statuses = [post(api_client).status_code for _ in range(6)]

    assert statuses == [204] * 5 + [429]
    assert len(mail.outbox) == 5


def test_without_a_contact_email_the_service_is_unavailable(api_client, settings):
    settings.CONTACT_EMAIL = ""

    response = post(api_client)

    assert response.status_code == 503
    assert "detail" in response.json()
    assert mail.outbox == []


def test_when_the_mailer_fails_the_service_is_unavailable_and_the_error_is_logged(
    api_client, caplog
):
    with (
        caplog.at_level(logging.ERROR),
        mock.patch(
            "django.core.mail.backends.locmem.EmailBackend.send_messages",
            side_effect=OSError("mailer exploded"),
        ),
    ):
        response = post(api_client)

    assert response.status_code == 503
    assert "detail" in response.json()
    assert "mailer exploded" in caplog.text


def test_get_is_not_allowed(api_client):
    response = api_client.get(URL)

    assert response.status_code == 405
