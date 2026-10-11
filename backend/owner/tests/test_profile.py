"""Tests for the read-only profile endpoint.

Route: ``/api/v1/profile/``. It returns the owner's profile: full name, and
headline, bio and desired role in every language (``{"en": ..., "fr": ...}``), and
its ``main_stack``: the tags the owner chose, in order. There is one
profile, so no id; until the admin has created it the answer is ``404``.
Write methods are rejected.
"""

import pytest
from django.urls import reverse

from experience.models import Methodology, Skill, Tag, Tool
from owner.models import Profile

pytestmark = pytest.mark.django_db

URL = reverse("owner:profile")


def make_profile(**kwargs):
    """Create the profile; only pass the fields the test cares about."""
    fields = {
        "full_name": "Ada Lovelace",
        "headline_en": "Analyst",
        "headline_fr": "Analyste",
    }
    fields.update(kwargs)
    return Profile.objects.create(**fields)


def test_route():
    """The URL name resolves to the agreed path."""
    assert URL == "/api/v1/profile/"


def test_not_found_before_the_profile_is_created(api_client):
    response = api_client.get(URL)

    assert response.status_code == 404


def test_returns_the_profile_in_every_language(api_client):
    """Only the public fields: no id, no timestamps."""
    make_profile(
        full_name="Ada Lovelace",
        headline_en="Analyst",
        headline_fr="Analyste",
        bio_en="I write programs.",
        bio_fr="J’écris des programmes.",
        desired_role_en="Software engineer",
        desired_role_fr="Ingénieure logiciel",
    )

    response = api_client.get(URL)

    assert response.status_code == 200
    assert response.json() == {
        "full_name": "Ada Lovelace",
        "headline": {"en": "Analyst", "fr": "Analyste"},
        "bio": {"en": "I write programs.", "fr": "J’écris des programmes."},
        "desired_role": {"en": "Software engineer", "fr": "Ingénieure logiciel"},
        "main_stack": [],
    }


def test_desired_role_is_empty_in_every_language_when_unset(api_client):
    """The desired role is optional: both languages come back as empty texts."""
    make_profile()

    response = api_client.get(URL)

    assert response.json()["desired_role"] == {"en": "", "fr": ""}


@pytest.mark.parametrize("method", ["post", "put", "patch", "delete"])
def test_is_read_only(api_client, method):
    """The profile is edited through the admin API only."""
    make_profile()

    response = getattr(api_client, method)(URL)

    assert response.status_code == 405


def test_main_stack_is_empty_when_no_tag_has_a_position(api_client):
    make_profile()
    Skill.objects.create(name_en="Python", name_fr="Python")

    response = api_client.get(URL)

    assert response.json()["main_stack"] == []


def test_main_stack_lists_the_chosen_tags_with_their_kind(api_client):
    make_profile()
    tag = Tool.objects.create(
        name_en="Docker", name_fr="Docker FR", main_stack_position=1
    )

    response = api_client.get(URL)

    assert response.json()["main_stack"] == [
        {"id": tag.id, "name": {"en": "Docker", "fr": "Docker FR"}, "kind": "tool"}
    ]


def test_main_stack_is_ordered_by_position_then_by_english_name(api_client):
    make_profile()
    last = Skill.objects.create(name_en="A", name_fr="A", main_stack_position=9)
    tie_b = Skill.objects.create(name_en="B", name_fr="B", main_stack_position=2)
    tie_a = Tool.objects.create(name_en="A", name_fr="A", main_stack_position=2)
    first = Skill.objects.create(name_en="Z", name_fr="Z", main_stack_position=0)

    response = api_client.get(URL)

    ids = [tag["id"] for tag in response.json()["main_stack"]]
    assert ids == [first.id, tie_a.id, tie_b.id, last.id]


def test_main_stack_leaves_out_the_tags_without_a_position(api_client):
    make_profile()
    chosen = Skill.objects.create(
        name_en="Python", name_fr="Python", main_stack_position=1
    )
    Skill.objects.create(name_en="Go", name_fr="Go")

    response = api_client.get(URL)

    ids = [tag["id"] for tag in response.json()["main_stack"]]
    assert ids == [chosen.id]


def test_main_stack_mixes_every_kind_and_is_not_capped(api_client):
    """Methodologies can be chosen too; the home page does the cutting."""
    make_profile()
    kinds = [Skill, Tool, Methodology]
    for position in range(7):
        kinds[position % 3].objects.create(
            name_en=f"Tag {position}",
            name_fr=f"Tag {position}",
            main_stack_position=position,
        )

    response = api_client.get(URL)

    main_stack = response.json()["main_stack"]
    assert [tag["name"]["en"] for tag in main_stack] == [f"Tag {n}" for n in range(7)]
    assert {tag["kind"] for tag in main_stack} == {
        Tag.Kind.SKILL,
        Tag.Kind.TOOL,
        Tag.Kind.METHODOLOGY,
    }


def test_main_stack_shows_a_tag_that_no_project_carries(api_client):
    """The choice does not depend on a visible project using the tag."""
    make_profile()
    tag = Methodology.objects.create(
        name_en="Scrum", name_fr="Scrum", main_stack_position=0
    )

    response = api_client.get(URL)

    assert [entry["id"] for entry in response.json()["main_stack"]] == [tag.id]


def test_main_stack_adds_one_query_however_many_tags(
    api_client, django_assert_num_queries
):
    """The profile and its tags: two queries."""
    make_profile()
    for position in range(4):
        Skill.objects.create(
            name_en=f"Tag {position}",
            name_fr=f"Tag {position}",
            main_stack_position=position,
        )

    with django_assert_num_queries(2):
        response = api_client.get(URL)

    assert response.status_code == 200
