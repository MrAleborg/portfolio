"""Tests for the read-only specialization endpoints.

Routes: ``specializations/`` (list) and ``specializations/{id}/`` (detail)
under ``/api/v1/experience/``. Only visible specializations are exposed,
ordered by ``display_order`` then newest ``issue_date``, and write methods are
rejected.
"""

from datetime import date

import pytest
from django.urls import reverse

from experience.models import Certification, Specialization

pytestmark = pytest.mark.django_db

LIST_URL = reverse("experience:specialization-list")


def detail_url(pk):
    return reverse("experience:specialization-detail", args=[pk])


def make_specialization(**kwargs):
    """Create a specialization; only pass the fields the test cares about."""
    fields = {"name": "Cloud Path", "issuer": "AWS", "issue_date": date(2024, 6, 1)}
    fields.update(kwargs)
    return Specialization.objects.create(**fields)


def make_certification(**kwargs):
    """Create a certification; only pass the fields the test cares about."""
    fields = {"name": "AWS SAA", "issuer": "AWS", "issue_date": date(2024, 1, 1)}
    fields.update(kwargs)
    return Certification.objects.create(**fields)


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert LIST_URL == "/api/v1/experience/specializations/"
    assert detail_url(1) == "/api/v1/experience/specializations/1/"


def test_list_is_empty_without_specializations(api_client):
    """The list answers with a plain JSON list, without pagination envelope."""
    response = api_client.get(LIST_URL)

    assert response.status_code == 200
    assert response.json() == []


def test_list_hides_invisible_specializations(api_client):
    """Specializations with is_visible=False are not listed."""
    visible = make_specialization()
    make_specialization(is_visible=False)

    response = api_client.get(LIST_URL)

    assert [entry["id"] for entry in response.json()] == [visible.id]


def test_list_is_ordered_by_display_order_then_newest_issue_date(api_client):
    """display_order wins over dates; ties are broken by newest issue_date."""
    old = make_specialization(issue_date=date(2015, 1, 1), display_order=1)
    new = make_specialization(issue_date=date(2020, 1, 1), display_order=1)
    pinned = make_specialization(issue_date=date(2010, 1, 1), display_order=0)

    response = api_client.get(LIST_URL)

    assert [entry["id"] for entry in response.json()] == [pinned.id, new.id, old.id]


def test_detail_returns_public_fields(api_client):
    """The detail exposes public fields and the visible certifications of its path.

    is_visible, display_order, created_at and updated_at must not leak.
    """
    specialization = make_specialization(
        name="Python Path",
        issuer="Python Institute",
        issue_date=date(2024, 6, 1),
        expiration_date=date(2027, 6, 1),
        credential_id="SPEC-1",
        credential_url="https://example.com/spec-1",
        description="Every Python certification.",
    )
    certification = make_certification(name="PCAP")
    hidden_certification = make_certification(name="Old", is_visible=False)
    specialization.certifications.add(certification, hidden_certification)

    response = api_client.get(detail_url(specialization.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": specialization.id,
        "name": "Python Path",
        "issuer": "Python Institute",
        "issue_date": "2024-06-01",
        "expiration_date": "2027-06-01",
        "credential_id": "SPEC-1",
        "credential_url": "https://example.com/spec-1",
        "description": "Every Python certification.",
        "certifications": [{"id": certification.id, "name": "PCAP"}],
    }


def test_detail_lists_certifications_in_their_display_order(api_client):
    """The path's certifications follow the certification ordering.

    display_order first, then newest issue_date, as on certifications/.
    """
    specialization = make_specialization()
    old = make_certification(name="Old", issue_date=date(2015, 1, 1), display_order=1)
    new = make_certification(name="New", issue_date=date(2020, 1, 1), display_order=1)
    pinned = make_certification(name="Pinned", display_order=0)
    specialization.certifications.add(old, new, pinned)

    response = api_client.get(detail_url(specialization.id))

    names = [entry["name"] for entry in response.json()["certifications"]]
    assert names == ["Pinned", "New", "Old"]


def test_list_items_have_the_detail_shape(api_client):
    """List and detail share one shape, so the frontend needs a single type."""
    specialization = make_specialization()
    specialization.certifications.add(make_certification())

    listed = api_client.get(LIST_URL).json()[0]
    detailed = api_client.get(detail_url(specialization.id)).json()

    assert listed == detailed


def test_detail_of_invisible_specialization_is_not_found(api_client):
    """A hidden specialization cannot be reached by guessing its id."""
    specialization = make_specialization(is_visible=False)

    response = api_client.get(detail_url(specialization.id))

    assert response.status_code == 404


def test_detail_of_missing_specialization_is_not_found(api_client):
    """An unknown id answers 404."""
    response = api_client.get(detail_url(999))

    assert response.status_code == 404


def test_list_is_read_only(api_client):
    """Specializations are managed in the admin, so the API refuses creation."""
    response = api_client.post(LIST_URL, {"name": "X"})

    assert response.status_code == 405


@pytest.mark.parametrize("method", ["put", "patch", "delete"])
def test_detail_is_read_only(api_client, method):
    """Specializations are managed in the admin, so the API refuses changes."""
    specialization = make_specialization()

    response = getattr(api_client, method)(detail_url(specialization.id))

    assert response.status_code == 405
