"""Tests for the whole-resume endpoint.

Route: ``/api/v1/resume/``. It returns the profile and every public section in
one response, each section exactly as its own list endpoint returns it
(unpaginated, hidden entries left out). List filters are ignored, and write
methods are rejected.
"""

from datetime import date

import pytest
from django.urls import reverse

from experience.models import (
    Certification,
    Commitment,
    Education,
    Hobby,
    Methodology,
    ProfessionalExperience,
    Project,
    ScientificCommunication,
    Skill,
    Specialization,
    TagCategory,
    Tool,
)
from owner.models import Profile

pytestmark = pytest.mark.django_db

URL = "/api/v1/resume/"

# (key in the resume, list endpoint it mirrors), in response order.
SECTIONS = [
    ("education", "experience:education-list"),
    ("certifications", "experience:certification-list"),
    ("professional_experiences", "experience:professionalexperience-list"),
    ("projects", "experience:project-list"),
    ("specializations", "experience:specialization-list"),
    ("skills", "experience:skill-list"),
    ("tools", "experience:tool-list"),
    ("methodologies", "experience:methodology-list"),
    ("tag_categories", "experience:tag-category-list"),
    ("hobbies", "experience:hobby-list"),
    ("commitments", "experience:commitment-list"),
    ("scientific_communications", "experience:scientific-communication-list"),
]
KEYS = ["profile", *(key for key, _ in SECTIONS)]


@pytest.fixture
def resume_data():
    """Visible and hidden entries of every kind, and tags that only hidden
    entries use. Return the skill used by one visible project only."""
    skill = Skill.objects.create(name_en="Python", name_fr="Python")
    only_hidden_skill = Skill.objects.create(name_en="COBOL", name_fr="COBOL")
    tool = Tool.objects.create(name_en="Docker", name_fr="Docker")
    only_hidden_tool = Tool.objects.create(name_en="Fortran", name_fr="Fortran")
    methodology = Methodology.objects.create(name_en="TDD", name_fr="TDD")

    for is_visible in (True, False):
        Education.objects.create(
            institution="University",
            degree_en="MSc",
            degree_fr="Master",
            start_date=date(2020, 9, 1),
            is_visible=is_visible,
        )
        Hobby.objects.create(
            name_en="Climbing", name_fr="Escalade", is_visible=is_visible
        )
        Commitment.objects.create(
            organization="Red Cross",
            role_en="Volunteer",
            role_fr="Bénévole",
            start_date=date(2020, 1, 1),
            is_visible=is_visible,
        )
        ScientificCommunication.objects.create(
            title_en="Static analysis",
            title_fr="Analyse statique",
            authors="A. Lovelace",
            kind="talk",
            venue="PyCon",
            date=date(2024, 5, 1),
            is_visible=is_visible,
        )
        experience = ProfessionalExperience.objects.create(
            company="Acme",
            position_en="Developer",
            position_fr="Développeur",
            start_date=date(2020, 1, 1),
            is_visible=is_visible,
        )
        certification = Certification.objects.create(
            name_en="PCAP",
            name_fr="PCAP",
            issuer="Python Institute",
            issue_date=date(2024, 1, 1),
            is_visible=is_visible,
        )
        specialization = Specialization.objects.create(
            name_en="Python Path",
            name_fr="Parcours Python",
            issuer="Python Institute",
            issue_date=date(2024, 1, 1),
            is_visible=is_visible,
        )
        specialization.certifications.add(certification)
        certification.tags.add(tool if is_visible else only_hidden_tool)
        project = Project.objects.create(
            title_en="Portfolio",
            title_fr="Portfolio",
            start_date=date(2024, 1, 1),
            experience=experience,
            is_visible=is_visible,
        )
        project.tags.add(skill if is_visible else only_hidden_skill, methodology)
    side_project = Project.objects.create(
        title_en="Side",
        title_fr="Annexe",
        start_date=date(2023, 1, 1),
    )
    side_project.tags.add(methodology)
    domain = TagCategory.objects.create(name_en="Domain", name_fr="Domaine")
    category = TagCategory.objects.create(
        name_en="Category", name_fr="Catégorie", parent=domain
    )
    category.tags.add(skill)
    return {"skill": skill, "experience": ProfessionalExperience.objects.first()}


def test_route():
    """The URL name resolves to the agreed path."""
    assert reverse("resume") == URL


def test_anonymous_gets_the_profile_and_every_section(api_client):
    response = api_client.get(URL)

    assert response.status_code == 200
    assert list(response.json()) == KEYS


@pytest.mark.parametrize(("key", "list_name"), SECTIONS)
def test_section_is_what_its_list_endpoint_returns(
    api_client, resume_data, key, list_name
):
    """Hidden entries, and tags used only by hidden entries, are left out
    exactly as in the list endpoint."""
    expected = api_client.get(reverse(list_name)).json()

    response = api_client.get(URL)

    assert response.json()[key] == expected


def test_hidden_entries_and_their_tags_are_absent(api_client, resume_data):
    """Guards the fixture: the sections are not trivially empty, and the
    hidden rows exist in the database."""
    sections = api_client.get(URL).json()

    assert Skill.objects.count() == 2
    assert [skill["name"]["en"] for skill in sections["skills"]] == ["Python"]
    assert [tool["name"]["en"] for tool in sections["tools"]] == ["Docker"]
    assert Education.objects.count() == 2
    assert len(sections["education"]) == 1
    assert len(sections["projects"]) == 2


def test_profile_is_null_without_a_profile(api_client):
    response = api_client.get(URL)

    assert response.status_code == 200
    assert response.json()["profile"] is None


def test_profile_is_serialized_when_it_exists(api_client):
    Profile.objects.create(
        full_name="Ada Lovelace",
        headline_en="Analyst",
        headline_fr="Analyste",
        bio_en="I write programs.",
        bio_fr="J’écris des programmes.",
    )

    response = api_client.get(URL)

    assert response.json()["profile"] == {
        "full_name": "Ada Lovelace",
        "headline": {"en": "Analyst", "fr": "Analyste"},
        "bio": {"en": "I write programs.", "fr": "J’écris des programmes."},
    }


@pytest.mark.parametrize(
    "query",
    [
        "tag={skill}",
        "side_project=true",
        "experience={experience}",
        "tag=python",  # not an id: a list endpoint would answer 400
    ],
)
def test_list_filters_are_ignored(api_client, resume_data, query):
    unfiltered = api_client.get(URL).json()
    query = query.format(
        skill=resume_data["skill"].pk, experience=resume_data["experience"].pk
    )

    response = api_client.get(f"{URL}?{query}")

    assert response.status_code == 200
    assert response.json() == unfiltered


@pytest.mark.parametrize("method", ["post", "put", "patch", "delete"])
def test_resume_is_read_only(api_client, method):
    response = getattr(api_client, method)(URL)

    assert response.status_code == 405
