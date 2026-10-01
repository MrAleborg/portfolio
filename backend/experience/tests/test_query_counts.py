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
    Education,
    Methodology,
    Mission,
    ProfessionalExperience,
    Project,
    Skill,
    Specialization,
    Tool,
)

pytestmark = pytest.mark.django_db

# (URL basename, queries of the list, queries of the detail)
ENDPOINTS = [
    ("education", 1, 1),
    ("professionalexperience", 4, 4),
    ("project", 3, 3),
    ("certification", 3, 3),
    ("specialization", 2, 2),
    ("skill", 1, 3),
    ("tool", 1, 3),
    ("methodology", 1, 3),
]


@pytest.fixture
def portfolio():
    """Several entries of every kind, each with related rows; return one pk
    per endpoint."""
    tags = [
        model.objects.create(name_en=f"{model.KIND}", name_fr=f"{model.KIND}")
        for model in (Skill, Tool, Methodology)
    ]
    for number in range(3):
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
        for project_number in range(2):
            project = Project.objects.create(
                title_en="Portfolio",
                title_fr="Portfolio",
                start_date=date(2024, 1, 1),
                experience=experience if project_number else None,
            )
            project.tags.add(*tags)
            Mission.objects.create(
                project=project, description_en="Build it", description_fr="Construire"
            )
        certification = Certification.objects.create(
            name_en="PCAP",
            name_fr="PCAP",
            issuer="Python Institute",
            issue_date=date(2024, 1, 1),
        )
        certification.tags.add(*tags)
        specialization = Specialization.objects.create(
            name_en="Python Path",
            name_fr="Parcours Python",
            issuer="Python Institute",
            issue_date=date(2024, 1, 1),
        )
        specialization.certifications.add(certification)
    return {
        "education": Education.objects.first().pk,
        "professionalexperience": ProfessionalExperience.objects.first().pk,
        "project": Project.objects.first().pk,
        "certification": Certification.objects.first().pk,
        "specialization": Specialization.objects.first().pk,
        "skill": tags[0].pk,
        "tool": tags[1].pk,
        "methodology": tags[2].pk,
    }


@pytest.mark.parametrize(
    ("basename", "queries"),
    [(basename, queries) for basename, queries, _ in ENDPOINTS],
)
def test_list_runs_a_fixed_number_of_queries(
    api_client, django_assert_num_queries, portfolio, basename, queries
):
    with django_assert_num_queries(queries):
        response = api_client.get(reverse(f"experience:{basename}-list"))

    assert response.status_code == 200


@pytest.mark.parametrize(
    ("basename", "queries"),
    [(basename, queries) for basename, _, queries in ENDPOINTS],
)
def test_detail_runs_a_fixed_number_of_queries(
    api_client, django_assert_num_queries, portfolio, basename, queries
):
    url = reverse(f"experience:{basename}-detail", args=[portfolio[basename]])

    with django_assert_num_queries(queries):
        response = api_client.get(url)

    assert response.status_code == 200
