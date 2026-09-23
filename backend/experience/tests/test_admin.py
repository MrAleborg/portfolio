"""Tests for the Django admin, where all portfolio content is managed.

The API is read-only, so every content model must be editable here. These are
smoke tests: each admin page must load for a superuser, which also catches
misconfigured options (unknown fields in list_display, list_filter, ...).
"""

from datetime import date

import pytest
from django.contrib import admin
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

MODELS = [
    Education,
    ProfessionalExperience,
    Project,
    Certification,
    Specialization,
    Tag,
]


def make(model):
    """Create one row of `model` with the minimum required fields."""
    required = {
        Education: {"institution": "University", "degree": "MSc"},
        ProfessionalExperience: {"company": "Acme", "position": "Developer"},
        Project: {"title": "Portfolio"},
        Certification: {"name": "PCAP", "issuer": "Python Institute"},
        Specialization: {"name": "Python Path", "issuer": "Python Institute"},
        Tag: {"name": "Python", "kind": Tag.Kind.SKILL},
    }[model]
    if model in (Education, ProfessionalExperience, Project):
        required["start_date"] = date(2024, 1, 1)
    if model in (Certification, Specialization):
        required["issue_date"] = date(2024, 1, 1)
    return model.objects.create(**required)


def admin_url(model, action, *args):
    meta = model._meta
    return reverse(f"admin:{meta.app_label}_{meta.model_name}_{action}", args=args)


@pytest.mark.parametrize("model", MODELS, ids=lambda m: m.__name__)
def test_model_is_registered(model):
    """Every content model can be managed in the admin."""
    assert admin.site.is_registered(model)


def test_mission_is_edited_inside_its_project():
    """Missions only exist within a project, so they have no page of their own."""
    assert not admin.site.is_registered(Mission)


@pytest.mark.parametrize("model", MODELS, ids=lambda m: m.__name__)
def test_changelist_page_loads(admin_client, model):
    """The list page renders with a row in it."""
    make(model)

    response = admin_client.get(admin_url(model, "changelist"))

    assert response.status_code == 200


@pytest.mark.parametrize("model", MODELS, ids=lambda m: m.__name__)
def test_add_page_loads(admin_client, model):
    """The creation form renders."""
    response = admin_client.get(admin_url(model, "add"))

    assert response.status_code == 200


@pytest.mark.parametrize("model", MODELS, ids=lambda m: m.__name__)
def test_change_page_loads(admin_client, model):
    """The edition form of an existing row renders."""
    obj = make(model)

    response = admin_client.get(admin_url(model, "change", obj.pk))

    assert response.status_code == 200


def test_project_page_edits_its_missions_inline(admin_client):
    """The project form embeds its missions."""
    response = admin_client.get(admin_url(Project, "add"))

    inline_models = [
        formset.opts.model for formset in response.context["inline_admin_formsets"]
    ]
    assert inline_models == [Mission]


def test_changelist_filters_tags_by_kind(admin_client):
    """Tools, methodologies and skills share one page, filtered by kind."""
    make(Tag)
    Tag.objects.create(name="Docker", kind=Tag.Kind.TOOL)

    response = admin_client.get(admin_url(Tag, "changelist"), {"kind__exact": "tool"})

    changelist = response.context["cl"]
    assert [spec.field_path for spec in changelist.filter_specs] == ["kind"]
    assert [tag.name for tag in changelist.result_list] == ["Docker"]
