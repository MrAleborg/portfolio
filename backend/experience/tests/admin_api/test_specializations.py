"""Tests for the admin specialization endpoints.

Routes: ``specializations/`` (list, create) and ``specializations/{id}/``
(retrieve, update, partial update, delete) under ``/api/v1/admin/``. The
certifications on a specialization's path are written as a list of ids.
"""

from datetime import date

import pytest

from experience.models import Certification, Specialization
from experience.tests.admin_api.helpers import (
    detail_url,
    list_url,
    listed_ids,
    timestamps,
)

pytestmark = pytest.mark.django_db

LIST_URL = list_url("specialization")


def make_specialization(**kwargs):
    """Create a specialization; only pass the fields the test cares about."""
    fields = {
        "name": "Python Path",
        "issuer": "Python Institute",
        "issue_date": date(2024, 1, 1),
    }
    fields.update(kwargs)
    return Specialization.objects.create(**fields)


def make_certification(**kwargs):
    """Create a certification; only pass the fields the test cares about."""
    fields = {
        "name": "PCAP",
        "issuer": "Python Institute",
        "issue_date": date(2024, 1, 1),
    }
    fields.update(kwargs)
    return Certification.objects.create(**fields)


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert LIST_URL == "/api/v1/admin/specializations/"
    assert detail_url("specialization", 1) == "/api/v1/admin/specializations/1/"


def test_list_includes_hidden_entries_in_display_order(staff_api_client):
    """The admin sees everything, ordered by display_order then newest issue_date."""
    hidden = make_specialization(is_visible=False, display_order=0)
    old = make_specialization(issue_date=date(2010, 1, 1), display_order=1)
    new = make_specialization(issue_date=date(2015, 1, 1), display_order=1)

    response = staff_api_client.get(LIST_URL)

    assert response.status_code == 200
    assert listed_ids(response) == [hidden.id, new.id, old.id]


def test_detail_returns_every_field(staff_api_client):
    """Certifications come back as ids, hidden ones included."""
    specialization = make_specialization(
        name="Agile path",
        issuer="Scrum.org",
        issue_date=date(2024, 1, 15),
        credential_id="ABC",
        credential_url="https://www.scrum.org/path/ABC",
        description="All Scrum certifications.",
        display_order=2,
        is_visible=False,
    )
    certification = make_certification(is_visible=False)
    specialization.certifications.add(certification)

    response = staff_api_client.get(detail_url("specialization", specialization.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": specialization.id,
        "name": "Agile path",
        "issuer": "Scrum.org",
        "issue_date": "2024-01-15",
        "expiration_date": None,
        "credential_id": "ABC",
        "credential_url": "https://www.scrum.org/path/ABC",
        "description": "All Scrum certifications.",
        "certifications": [certification.id],
        "display_order": 2,
        "is_visible": False,
        **timestamps(specialization),
    }


def test_create_with_certifications(staff_api_client):
    """A specialization is created with its path of certifications."""
    first = make_certification(name="PCEP")
    second = make_certification(name="PCAP")

    response = staff_api_client.post(
        LIST_URL,
        {
            "name": "Python Path",
            "issuer": "Python Institute",
            "issue_date": "2024-01-01",
            "certifications": [first.id, second.id],
        },
        format="json",
    )

    assert response.status_code == 201
    specialization = Specialization.objects.get()
    assert set(specialization.certifications.all()) == {first, second}


def test_create_without_required_fields_is_a_bad_request(staff_api_client):
    """Each missing required field is reported."""
    response = staff_api_client.post(LIST_URL, {}, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {"name", "issuer", "issue_date"}


def test_create_with_unknown_certification_is_a_bad_request(staff_api_client):
    """Every certification id must exist."""
    response = staff_api_client.post(
        LIST_URL,
        {
            "name": "Python Path",
            "issuer": "Python Institute",
            "issue_date": "2024-01-01",
            "certifications": [999],
        },
        format="json",
    )

    assert response.status_code == 400
    assert list(response.json()) == ["certifications"]


def test_partial_update_replaces_certifications(staff_api_client):
    """Sending certifications sets them to exactly the sent ids."""
    specialization = make_specialization()
    old = make_certification(name="PCEP")
    new = make_certification(name="PCAP")
    specialization.certifications.add(old)

    response = staff_api_client.patch(
        detail_url("specialization", specialization.id),
        {"certifications": [new.id]},
        format="json",
    )

    assert response.status_code == 200
    assert list(specialization.certifications.all()) == [new]


def test_delete_keeps_the_certifications(staff_api_client):
    """Deleting a specialization only unlinks its certifications."""
    specialization = make_specialization()
    specialization.certifications.add(make_certification())

    response = staff_api_client.delete(detail_url("specialization", specialization.id))

    assert response.status_code == 204
    assert not Specialization.objects.exists()
    assert Certification.objects.exists()


def test_detail_of_missing_entry_is_not_found(staff_api_client):
    """An unknown id answers 404."""
    response = staff_api_client.get(detail_url("specialization", 999))

    assert response.status_code == 404
