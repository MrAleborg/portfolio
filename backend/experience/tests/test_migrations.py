"""Tests for the data migrations: existing content survives schema changes.

Each test migrates back to the state before the migration, creates rows with
the historical models, migrates forward and checks the rows.
"""

from datetime import date

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

pytestmark = pytest.mark.django_db(transaction=True)


@pytest.fixture
def migrate():
    """Migrate the experience app to a migration; return its historical apps.

    Restores the latest schema afterwards so other tests are unaffected.
    """
    executor = MigrationExecutor(connection)

    def migrate_to(name):
        target = [("experience", name)]
        executor.loader.build_graph()
        executor.migrate(target)
        return executor.loader.project_state(target).apps

    yield migrate_to
    executor.loader.build_graph()
    executor.migrate(executor.loader.graph.leaf_nodes())


def test_education_texts_are_copied_to_every_language(migrate):
    """Existing texts become the English and the French text, to be translated."""
    old_apps = migrate("0002_date_constraints")
    old_apps.get_model("experience", "Education").objects.create(
        institution="Université de Rennes",
        degree="Master",
        field_of_study="Computer Science",
        location="Rennes",
        start_date=date(2015, 9, 1),
    )

    new_apps = migrate("0003_localized_education")

    education = new_apps.get_model("experience", "Education").objects.get()
    assert education.institution == "Université de Rennes"
    assert (education.degree_en, education.degree_fr) == ("Master", "Master")
    assert (education.field_of_study_en, education.field_of_study_fr) == (
        "Computer Science",
        "Computer Science",
    )
    assert (education.grade_en, education.grade_fr) == ("", "")
    assert (education.location_en, education.location_fr) == ("Rennes", "Rennes")


def test_experience_texts_are_copied_to_every_language(migrate):
    old_apps = migrate("0003_localized_education")
    old_apps.get_model("experience", "ProfessionalExperience").objects.create(
        company="Acme",
        position="Developer",
        start_date=date(2020, 1, 1),
    )

    new_apps = migrate("0004_localized_experience")

    experience = new_apps.get_model(
        "experience", "ProfessionalExperience"
    ).objects.get()
    assert experience.company == "Acme"
    assert (experience.position_en, experience.position_fr) == (
        "Developer",
        "Developer",
    )
    assert (experience.location_en, experience.location_fr) == ("", "")


def test_project_texts_are_copied_to_every_language(migrate):
    """Titles and missions get a column per language; each achievement becomes
    a text in every language."""
    old_apps = migrate("0004_localized_experience")
    project = old_apps.get_model("experience", "Project").objects.create(
        title="Portfolio",
        achievements=["Shipped on time"],
        start_date=date(2024, 1, 1),
    )
    old_apps.get_model("experience", "Mission").objects.create(
        project=project, description="Build it"
    )

    new_apps = migrate("0005_localized_project")

    project = new_apps.get_model("experience", "Project").objects.get()
    assert (project.title_en, project.title_fr) == ("Portfolio", "Portfolio")
    assert project.achievements == [{"en": "Shipped on time", "fr": "Shipped on time"}]
    mission = new_apps.get_model("experience", "Mission").objects.get()
    assert (mission.description_en, mission.description_fr) == (
        "Build it",
        "Build it",
    )


def test_names_are_copied_to_every_language(migrate):
    """Credential and tag names get a column per language."""
    old_apps = migrate("0005_localized_project")
    for model in ("Certification", "Specialization"):
        old_apps.get_model("experience", model).objects.create(
            name="PCAP", issuer="Python Institute", issue_date=date(2024, 1, 1)
        )
    old_apps.get_model("experience", "Tag").objects.create(name="Python", kind="skill")

    new_apps = migrate("0006_localized_names")

    expected = {"Certification": "PCAP", "Specialization": "PCAP", "Tag": "Python"}
    for model, name in expected.items():
        entry = new_apps.get_model("experience", model).objects.get()
        assert (entry.name_en, entry.name_fr) == (name, name)


DESCRIBED_ROWS = {
    "Education": {
        "institution": "University",
        "degree_en": "MSc",
        "degree_fr": "MSc",
        "start_date": date(2020, 9, 1),
    },
    "ProfessionalExperience": {
        "company": "Acme",
        "position_en": "Developer",
        "position_fr": "Developer",
        "start_date": date(2020, 1, 1),
    },
    "Project": {
        "title_en": "Portfolio",
        "title_fr": "Portfolio",
        "start_date": date(2024, 1, 1),
    },
    "Certification": {
        "name_en": "PCAP",
        "name_fr": "PCAP",
        "issuer": "Python Institute",
        "issue_date": date(2024, 1, 1),
    },
    "Specialization": {
        "name_en": "Python Path",
        "name_fr": "Python Path",
        "issuer": "Python Institute",
        "issue_date": date(2024, 1, 1),
    },
}


def test_descriptions_are_copied_to_every_language(migrate):
    """Every entry's description gets a column per language."""
    old_apps = migrate("0006_localized_names")
    for model, fields in DESCRIBED_ROWS.items():
        old_apps.get_model("experience", model).objects.create(
            description=f"About {model}", **fields
        )

    new_apps = migrate("0007_localized_descriptions")

    for model in DESCRIBED_ROWS:
        entry = new_apps.get_model("experience", model).objects.get()
        assert (entry.description_en, entry.description_fr) == (
            f"About {model}",
            f"About {model}",
        )
