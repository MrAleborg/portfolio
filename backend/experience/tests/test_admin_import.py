"""Tests for the resume import page of the Django admin.

Route: ``/admin/import-resume/``, superusers only. It takes a JSON file in the
format of ``GET /api/v1/resume/`` and imports it (see test_resume_import.py
for what an import writes).
"""

import json

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

from experience.admin_import import MAX_FILE_SIZE, error_lines
from experience.models import Hobby

pytestmark = pytest.mark.django_db

URL = reverse("admin-import-resume")
INDEX_URL = reverse("admin:index")


def upload(content, name="resume.json"):
    if not isinstance(content, bytes):
        content = json.dumps(content).encode()
    return SimpleUploadedFile(name, content, content_type="application/json")


def hobby(id, name="Climbing"):
    return {
        "id": id,
        "name": {"en": name, "fr": name},
        "description": {"en": "", "fr": ""},
    }


@pytest.fixture
def staff_client(client, django_user_model):
    """A client logged in as a staff user who is not a superuser."""
    user = django_user_model.objects.create_user(
        username="editor", password="x", is_staff=True
    )
    client.force_login(user)
    return client


def test_route():
    assert URL == "/admin/import-resume/"


def test_anonymous_user_is_sent_to_the_login_page(client):
    response = client.get(URL)

    assert response.status_code == 302
    assert response.url.startswith(reverse("admin:login"))


def test_staff_user_who_is_not_a_superuser_is_forbidden(staff_client):
    assert staff_client.get(URL).status_code == 403
    response = staff_client.post(URL, {"file": upload({"hobbies": [hobby(1)]})})
    assert response.status_code == 403
    assert Hobby.objects.count() == 0


def test_page_loads_for_a_superuser(admin_client):
    response = admin_client.get(URL)

    assert response.status_code == 200
    assert b'type="file"' in response.content


def test_admin_index_links_to_the_page_for_a_superuser(admin_client):
    response = admin_client.get(INDEX_URL)

    assert URL.encode() in response.content


def test_admin_index_hides_the_link_from_other_staff(staff_client):
    response = staff_client.get(INDEX_URL)

    assert response.status_code == 200
    assert URL.encode() not in response.content


def test_valid_file_is_imported_and_the_report_shown(admin_client):
    Hobby.objects.create(id=1, name_en="Old", name_fr="Ancien")
    data = {"hobbies": [hobby(1, "Chess"), hobby(2, "Go")]}

    response = admin_client.post(URL, {"file": upload(data)}, follow=True)

    assert response.redirect_chain == [(INDEX_URL, 302)]
    assert Hobby.objects.get(pk=1).name_en == "Chess"
    assert Hobby.objects.filter(pk=2).exists()
    [message] = [str(m) for m in response.context["messages"]]
    assert "1 created, 1 updated" in message
    assert "hobbies 1/1" in message


def test_invalid_record_is_reported_and_nothing_is_written(admin_client):
    data = {"hobbies": [hobby(1), {**hobby(2), "name": {"en": "No French"}}]}

    response = admin_client.post(URL, {"file": upload(data)})

    assert response.status_code == 200
    assert (
        "hobbies[1].name.fr: This field is required."
        in (response.context["import_errors"])
    )
    assert b"Nothing was imported" in response.content
    assert Hobby.objects.count() == 0


@pytest.mark.parametrize(
    ("content", "message"),
    [
        pytest.param(b"{not json", "not valid JSON", id="invalid-json"),
        pytest.param(b"\xff\xfe\xfa", "not valid JSON", id="not-text"),
    ],
)
def test_unreadable_file_is_refused(admin_client, content, message):
    response = admin_client.post(URL, {"file": upload(content)})

    assert response.status_code == 200
    assert message in str(response.context["form"].errors["file"])


def test_file_that_is_not_an_object_is_refused(admin_client):
    response = admin_client.post(URL, {"file": upload(b"[]")})

    assert response.status_code == 200
    assert response.context["import_errors"] == [
        "Expected an object, as GET /api/v1/resume/ gives."
    ]


def test_file_over_the_size_limit_is_refused(admin_client):
    content = b" " * MAX_FILE_SIZE + b"{}"

    response = admin_client.post(URL, {"file": upload(content)})

    assert "larger than 5 MB" in str(response.context["form"].errors["file"])


def test_missing_file_is_refused(admin_client):
    response = admin_client.post(URL, {})

    assert response.status_code == 200
    assert "file" in response.context["form"].errors


def test_error_lines_name_the_place_of_each_error():
    errors = {
        "non_field_errors": ["Bad file."],
        "profile": {"full_name": ["Required."]},
        "tag_categories": {0: {"children": {1: {"name": {"fr": ["Required."]}}}}},
        "achievements": {0: [{"fr": ["Required."]}]},
        "tags": {3: {"non_field_errors": ["Clash."]}},
        "projects": ["Expected a list."],
        "odd": 3,
    }

    assert error_lines(errors) == [
        "Bad file.",
        "profile.full_name: Required.",
        "tag_categories[0].children[1].name.fr: Required.",
        "achievements[0][0].fr: Required.",
        "tags[3]: Clash.",
        "projects: Expected a list.",
        "odd: 3",
    ]
    assert error_lines(5) == ["5"]
