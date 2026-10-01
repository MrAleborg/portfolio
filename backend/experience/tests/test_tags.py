"""Tests for the read-only tag endpoints: skills, tools and methodologies.

Routes: ``skills/``, ``tools/`` and ``methodologies/`` (list) and their
``{id}/`` detail under ``/api/v1/experience/``. The three kinds behave the
same, so every test runs once per kind through the ``route`` fixture.
"""

from datetime import date

import pytest
from django.urls import reverse

from experience.models import (
    Certification,
    Methodology,
    ProfessionalExperience,
    Project,
    Skill,
    Tool,
)

pytestmark = pytest.mark.django_db

# (URL basename, path segment, proxy model) for each tag kind.
TAG_ROUTES = [
    ("skill", "skills", Skill),
    ("tool", "tools", Tool),
    ("methodology", "methodologies", Methodology),
]


@pytest.fixture(params=TAG_ROUTES, ids=[route[0] for route in TAG_ROUTES])
def route(request):
    """Run the test once for each tag kind."""
    return request.param


def list_url(basename):
    return reverse(f"experience:{basename}-list")


def detail_url(basename, pk):
    return reverse(f"experience:{basename}-detail", args=[pk])


def make_project(**kwargs):
    """Create a project; only pass the fields the test cares about."""
    fields = {
        "title_en": "Portfolio",
        "title_fr": "Portfolio",
        "start_date": date(2024, 1, 1),
    }
    fields.update(kwargs)
    return Project.objects.create(**fields)


def make_certification(**kwargs):
    """Create a certification; only pass the fields the test cares about."""
    fields = {
        "name_en": "AWS SAA",
        "name_fr": "AWS SAA",
        "issuer": "AWS",
        "issue_date": date(2024, 1, 1),
    }
    fields.update(kwargs)
    return Certification.objects.create(**fields)


def test_routes(route):
    """URL names resolve to the agreed paths (other tests only use the names)."""
    basename, segment, _ = route

    assert list_url(basename) == f"/api/v1/experience/{segment}/"
    assert detail_url(basename, 1) == f"/api/v1/experience/{segment}/1/"


def test_list_is_empty_without_tags(api_client, route):
    """The list answers with a plain JSON list, without pagination envelope."""
    basename, _, _ = route

    response = api_client.get(list_url(basename))

    assert response.status_code == 200
    assert response.json() == []


def test_list_only_returns_tags_of_its_kind_ordered_by_name(api_client, route):
    """A route lists only its own kind, sorted by name, as {id, name}.

    kind is not returned: the route already tells it.
    """
    basename, _, model = route
    b = model.objects.create(name_en="B", name_fr="B")
    a = model.objects.create(name_en="A", name_fr="A")
    project = make_project()
    project.tags.add(a, b)
    for other in (Skill, Tool, Methodology):
        if other is not model:
            project.tags.add(other.objects.create(name_en="Other", name_fr="Other"))

    response = api_client.get(list_url(basename))

    assert response.json() == [
        {"id": a.id, "name": {"en": "A", "fr": "A"}},
        {"id": b.id, "name": {"en": "B", "fr": "B"}},
    ]


def test_list_only_returns_tags_used_by_a_visible_project_or_certification(
    api_client, route
):
    """Tags that only tag hidden entries, or nothing, stay out of the list.

    A project of a hidden experience is hidden, and a tag used by several
    visible entries is listed once.
    """
    basename, _, model = route
    hidden_experience = ProfessionalExperience.objects.create(
        company="Secret Corp",
        position_en="Developer",
        position_fr="Développeur",
        start_date=date(2020, 1, 1),
        is_visible=False,
    )
    used = {
        name: model.objects.create(name_en=name, name_fr=name)
        for name in ("project", "certification", "both")
    }
    unused = {
        name: model.objects.create(name_en=name, name_fr=name)
        for name in ("untagged", "hidden project", "hidden job", "hidden cert")
    }
    make_project().tags.add(used["project"], used["both"])
    make_project().tags.add(used["both"])
    make_certification().tags.add(used["certification"], used["both"])
    make_project(is_visible=False).tags.add(unused["hidden project"])
    make_project(experience=hidden_experience).tags.add(unused["hidden job"])
    make_certification(is_visible=False).tags.add(unused["hidden cert"])

    response = api_client.get(list_url(basename))

    assert [tag["name"]["en"] for tag in response.json()] == [
        "both",
        "certification",
        "project",
    ]


