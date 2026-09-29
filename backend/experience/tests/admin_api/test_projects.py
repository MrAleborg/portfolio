"""Tests for the admin project endpoints.

Routes: ``projects/`` (list, create) and ``projects/{id}/`` (retrieve, update,
partial update, delete) under ``/api/v1/admin/``. Relations are written by
id: ``experience`` (``null`` for a side project) and ``tags`` (any kind).
``missions`` is a list of strings: sending it replaces every mission, in the
order sent; leaving it out keeps them.
"""

from datetime import date

import pytest
from django.urls import reverse

from experience.models import (
    Methodology,
    Mission,
    ProfessionalExperience,
    Project,
    Skill,
    Tool,
)
from experience.tests.admin_api.helpers import (
    detail_url,
    list_url,
    listed_ids,
    timestamps,
)

pytestmark = pytest.mark.django_db

LIST_URL = list_url("project")


def make_experience(**kwargs):
    """Create a professional experience; only pass the fields the test cares about."""
    fields = {
        "company": "Acme",
        "position_en": "Developer",
        "position_fr": "Développeur",
        "start_date": date(2020, 1, 1),
    }
    fields.update(kwargs)
    return ProfessionalExperience.objects.create(**fields)


def make_project(**kwargs):
    """Create a side project by default; pass experience= for a work project."""
    fields = {
        "title_en": "Portfolio",
        "title_fr": "Portfolio",
        "start_date": date(2024, 1, 1),
    }
    fields.update(kwargs)
    return Project.objects.create(**fields)


def both(text):
    """The same text in every language, for tests about something else."""
    return {"en": text, "fr": text}


def make_missions(project, *descriptions):
    """Create missions; each description is used in every language."""
    for order, description in enumerate(descriptions):
        Mission.objects.create(
            project=project,
            description_en=description,
            description_fr=description,
            display_order=order,
        )


def mission_list(project):
    """The English description of each mission, in display order."""
    return list(project.missions.values_list("description_en", flat=True))


def test_routes():
    """URL names resolve to the agreed paths (other tests only use the names)."""
    assert LIST_URL == "/api/v1/admin/projects/"
    assert detail_url("project", 1) == "/api/v1/admin/projects/1/"


def test_list_includes_hidden_projects(staff_api_client):
    """Hidden projects, and projects of hidden experiences, are listed."""
    visible = make_project(display_order=0)
    hidden = make_project(is_visible=False, display_order=1)
    of_hidden_experience = make_project(
        experience=make_experience(is_visible=False), display_order=2
    )

    response = staff_api_client.get(LIST_URL)

    assert response.status_code == 200
    assert listed_ids(response) == [visible.id, hidden.id, of_hidden_experience.id]


def test_detail_returns_every_field(staff_api_client):
    """Relations come back as ids; missions are texts in every language."""
    experience = make_experience()
    project = make_project(
        experience=experience,
        title_en="Billing API",
        title_fr="API de facturation",
        start_date=date(2021, 3, 1),
        end_date=date(2022, 6, 30),
        description_en="Rewrote billing.",
        description_fr="Refonte de la facturation.",
        achievements=[
            {"en": "Cut invoice time by 80%", "fr": "Facturation 80 % plus rapide"}
        ],
        display_order=4,
        is_visible=False,
    )
    Mission.objects.create(
        project=project, description_en="First", description_fr="Première"
    )
    skill = Skill.objects.create(name_en="Python", name_fr="Python")
    tool = Tool.objects.create(name_en="Django", name_fr="Django")
    project.tags.add(tool, skill)

    response = staff_api_client.get(detail_url("project", project.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": project.id,
        "title": {"en": "Billing API", "fr": "API de facturation"},
        "start_date": "2021-03-01",
        "end_date": "2022-06-30",
        "is_current": False,
        "description": {"en": "Rewrote billing.", "fr": "Refonte de la facturation."},
        "achievements": [
            {"en": "Cut invoice time by 80%", "fr": "Facturation 80 % plus rapide"}
        ],
        "experience": experience.id,
        "missions": [{"en": "First", "fr": "Première"}],
        "tags": [skill.id, tool.id],
        "display_order": 4,
        "is_visible": False,
        **timestamps(project),
    }


def test_create_side_project_with_required_fields_only(staff_api_client):
    """Without an experience it is a side project; lists default to empty."""
    response = staff_api_client.post(
        LIST_URL,
        {"title": {"en": "Portfolio", "fr": "Portfolio"}, "start_date": "2024-01-01"},
        format="json",
    )

    assert response.status_code == 201
    project = Project.objects.get()
    assert project.experience is None
    body = response.json()
    assert body["id"] == project.id
    assert body["experience"] is None
    assert (body["tags"], body["missions"], body["achievements"]) == ([], [], [])


def test_create_work_project_with_relations_and_missions(staff_api_client):
    """Everything the admin edits on a project can be sent in one request."""
    experience = make_experience()
    skill = Skill.objects.create(name_en="Python", name_fr="Python")
    methodology = Methodology.objects.create(name_en="Scrum", name_fr="Scrum")

    response = staff_api_client.post(
        LIST_URL,
        {
            "title": {"en": "Billing API", "fr": "API de facturation"},
            "start_date": "2021-03-01",
            "experience": experience.id,
            "tags": [skill.id, methodology.id],
            "missions": [
                {"en": "Design the API", "fr": "Concevoir l'API"},
                {"en": "Write the tests", "fr": "Écrire les tests"},
            ],
            "achievements": [{"en": "Shipped on time", "fr": "Livré à temps"}],
        },
        format="json",
    )

    assert response.status_code == 201
    project = Project.objects.get()
    assert (project.title_en, project.title_fr) == ("Billing API", "API de facturation")
    assert project.experience == experience
    assert set(project.tags.all()) == {skill, methodology}
    assert project.achievements == [{"en": "Shipped on time", "fr": "Livré à temps"}]
    assert list(project.missions.values_list("description_en", "description_fr")) == [
        ("Design the API", "Concevoir l'API"),
        ("Write the tests", "Écrire les tests"),
    ]
    assert response.json()["missions"] == [
        {"en": "Design the API", "fr": "Concevoir l'API"},
        {"en": "Write the tests", "fr": "Écrire les tests"},
    ]


def test_create_without_required_fields_is_a_bad_request(staff_api_client):
    """Each missing required field is reported."""
    response = staff_api_client.post(LIST_URL, {}, format="json")

    assert response.status_code == 400
    assert set(response.json()) == {"title", "start_date"}


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("experience", 999),
        ("tags", [999]),
        ("missions", both("Design the API")),
        ("missions", ["Design the API"]),
        ("missions", [{"en": "Design the API", "fr": ""}]),
        ("achievements", both("Shipped on time")),
        ("achievements", ["Shipped on time"]),
        ("achievements", [{"en": "Shipped on time"}]),
        ("achievements", [{"award": "Innovation"}]),
    ],
    ids=[
        "unknown experience",
        "unknown tag",
        "missions not a list",
        "mission not translated",
        "mission blank in a language",
        "achievements not a list",
        "achievement not translated",
        "achievement missing a language",
        "achievement with unknown keys",
    ],
)
def test_create_with_invalid_value_is_a_bad_request(staff_api_client, field, value):
    """Relations must exist; missions and achievements are lists of texts in
    every language."""
    response = staff_api_client.post(
        LIST_URL,
        {
            "title": {"en": "Portfolio", "fr": "Portfolio"},
            "start_date": "2024-01-01",
            field: value,
        },
        format="json",
    )

    assert response.status_code == 400
    assert list(response.json()) == [field]
    assert not Project.objects.exists()


