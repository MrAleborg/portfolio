"""Tests for the date rules on every admin route that writes dates.

A date range cannot end before it starts, and a credential cannot expire
before it was issued. The API answers a ``400`` naming the end field instead
of letting the database constraint fail. A partial update is checked against
the dates already stored, so sending only one of the two dates is enough to
trigger the rule.
"""

from datetime import date

import pytest

from experience.models import Certification, Education, ProfessionalExperience, Project
from experience.tests.admin_api.helpers import detail_url, list_url

pytestmark = pytest.mark.django_db


def make_education():
    return Education.objects.create(
        institution="University",
        degree="MSc",
        start_date=date(2024, 1, 1),
        end_date=date(2024, 6, 30),
    )


def make_experience():
    return ProfessionalExperience.objects.create(
        company="Acme",
        position="Developer",
        start_date=date(2024, 1, 1),
        end_date=date(2024, 6, 30),
    )


def make_project():
    return Project.objects.create(
        title="Portfolio", start_date=date(2024, 1, 1), end_date=date(2024, 6, 30)
    )


def make_certification():
    return Certification.objects.create(
        name="PCAP",
        issuer="Python Institute",
        issue_date=date(2024, 1, 1),
        expiration_date=date(2024, 6, 30),
    )


CREDENTIAL = {"name": "PCAP", "issuer": "Python Institute"}

# (URL basename, minimal create payload, start field, end field, row factory)
RESOURCES = [
    (
        "education",
        {"institution": "University", "degree": "MSc"},
        "start_date",
        "end_date",
        make_education,
    ),
    (
        "professionalexperience",
        {"company": "Acme", "position": "Developer"},
        "start_date",
        "end_date",
        make_experience,
    ),
    ("project", {"title": "Portfolio"}, "start_date", "end_date", make_project),
    (
        "certification",
        CREDENTIAL,
        "issue_date",
        "expiration_date",
        make_certification,
    ),
]


@pytest.fixture(params=RESOURCES, ids=[resource[0] for resource in RESOURCES])
def resource(request):
    """Run the test once for each route with a pair of dates."""
    return request.param


def test_create_rejects_end_before_start(staff_api_client, resource):
    """Creating an entry that ends before it starts is a client error."""
    basename, payload, start, end, _ = resource
    payload = {**payload, start: "2024-01-02", end: "2024-01-01"}

    response = staff_api_client.post(list_url(basename), payload, format="json")

    assert response.status_code == 400
    assert list(response.json()) == [end]


def test_create_accepts_end_on_start_day(staff_api_client, resource):
    """An entry may end the day it starts."""
    basename, payload, start, end, _ = resource
    payload = {**payload, start: "2024-01-01", end: "2024-01-01"}

    response = staff_api_client.post(list_url(basename), payload, format="json")

    assert response.status_code == 201


def test_partial_update_of_end_is_checked_against_stored_start(
    staff_api_client, resource
):
    """PATCHing only the end date still compares it with the stored start date."""
    basename, _, _, end, make = resource
    entry = make()

    response = staff_api_client.patch(
        detail_url(basename, entry.id), {end: "2023-12-31"}, format="json"
    )

    assert response.status_code == 400
    assert list(response.json()) == [end]


def test_partial_update_of_start_is_checked_against_stored_end(
    staff_api_client, resource
):
    """PATCHing only the start date past the stored end date is refused too."""
    basename, _, start, end, make = resource
    entry = make()

    response = staff_api_client.patch(
        detail_url(basename, entry.id), {start: "2025-01-01"}, format="json"
    )

    assert response.status_code == 400
    assert list(response.json()) == [end]


def test_partial_update_can_clear_the_end(staff_api_client, resource):
    """Setting the end date to null (ongoing, or never expiring) is always valid."""
    basename, _, _, end, make = resource
    entry = make()

    response = staff_api_client.patch(
        detail_url(basename, entry.id), {end: None}, format="json"
    )

    assert response.status_code == 200
    assert response.json()[end] is None
