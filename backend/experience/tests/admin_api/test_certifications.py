"""Tests for the admin certification endpoints.

Routes: ``certifications/`` (list, create) and ``certifications/{id}/``
(retrieve, update, partial update, delete) under ``/api/v1/admin/``. Tags are
written as a list of ids (any kind). ``specializations`` is read-only: the
link is edited on the specialization, which owns it.
"""

from datetime import date

import pytest

from experience.models import Certification, Methodology, Skill, Specialization
from experience.tests.admin_api.helpers import (
    detail_url,
    list_url,
    listed_ids,
    timestamps,
)

pytestmark = pytest.mark.django_db

LIST_URL = list_url("certification")


def make_certification(**kwargs):
    """Create a certification; only pass the fields the test cares about."""
    fields = {
        "name": "PCAP",
        "issuer": "Python Institute",
        "issue_date": date(2024, 1, 1),
    }
    fields.update(kwargs)
    return Certification.objects.create(**fields)


def make_specialization(**kwargs):
    """Create a specialization; only pass the fields the test cares about."""
    fields = {
        "name": "Python Path",
        "issuer": "Python Institute",
        "issue_date": date(2024, 1, 1),
    }
    fields.update(kwargs)
    return Specialization.objects.create(**fields)


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert LIST_URL == "/api/v1/admin/certifications/"
    assert detail_url("certification", 1) == "/api/v1/admin/certifications/1/"


def test_list_includes_hidden_entries_in_display_order(staff_api_client):
    """The admin sees everything, ordered by display_order then newest issue_date."""
    hidden = make_certification(is_visible=False, display_order=0)
    old = make_certification(issue_date=date(2010, 1, 1), display_order=1)
    new = make_certification(issue_date=date(2015, 1, 1), display_order=1)

    response = staff_api_client.get(LIST_URL)

    assert response.status_code == 200
    assert listed_ids(response) == [hidden.id, new.id, old.id]


def test_detail_returns_every_field(staff_api_client):
    """Tags and specializations come back as ids, hidden specializations included."""
    certification = make_certification(
        name="Professional Scrum Master I",
        issuer="Scrum.org",
        issue_date=date(2023, 5, 12),
        expiration_date=date(2026, 5, 12),
        credential_id="123456",
        credential_url="https://www.scrum.org/certificates/123456",
        description="Scrum basics.",
        display_order=1,
        is_visible=False,
    )
    methodology = Methodology.objects.create(name="Scrum")
    certification.tags.add(methodology)
    specialization = make_specialization(is_visible=False)
    specialization.certifications.add(certification)

    response = staff_api_client.get(detail_url("certification", certification.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": certification.id,
        "name": "Professional Scrum Master I",
        "issuer": "Scrum.org",
        "issue_date": "2023-05-12",
        "expiration_date": "2026-05-12",
        "credential_id": "123456",
        "credential_url": "https://www.scrum.org/certificates/123456",
        "description": "Scrum basics.",
        "tags": [methodology.id],
        "specializations": [specialization.id],
        "display_order": 1,
        "is_visible": False,
        **timestamps(certification),
    }


def test_create_with_tags(staff_api_client):
    """A certification is created with its tags in one request."""
    skill = Skill.objects.create(name="Python")

    response = staff_api_client.post(
        LIST_URL,
        {
            "name": "PCAP",
            "issuer": "Python Institute",
            "issue_date": "2024-01-01",
            "tags": [skill.id],
        },
        format="json",
    )

    assert response.status_code == 201
    certification = Certification.objects.get()
    assert list(certification.tags.all()) == [skill]
    assert response.json()["expiration_date"] is None


def test_create_without_required_fields_is_a_bad_request(staff_api_client):
    """Each missing required field is reported."""
    response = staff_api_client.post(LIST_URL, {}, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {"name", "issuer", "issue_date"}


@pytest.mark.parametrize(
    ("field", "value"),
    [("tags", [999]), ("credential_url", "not a url")],
    ids=["unknown tag", "invalid url"],
)
def test_create_with_invalid_value_is_a_bad_request(staff_api_client, field, value):
    """Tags must exist and the credential URL must be a URL."""
    response = staff_api_client.post(
        LIST_URL,
        {
            "name": "PCAP",
            "issuer": "Python Institute",
            "issue_date": "2024-01-01",
            field: value,
        },
        format="json",
    )

    assert response.status_code == 400
    assert list(response.json()) == [field]


def test_specializations_cannot_be_written_here(staff_api_client):
    """The link belongs to the specialization, so it is ignored on a certification."""
    certification = make_certification()
    specialization = make_specialization()

    response = staff_api_client.patch(
        detail_url("certification", certification.id),
        {"specializations": [specialization.id]},
        format="json",
    )

    assert response.status_code == 200
    assert list(certification.specializations.all()) == []


def test_partial_update_replaces_tags(staff_api_client):
    """Sending tags sets them to exactly the sent ids."""
    certification = make_certification()
    old = Skill.objects.create(name="Python")
    new = Methodology.objects.create(name="Scrum")
    certification.tags.add(old)

    response = staff_api_client.patch(
        detail_url("certification", certification.id),
        {"tags": [new.id], "is_visible": False},
        format="json",
    )

    assert response.status_code == 200
    certification.refresh_from_db()
    assert list(certification.tags.all()) == [new]
    assert certification.is_visible is False


def test_delete_unlinks_it_from_specializations(staff_api_client):
    """Deleting a certification keeps the specializations it was part of."""
    certification = make_certification()
    specialization = make_specialization()
    specialization.certifications.add(certification)

    response = staff_api_client.delete(detail_url("certification", certification.id))

    assert response.status_code == 204
    assert not Certification.objects.exists()
    assert list(specialization.certifications.all()) == []


def test_detail_of_missing_entry_is_not_found(staff_api_client):
    """An unknown id answers 404."""
    response = staff_api_client.get(detail_url("certification", 999))

    assert response.status_code == 404