def test_update_with_missions_replaces_them_in_the_sent_order(staff_api_client):
    """Sending missions rewrites them, so reordering is just sending a new list."""
    project = make_project()
    make_missions(project, "First", "Second", "Dropped")

    response = staff_api_client.patch(
        detail_url("project", project.id),
        {"missions": [both("Second"), both("First"), both("New")]},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["missions"] == [both("Second"), both("First"), both("New")]
    assert mission_list(project) == ["Second", "First", "New"]
    assert list(project.missions.values_list("display_order", flat=True)) == [0, 1, 2]


def test_update_with_empty_missions_removes_them(staff_api_client):
    """An empty list clears the missions."""
    project = make_project()
    make_missions(project, "First")

    staff_api_client.patch(
        detail_url("project", project.id), {"missions": []}, format="json"
    )

    assert not Mission.objects.exists()


def test_partial_update_without_missions_or_tags_keeps_them(staff_api_client):
    """PATCHing another field leaves the relations alone."""
    project = make_project()
    make_missions(project, "First")
    tag = Skill.objects.create(name_en="Python", name_fr="Python")
    project.tags.add(tag)

    response = staff_api_client.patch(
        detail_url("project", project.id), {"title": both("Renamed")}, format="json"
    )

    assert response.status_code == 200
    assert mission_list(project) == ["First"]
    assert list(project.tags.all()) == [tag]


def test_update_replaces_tags_and_can_detach_the_experience(staff_api_client):
    """PUT sets the tags to the sent list; experience null makes a side project."""
    project = make_project(experience=make_experience())
    old = Skill.objects.create(name_en="Python", name_fr="Python")
    new = Tool.objects.create(name_en="Django", name_fr="Django")
    project.tags.add(old)

    response = staff_api_client.put(
        detail_url("project", project.id),
        {
            "title": {"en": "Portfolio", "fr": "Portfolio"},
            "start_date": "2024-01-01",
            "experience": None,
            "tags": [new.id],
        },
        format="json",
    )

    assert response.status_code == 200
    project.refresh_from_db()
    assert project.experience is None
    assert list(project.tags.all()) == [new]


def test_invalid_update_changes_nothing(staff_api_client):
    """A rejected request leaves the project and its missions untouched."""
    project = make_project()
    make_missions(project, "First")

    response = staff_api_client.patch(
        detail_url("project", project.id),
        {"title": both("Renamed"), "missions": [both("Ok"), {"en": "", "fr": ""}]},
        format="json",
    )

    assert response.status_code == 400
    project.refresh_from_db()
    assert project.title_en == "Portfolio"
    assert mission_list(project) == ["First"]


def test_delete_removes_the_project_and_its_missions(staff_api_client):
    """DELETE answers 204; missions go with their project, tags stay."""
    project = make_project()
    make_missions(project, "First")
    project.tags.add(Skill.objects.create(name_en="Python", name_fr="Python"))

    response = staff_api_client.delete(detail_url("project", project.id))

    assert response.status_code == 204
    assert not Project.objects.exists()
    assert not Mission.objects.exists()
    assert Skill.objects.exists()


def test_hiding_a_project_hides_it_from_the_public_api(staff_api_client, api_client):
    """Edits made in the admin API are what the public site shows."""
    project = make_project()

    staff_api_client.patch(
        detail_url("project", project.id), {"is_visible": False}, format="json"
    )
    response = api_client.get(reverse("experience:project-detail", args=[project.id]))

    assert response.status_code == 404


def test_detail_of_missing_project_is_not_found(staff_api_client):
    """An unknown id answers 404."""
    response = staff_api_client.get(detail_url("project", 999))

    assert response.status_code == 404
