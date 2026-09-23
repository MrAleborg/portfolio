"""Tests for the read-only certification endpoints.

Routes: ``certifications/`` (list, filterable with ``?tag={id}``) and
``certifications/{id}/`` (detail) under ``/api/v1/experience/``. Only visible
certifications are exposed, ordered by ``display_order`` then newest
``issue_date``, and write methods are rejected.
"""

from datetime import date

import pytest
from django.urls import reverse

from experience.models import Certification, Methodology, Skill, Specialization, Tool

pytestmark = pytest.mark.django_db

LIST_URL = reverse("experience:certification-list")


def detail_url(pk):
    return reverse("experience:certification-detail", args=[pk])


def make_certification(**kwargs):
    """Create a certification; only pass the fields the test cares about."""
    fields = {"name": "AWS SAA", "issuer": "AWS", "issue_date": date(2024, 1, 1)}
    fields.update(kwargs)
    return Certification.objects.create(**fields)


def make_specialization(**kwargs):
    """Create a specialization; only pass the fields the test cares about."""
    fields = {"name": "Cloud Path", "issuer": "AWS", "issue_date": date(2024, 6, 1)}
    fields.update(kwargs)
    return Specialization.objects.create(**fields)


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert LIST_URL == "/api/v1/experience/certifications/"
    assert detail_url(1) == "/api/v1/experience/certifications/1/"


def test_list_is_empty_without_certifications(api_client):
    """The list answers with a plain JSON list, without pagination envelope."""
    response = api_client.get(LIST_URL)

    assert response.status_code == 200
    assert response.json() == []


def test_list_hides_invisible_certifications(api_client):
    """Certifications with is_visible=False are not listed."""
    visible = make_certification()
    make_certification(is_visible=False)

    response = api_client.get(LIST_URL)

    assert [entry["id"] for entry in response.json()] == [visible.id]


def test_list_is_ordered_by_display_order_then_newest_issue_date(api_client):
    """display_order wins over dates; ties are broken by newest issue_date."""
    old = make_certification(issue_date=date(2015, 1, 1), display_order=1)
    new = make_certification(issue_date=date(2020, 1, 1), display_order=1)
    pinned = make_certification(issue_date=date(2010, 1, 1), display_order=0)

    response = api_client.get(LIST_URL)

    assert [entry["id"] for entry in response.json()] == [pinned.id, new.id, old.id]


def test_list_filters_by_tag(api_client):
    """?tag={id} keeps only the certifications tagged with it."""
    python = Skill.objects.create(name="Python")
    tagged = make_certification(name="PCAP")
    tagged.tags.add(python)
    make_certification(name="Untagged")

    response = api_client.get(LIST_URL, {"tag": python.id})

    assert [entry["id"] for entry in response.json()] == [tagged.id]


def test_list_filter_by_unknown_tag_is_empty(api_client):
    """An unknown tag id matches nothing, it is not an error."""
    make_certification()

    response = api_client.get(LIST_URL, {"tag": 999})

    assert response.status_code == 200
    assert response.json() == []


def test_list_filter_by_invalid_tag_is_a_bad_request(api_client):
    """A tag that is not an id is a client error."""
    response = api_client.get(LIST_URL, {"tag": "python"})

    assert response.status_code == 400


def test_detail_returns_public_fields(api_client):
    """The detail exposes public fields, tags and visible specializations.

    Tags carry their kind so the frontend can group them; they follow the Tag
    ordering (kind, then name). is_visible, display_order, created_at and
    updated_at must not leak.
    """
    certification = make_certification(
        name="PCAP",
        issuer="Python Institute",
        issue_date=date(2023, 3, 15),
        expiration_date=date(2026, 3, 15),
        credential_id="ABC-123",
        credential_url="https://example.com/abc-123",
        description="Python programming.",
    )
    skill = Skill.objects.create(name="Python")
    tool = Tool.objects.create(name="Pytest")
    methodology = Methodology.objects.create(name="TDD")
    certification.tags.add(skill, tool, methodology)
    specialization = make_specialization(name="Python Path")
    hidden_specialization = make_specialization(name="Secret", is_visible=False)
    for entry in (specialization, hidden_specialization):
        entry.certifications.add(certification)

    response = api_client.get(detail_url(certification.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": certification.id,
        "name": "PCAP",
        "issuer": "Python Institute",
        "issue_date": "2023-03-15",
        "expiration_date": "2026-03-15",
        "credential_id": "ABC-123",
        "credential_url": "https://example.com/abc-123",
        "description": "Python programming.",
        "tags": [
            {"id": methodology.id, "name": "TDD", "kind": "methodology"},
            {"id": skill.id, "name": "Python", "kind": "skill"},
            {"id": tool.id, "name": "Pytest", "kind": "tool"},
        ],
        "specializations": [{"id": specialization.id, "name": "Python Path"}],
    }


def test_list_items_have_the_detail_shape(api_client):
    """List and detail share one shape, so the frontend needs a single type."""
    certification = make_certification()

    listed = api_client.get(LIST_URL).json()[0]
    detailed = api_client.get(detail_url(certification.id)).json()

    assert listed == detailed


def test_detail_of_invisible_certification_is_not_found(api_client):
    """A hidden certification cannot be reached by guessing its id."""
    certification = make_certification(is_visible=False)

    response = api_client.get(detail_url(certification.id))

    assert response.status_code == 404


def test_detail_of_missing_certification_is_not_found(api_client):
    """An unknown id answers 404."""
    response = api_client.get(detail_url(999))

    assert response.status_code == 404


def test_list_is_read_only(api_client):
    """Certifications are managed in the admin, so the API refuses creation."""
    response = api_client.post(LIST_URL, {"name": "X"})

    assert response.status_code == 405


@pytest.mark.parametrize("method", ["put", "patch", "delete"])
def test_detail_is_read_only(api_client, method):
    """Certifications are managed in the admin, so the API refuses changes."""
    certification = make_certification()

    response = getattr(api_client, method)(detail_url(certification.id))

    assert response.status_code == 405
