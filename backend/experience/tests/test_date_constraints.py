"""Tests for the date rules enforced by the database.

A date range cannot end before it starts, and a credential cannot expire
before it was issued. The rules are check constraints, so they hold for the
admin API, the Django admin (which validates constraints in ``full_clean``)
and any other writer.
"""

from datetime import date

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from experience.models import (
    Certification,
    Education,
    ProfessionalExperience,
    Project,
    Specialization,
)

pytestmark = pytest.mark.django_db

DATE_RANGE_ROWS = {
    Education: {"institution": "University", "degree": "MSc"},
    ProfessionalExperience: {"company": "Acme", "position": "Developer"},
    Project: {"title": "Portfolio"},
}

CREDENTIAL_ROWS = {
    Certification: {"name": "PCAP", "issuer": "Python Institute"},
    Specialization: {"name": "Python Path", "issuer": "Python Institute"},
}


def model_id(model):
    return model.__name__


@pytest.mark.parametrize("model", DATE_RANGE_ROWS, ids=model_id)
def test_date_range_cannot_end_before_it_starts(model):
    """The database refuses an end_date earlier than the start_date."""
    with pytest.raises(IntegrityError):
        model.objects.create(
            start_date=date(2024, 1, 2),
            end_date=date(2024, 1, 1),
            **DATE_RANGE_ROWS[model],
        )


@pytest.mark.parametrize("model", DATE_RANGE_ROWS, ids=model_id)
@pytest.mark.parametrize("end_date", [None, date(2024, 1, 1)], ids=["ongoing", "same"])
def test_date_range_can_be_ongoing_or_end_the_day_it_starts(model, end_date):
    """A null end_date means ongoing, and a one-day range is valid."""
    model.objects.create(
        start_date=date(2024, 1, 1), end_date=end_date, **DATE_RANGE_ROWS[model]
    )


@pytest.mark.parametrize("model", CREDENTIAL_ROWS, ids=model_id)
def test_credential_cannot_expire_before_it_is_issued(model):
    """The database refuses an expiration_date earlier than the issue_date."""
    with pytest.raises(IntegrityError):
        model.objects.create(
            issue_date=date(2024, 1, 2),
            expiration_date=date(2024, 1, 1),
            **CREDENTIAL_ROWS[model],
        )


@pytest.mark.parametrize("model", CREDENTIAL_ROWS, ids=model_id)
@pytest.mark.parametrize(
    "expiration_date", [None, date(2024, 1, 1)], ids=["never", "same"]
)
def test_credential_can_never_expire_or_expire_the_day_it_is_issued(
    model, expiration_date
):
    """A null expiration_date means it never expires."""
    model.objects.create(
        issue_date=date(2024, 1, 1),
        expiration_date=expiration_date,
        **CREDENTIAL_ROWS[model],
    )


def test_full_clean_reports_the_date_rule():
    """Model validation (used by the Django admin forms) catches the rule too."""
    education = Education(
        institution="University",
        degree="MSc",
        start_date=date(2024, 1, 2),
        end_date=date(2024, 1, 1),
    )

    with pytest.raises(ValidationError):
        education.full_clean()
