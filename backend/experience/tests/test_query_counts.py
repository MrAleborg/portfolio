"""Tests that each public endpoint runs a fixed number of queries.

The data has several entries with related rows each, so a missing
``select_related`` or ``prefetch_related`` makes the count grow with the data
and fails the test. When a count changes on purpose, update it here.
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
    Mission,
    ProfessionalExperience,
    Project,
    ScientificCommunication,
    Skill,
    Specialization,
    TagCategory,
    Tool,
)

pytestmark = pytest.mark.django_db

# (URL basename, action, number of queries)
CASES = [
    ("education", "list", 1),
    ("education", "detail", 1),
    ("professionalexperience", "list", 4),
    ("professionalexperience", "detail", 4),
    ("project", "list", 3),
    ("project", "detail", 3),
    ("certification", "list", 3),
    ("certification", "detail", 3),
    ("specialization", "list", 2),
    ("specialization", "detail", 2),
    ("skill", "list", 1),
    ("skill", "detail", 3),
    ("tool", "list", 1),
    ("tool", "detail", 3),
    ("methodology", "list", 1),
    ("methodology", "detail", 3),
    ("hobby", "list", 1),
    ("hobby", "detail", 1),
    ("commitment", "list", 1),
    ("commitment", "detail", 1),
    ("scientific-communication", "list", 1),
    ("scientific-communication", "detail", 1),
    ("tag-category", "list", 3),
]


@pytest.fixture
def portfolio():
    """Several entries of every kind, each with related rows; return one pk
    per endpoint."""
    tags = [
        model.objects.create(name_en=model.KIND, name_fr=model.KIND)
        for model in (Skill, Tool, Methodology)
    ]
    for number in range(3):
        Hobby.objects.create(name_en="Climbing", name_fr="Escalade")
        ScientificCommunication.objects.create(
            title_en="Static analysis",
            title_fr="Analyse statique",
            authors="A. Lovelace",
            kind="talk",
            venue="PyCon",
            date=date(2024, 5, 1),
        )
        Commitment.objects.create(
            organization="Red Cross",
            role_en="Volunteer",
            role_fr="Bénévole",
            start_date=date(2020, 1, 1),
        )
        Education.objects.create(
            institution="University",
            degree_en="MSc",
            degree_fr="Master",
            start_date=date(2020, 9, 1),
        )
        experience = ProfessionalExperience.objects.create(
            company=f"Acme {number}",
            position_en="Developer",
            position_fr="Développeur",
            start_date=date(2020, 1, 1),
        )
        # A domain of two categories, each holding every tag.
        domain = TagCategory.objects.create(name_en="Domain", name_fr="Domaine")
        for _ in range(2):
            category = TagCategory.objects.create(
                name_en="Category", name_fr="Catégorie", parent=domain
            )
            category.tags.add(*tags)
        # Two projects per experience, and a side project.
        for owner in (experience, experience, None):
            project = Project.objects.create(
                title_en="Portfolio",
                title_fr="Portfolio",
                start_date=date(2024, 1, 1),
                experience=owner,
            )
            project.tags.add(*tags)
            Mission.objects.create(
                project=project, description_en="Build it", description_fr="Construire"
            )
        # Two certifications, each in both of two specializations.
        certifications = [
            Certification.objects.create(
                name_en="PCAP",
                name_fr="PCAP",
                issuer="Python Institute",
                issue_date=date(2024, 1, 1),
            )
            for _ in range(2)
        ]
        for certification in certifications:
            certification.tags.add(*tags)
        for _ in range(2):
            specialization = Specialization.objects.create(
                name_en="Python Path",
                name_fr="Parcours Python",
                issuer="Python Institute",
                issue_date=date(2024, 1, 1),
            )
            specialization.certifications.add(*certifications)
    return {
        "education": Education.objects.first().pk,
        "professionalexperience": ProfessionalExperience.objects.first().pk,
        "project": Project.objects.first().pk,
        "certification": Certification.objects.first().pk,
        "specialization": Specialization.objects.first().pk,
        "skill": tags[0].pk,
        "tool": tags[1].pk,
        "methodology": tags[2].pk,
        "hobby": Hobby.objects.first().pk,
        "commitment": Commitment.objects.first().pk,
        "scientific-communication": ScientificCommunication.objects.first().pk,
    }


@pytest.mark.parametrize(("basename", "action", "queries"), CASES)
def test_endpoint_runs_a_fixed_number_of_queries(
    api_client, django_assert_num_queries, portfolio, basename, action, queries
):
    args = [portfolio[basename]] if action == "detail" else []
    url = reverse(f"experience:{basename}-{action}", args=args)

    with django_assert_num_queries(queries):
        response = api_client.get(url)

    assert response.status_code == 200


def test_resume_runs_a_fixed_number_of_queries(
    api_client, django_assert_num_queries, portfolio
):
    # The profile, plus the queries of the list endpoints it combines.
    expected = 1 + sum(queries for _, action, queries in CASES if action == "list")
    with django_assert_num_queries(expected):
        response = api_client.get("/api/v1/resume/")

    assert response.status_code == 200
