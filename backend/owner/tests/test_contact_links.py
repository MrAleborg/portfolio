"""Tests for the ContactLink model: where visitors can reach the owner.

A link has a kind (email, linkedin, ...) and a url that is only ever opened
from the public site, so the url is limited to https://, http:// and mailto:,
and it is a mailto: exactly when the kind is email.
The check lives on the model field, so every way of writing a link (Django
admin, admin API) is held to it. Links are ordered by display_order, then id.
"""

import pytest
from django.core.exceptions import ValidationError

from owner.models import ContactLink

pytestmark = pytest.mark.django_db


def make_link(**kwargs):
    """Create a link; only pass the fields the test cares about."""
    fields = {"kind": "email", "url": "mailto:ada@example.com"}
    fields.update(kwargs)
    return ContactLink.objects.create(**fields)


@pytest.mark.parametrize(
    ("kind", "url"),
    [
        ("linkedin", "https://example.com/in/ada"),
        ("website", "http://example.com"),
        ("email", "mailto:ada@example.com"),
    ],
)
def test_url_accepts_https_http_and_mailto(kind, url):
    link = make_link(kind=kind, url=url)

    link.full_clean()


@pytest.mark.parametrize(
    "url",
    [
        "javascript:alert(1)",
        "ftp://example.com/file",
        "data:text/html,<script>alert(1)</script>",
        "//example.com",
        "example.com",
    ],
)
def test_url_refuses_other_schemes(url):
    link = make_link(url=url)

    with pytest.raises(ValidationError) as error:
        link.full_clean()

    assert "url" in error.value.message_dict


def test_kind_refuses_an_unknown_value():
    link = make_link(kind="fax")

    with pytest.raises(ValidationError) as error:
        link.full_clean()

    assert "kind" in error.value.message_dict


def test_email_kind_requires_a_mailto_url():
    link = make_link(kind="email", url="https://example.com/contact")

    with pytest.raises(ValidationError) as error:
        link.full_clean()

    assert "url" in error.value.message_dict


@pytest.mark.parametrize("kind", ["linkedin", "github", "website", "other"])
def test_other_kinds_refuse_a_mailto_url(kind):
    link = make_link(kind=kind, url="mailto:ada@example.com")

    with pytest.raises(ValidationError) as error:
        link.full_clean()

    assert "url" in error.value.message_dict


def test_a_new_link_is_visible_and_first_in_order():
    link = make_link()

    assert link.is_visible is True
    assert link.display_order == 0


def test_timestamps_are_set_and_updated_at_follows_changes():
    link = make_link()
    created_at = link.created_at
    assert link.updated_at is not None

    link.url = "https://example.com"
    link.save()
    link.refresh_from_db()

    assert link.created_at == created_at
    assert link.updated_at > created_at


def test_links_are_ordered_by_display_order_then_id():
    late = make_link(kind="website", url="https://example.com", display_order=2)
    first_of_tie = make_link(kind="github", url="https://github.com/ada")
    second_of_tie = make_link(kind="linkedin", url="https://linkedin.com/in/ada")

    assert list(ContactLink.objects.all()) == [first_of_tie, second_of_tie, late]
