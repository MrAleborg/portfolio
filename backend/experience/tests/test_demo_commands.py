"""Tests for the demo data management commands.

- ``seed_demo`` fills an empty database with demo content for manual testing:
  every resource, plus hidden entries (an invisible project, an invisible
  experience with a project) to check that the API leaves them out. It refuses
  to run on a database that already has content.
- ``flush_demo`` deletes all portfolio content and keeps users.
- ``reset_demo`` flushes, then seeds again.

``flush_demo`` and ``reset_demo`` ask for confirmation unless ``--no-input``.
"""

import pytest
from django.contrib.auth import get_user_model
from django.core.management import CommandError, call_command
from django.urls import reverse

from experience.models import (
    Certification,
    Education,
    Mission,
    ProfessionalExperience,
    Project,
    Specialization,
    Tag,
)

pytestmark = pytest.mark.django_db

LIST_ROUTES = [
    "education",
    "professionalexperience",
    "project",
    "certification",
    "specialization",
    "skill",
    "tool",
    "methodology",
]

CONTENT_MODELS = [
    Education,
    ProfessionalExperience,
    Project,
    Mission,
    Certification,
    Specialization,
    Tag,
]


def run(command, *args, **options):
    call_command(command, *args, stdout=None, **options)


def make_admin():
    return get_user_model().objects.create_user(username="admin", password="pw")


@pytest.mark.parametrize("basename", LIST_ROUTES)
def test_seed_fills_every_list(api_client, basename):
    """Each endpoint returns something to look at."""
    run("seed_demo")

    response = api_client.get(reverse(f"experience:{basename}-list"))

    assert response.status_code == 200
    assert response.json()


def test_seed_creates_a_side_project(api_client):
    """The side-project filter has a result."""
    run("seed_demo")

    response = api_client.get(
        reverse("experience:project-list"), {"side_project": "true"}
    )

    assert response.json()


def test_seed_creates_hidden_entries_that_are_not_exposed(api_client):
    """The demo data includes hidden rows, so visibility can be checked."""
    run("seed_demo")

    hidden_experiences = ProfessionalExperience.objects.filter(is_visible=False)
    hidden_projects = Project.objects.filter(is_visible=False)
    projects_of_hidden_experiences = Project.objects.filter(
        is_visible=True, experience__is_visible=False
    )
    exposed = {
        p["id"] for p in api_client.get(reverse("experience:project-list")).json()
    }

    assert hidden_experiences.exists()
    assert hidden_projects.exists()
    assert projects_of_hidden_experiences.exists()
    assert not exposed & set(hidden_projects.values_list("id", flat=True))
    assert not exposed & set(
        projects_of_hidden_experiences.values_list("id", flat=True)
    )


def test_seed_refuses_to_run_on_a_database_with_content():
    """Real content is never mixed with demo data by accident."""
    run("seed_demo")
    count = Project.objects.count()

    with pytest.raises(CommandError, match="reset_demo"):
        run("seed_demo")

    assert Project.objects.count() == count


def test_flush_deletes_all_content():
    """Every portfolio table is emptied."""
    run("seed_demo")

    run("flush_demo", interactive=False)

    for model in CONTENT_MODELS:
        assert not model.objects.exists(), model.__name__


def test_flush_restarts_ids():
    """Demo ids stay the same after a reset, so saved requests keep working."""
    run("seed_demo")
    first_ids = sorted(Project.objects.values_list("id", flat=True))

    run("reset_demo", interactive=False)

    assert sorted(Project.objects.values_list("id", flat=True)) == first_ids


def test_flush_keeps_users():
    """The admin account survives a flush."""
    make_admin()

    run("flush_demo", interactive=False)

    assert get_user_model().objects.filter(username="admin").exists()


@pytest.mark.parametrize("command", ["flush_demo", "reset_demo"])
def test_destructive_commands_stop_unless_confirmed(monkeypatch, command):
    """Anything but "yes" at the prompt leaves the content untouched."""
    run("seed_demo")
    Tag.objects.create(name="Leftover", kind=Tag.Kind.TOOL)
    monkeypatch.setattr("builtins.input", lambda prompt: "no")

    with pytest.raises(CommandError, match="Cancelled"):
        run(command)

    assert Tag.objects.filter(name="Leftover").exists()


@pytest.mark.parametrize("command", ["flush_demo", "reset_demo"])
def test_destructive_commands_run_when_confirmed(monkeypatch, command):
    """Typing "yes" at the prompt goes ahead."""
    run("seed_demo")
    Tag.objects.create(name="Leftover", kind=Tag.Kind.TOOL)
    monkeypatch.setattr("builtins.input", lambda prompt: "yes")

    run(command)

    assert not Tag.objects.filter(name="Leftover").exists()


def test_reset_replaces_the_content():
    """reset_demo deletes the existing content, then seeds again."""
    run("seed_demo")
    Tag.objects.create(name="Leftover", kind=Tag.Kind.TOOL)

    run("reset_demo", interactive=False)

    assert not Tag.objects.filter(name="Leftover").exists()
    assert Education.objects.exists()
    assert Certification.objects.exists()
    assert Specialization.objects.exists()


def test_reset_works_on_an_empty_database():
    """reset_demo can be used for the first seed too."""
    run("reset_demo", interactive=False)

    assert Project.objects.exists()


def test_reset_keeps_users():
    """The admin account survives a reset."""
    make_admin()

    run("reset_demo", interactive=False)

    assert get_user_model().objects.filter(username="admin").exists()