def test_detail_returns_visible_projects_and_certifications(api_client, route):
    """The detail lists what is tagged with it ("everything about Python").

    Related entries are short summaries; hidden and untagged ones are left out.
    """
    basename, _, model = route
    tag = model.objects.create(
        name_en="Project management", name_fr="Gestion de projet"
    )
    project = make_project(title_en="Portfolio", title_fr="Portefolio")
    hidden_project = make_project(
        title_en="Secret", title_fr="Secret", is_visible=False
    )
    certification = make_certification(name_en="PCAP", name_fr="PCAP")
    hidden_certification = make_certification(
        name_en="Old", name_fr="Old", is_visible=False
    )
    for entry in (project, hidden_project, certification, hidden_certification):
        entry.tags.add(tag)
    make_project(title_en="Untagged", title_fr="Untagged")

    response = api_client.get(detail_url(basename, tag.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": tag.id,
        "name": {"en": "Project management", "fr": "Gestion de projet"},
        "projects": [
            {"id": project.id, "title": {"en": "Portfolio", "fr": "Portefolio"}}
        ],
        "certifications": [
            {"id": certification.id, "name": {"en": "PCAP", "fr": "PCAP"}}
        ],
    }


def test_detail_hides_projects_of_invisible_experiences(api_client, route):
    """Hiding an experience hides its projects here too, as on projects/."""
    basename, _, model = route
    tag = model.objects.create(name_en="Python", name_fr="Python")
    hidden_experience = ProfessionalExperience.objects.create(
        company="Secret Corp",
        position_en="Developer",
        position_fr="Développeur",
        start_date=date(2020, 1, 1),
        is_visible=False,
    )
    hidden_job_project = make_project(
        title_en="Hidden job", title_fr="Hidden job", experience=hidden_experience
    )
    side_project = make_project(title_en="Side", title_fr="Side")
    for entry in (hidden_job_project, side_project):
        entry.tags.add(tag)

    response = api_client.get(detail_url(basename, tag.id))

    assert response.json()["projects"] == [
        {"id": side_project.id, "title": {"en": "Side", "fr": "Side"}}
    ]


def test_detail_of_tag_used_only_by_hidden_entries_is_not_found(api_client, route):
    """As in the list, a tag that only tags hidden entries (or nothing) does
    not exist for visitors, so its name cannot be read by guessing ids."""
    basename, _, model = route
    hidden_project_tag = model.objects.create(name_en="Secret", name_fr="Secret")
    hidden_certification_tag = model.objects.create(name_en="Old", name_fr="Old")
    unused_tag = model.objects.create(name_en="Unused", name_fr="Unused")
    make_project(is_visible=False).tags.add(hidden_project_tag)
    make_certification(is_visible=False).tags.add(hidden_certification_tag)

    responses = [
        api_client.get(detail_url(basename, tag.id))
        for tag in (hidden_project_tag, hidden_certification_tag, unused_tag)
    ]

    assert [response.status_code for response in responses] == [404, 404, 404]


def test_detail_of_tag_of_another_kind_is_not_found(api_client, route):
    """skills/{id}/ does not serve a tool, even though both live in Tag."""
    basename, _, model = route
    other_model = next(m for _, _, m in TAG_ROUTES if m is not model)
    other = other_model.objects.create(name_en="Python", name_fr="Python")

    response = api_client.get(detail_url(basename, other.id))

    assert response.status_code == 404


def test_detail_of_missing_tag_is_not_found(api_client, route):
    """An unknown id answers 404."""
    basename, _, _ = route

    response = api_client.get(detail_url(basename, 999))

    assert response.status_code == 404


def test_list_is_read_only(api_client, route):
    """Tags are managed in the admin, so the API refuses creation."""
    basename, _, _ = route

    response = api_client.post(list_url(basename), {"name": "X"})

    assert response.status_code == 405


@pytest.mark.parametrize("method", ["put", "patch", "delete"])
def test_detail_is_read_only(api_client, route, method):
    """Tags are managed in the admin, so the API refuses changes."""
    basename, _, model = route
    tag = model.objects.create(name_en="Python", name_fr="Python")

    response = getattr(api_client, method)(detail_url(basename, tag.id))

    assert response.status_code == 405
