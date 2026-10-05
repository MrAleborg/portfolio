"""Tests for the public tag category tree.

Route: ``/api/v1/experience/tag-categories/`` (list only). It returns the
domains (top-level categories), each with its categories, each with its tags.
Categorizing a tag is an explicit choice to publish it, so unlike the tag
endpoints it ignores the visibility of the entries that use the tag.
"""

from datetime import date

import pytest

from experience.models import Project, Skill, TagCategory, Tool

pytestmark = pytest.mark.django_db

URL = "/api/v1/experience/tag-categories/"


def make_category(name, parent=None, position=0):
    return TagCategory.objects.create(
        name_en=name, name_fr=f"{name} fr", parent=parent, position=position
    )


def make_tag(name, *categories, model=Skill, **fields):
    tag = model.objects.create(name_en=name, name_fr=f"{name} fr", **fields)
    tag.categories.add(*categories)
    return tag


def test_list_is_empty_without_categories(api_client):
    response = api_client.get(URL)

    assert response.status_code == 200
    assert response.json() == []


def test_list_nests_domains_categories_and_tags(api_client):
    domain = make_category("AI")
    category = make_category("GenAI", parent=domain)
    tag = make_tag("LLMs", category, note_en="Daily", note_fr="Au quotidien")

    response = api_client.get(URL)

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": domain.id,
            "name": {"en": "AI", "fr": "AI fr"},
            "children": [
                {
                    "id": category.id,
                    "name": {"en": "GenAI", "fr": "GenAI fr"},
                    "tags": [
                        {
                            "id": tag.id,
                            "name": {"en": "LLMs", "fr": "LLMs fr"},
                            "kind": tag.kind,
                            "note": {"en": "Daily", "fr": "Au quotidien"},
                        }
                    ],
                }
            ],
        }
    ]


def test_note_is_empty_in_every_language_when_unset(api_client):
    category = make_category("GenAI", parent=make_category("AI"))
    make_tag("LLMs", category)

    tag = api_client.get(URL).json()[0]["children"][0]["tags"][0]

    assert tag["note"] == {"en": "", "fr": ""}


def test_domains_are_ordered_by_position_then_name(api_client):
    make_category("Beta", position=1)
    make_category("Alpha", position=1)
    make_category("Gamma", position=0)

    names = [domain["name"]["en"] for domain in api_client.get(URL).json()]

    assert names == ["Gamma", "Alpha", "Beta"]


def test_categories_are_ordered_by_position_then_name(api_client):
    domain = make_category("AI")
    make_category("Beta", parent=domain, position=1)
    make_category("Alpha", parent=domain, position=1)
    make_category("Gamma", parent=domain, position=0)

    children = api_client.get(URL).json()[0]["children"]

    assert [child["name"]["en"] for child in children] == ["Gamma", "Alpha", "Beta"]


def test_tags_are_ordered_by_name_whatever_their_kind(api_client):
    category = make_category("GenAI", parent=make_category("AI"))
    make_tag("Beta", category, model=Skill)
    make_tag("Alpha", category, model=Tool)

    tags = api_client.get(URL).json()[0]["children"][0]["tags"]

    assert [tag["name"]["en"] for tag in tags] == ["Alpha", "Beta"]


def test_only_domains_are_at_the_top_level(api_client):
    domain = make_category("AI")
    make_category("GenAI", parent=domain)

    response = api_client.get(URL)

    assert [item["id"] for item in response.json()] == [domain.id]


def test_a_domain_without_categories_and_a_category_without_tags_are_listed_empty(
    api_client,
):
    make_category("Empty domain")
    domain = make_category("AI")
    make_category("Empty category", parent=domain)

    domains = {item["name"]["en"]: item for item in api_client.get(URL).json()}

    assert domains["Empty domain"]["children"] == []
    assert domains["AI"]["children"][0]["tags"] == []


def test_a_tag_in_two_categories_is_listed_under_both(api_client):
    domain = make_category("AI")
    genai = make_category("GenAI", parent=domain, position=0)
    mlops = make_category("MLOps", parent=domain, position=1)
    tag = make_tag("Docker", genai, mlops)

    children = api_client.get(URL).json()[0]["children"]

    assert [[t["id"] for t in child["tags"]] for child in children] == [
        [tag.id],
        [tag.id],
    ]


def test_a_tag_used_only_by_a_hidden_project_is_still_listed(api_client):
    category = make_category("GenAI", parent=make_category("AI"))
    tag = make_tag("LLMs", category)
    hidden = Project.objects.create(
        title_en="Secret",
        title_fr="Secret",
        start_date=date(2024, 1, 1),
        is_visible=False,
    )
    hidden.tags.add(tag)

    tags = api_client.get(URL).json()[0]["children"][0]["tags"]

    assert [t["id"] for t in tags] == [tag.id]


@pytest.mark.parametrize("method", ["post", "put", "patch", "delete"])
def test_list_is_read_only(api_client, method):
    response = getattr(api_client, method)(URL)

    assert response.status_code == 405
