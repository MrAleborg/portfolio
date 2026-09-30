"""Tests for the Profile model: who the portfolio belongs to.

There is a single owner, so at most one profile row. The bio is optional but,
like every optional translated text, filled in every language or in none.
"""

import pytest
from django.db import IntegrityError

from experience.languages import LANGUAGES
from owner.models import Profile

pytestmark = pytest.mark.django_db


def make_profile(**kwargs):
    """Create the profile; only pass the fields the test cares about."""
    fields = {
        "full_name": "Ada Lovelace",
        "headline_en": "Analyst",
        "headline_fr": "Analyste",
    }
    fields.update(kwargs)
    return Profile.objects.create(**fields)


def test_a_second_profile_is_refused():
    """The portfolio has one owner."""
    make_profile()

    with pytest.raises(IntegrityError):
        Profile.objects.create(
            full_name="Other", headline_en="Other", headline_fr="Autre"
        )


def test_the_profile_cannot_take_another_id():
    """The single row is enforced by the database, not only by the default id."""
    with pytest.raises(IntegrityError):
        make_profile(id=2)


@pytest.mark.parametrize("language", LANGUAGES)
def test_bio_cannot_be_filled_in_one_language_only(language):
    bio = {f"bio_{other}": "Text" if other == language else "" for other in LANGUAGES}

    with pytest.raises(IntegrityError):
        make_profile(**bio)


def test_str_is_the_full_name():
    assert str(make_profile(full_name="Ada Lovelace")) == "Ada Lovelace"
