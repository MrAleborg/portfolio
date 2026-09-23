from datetime import date

import pytest
from django.urls import reverse

from experience.models import Education

pytestmark = pytest.mark.django_db

LIST_URL = reverse("experience:education-list")


def detail_url(pk):
    return reverse("experience:education-detail", args=[pk])


def make_education(**kwargs):
    fields = {
        "institution": "University",
        "degree": "MSc",
        "start_date": date(2020, 9, 1),
    }
    fields.update(kwargs)
    return Education.objects.create(**fields)


def test_routes():
    assert LIST_URL == "/api/v1/experience/education/"
    assert detail_url(1) == "/api/v1/experience/education/1/"


def test_list_is_empty_without_entries(api_client):
    response = api_client.get(LIST_URL)

    assert response.status_code == 200
    assert response.json() == []


def test_list_hides_invisible_entries(api_client):
    visible = make_education()
    make_education(is_visible=False)

    response = api_client.get(LIST_URL)

    assert [entry["id"] for entry in response.json()] == [visible.id]


def test_list_is_ordered_by_display_order_then_newest_start_date(api_client):
    old = make_education(start_date=date(2015, 9, 1))
    new = make_education(start_date=date(2020, 9, 1))
    pinned = make_education(start_date=date(2010, 9, 1), display_order=0)
    old.display_order = new.display_order = 1
    old.save()
    new.save()

    response = api_client.get(LIST_URL)

    assert [entry["id"] for entry in response.json()] == [pinned.id, new.id, old.id]


def test_detail_returns_public_fields(api_client):
    education = make_education(
        field_of_study="Computer Science",
        grade="Honours",
        location="Paris",
        end_date=date(2022, 6, 30),
        description="Thesis on compilers.",
    )

    response = api_client.get(detail_url(education.id))

    assert response.status_code == 200
    assert response.json() == {
        "id": education.id,
        "institution": "University",
        "degree": "MSc",
        "field_of_study": "Computer Science",
        "grade": "Honours",
        "location": "Paris",
        "start_date": "2020-09-01",
        "end_date": "2022-06-30",
        "is_current": False,
        "description": "Thesis on compilers.",
    }


def test_detail_marks_ongoing_entry_as_current(api_client):
    education = make_education(end_date=None)

    response = api_client.get(detail_url(education.id))

    assert response.json()["is_current"] is True


def test_detail_of_invisible_entry_is_not_found(api_client):
    education = make_education(is_visible=False)

    response = api_client.get(detail_url(education.id))

    assert response.status_code == 404


def test_detail_of_missing_entry_is_not_found(api_client):
    response = api_client.get(detail_url(999))

    assert response.status_code == 404


def test_list_is_read_only(api_client):
    response = api_client.post(LIST_URL, {"institution": "X"})

    assert response.status_code == 405


@pytest.mark.parametrize("method", ["put", "patch", "delete"])
def test_detail_is_read_only(api_client, method):
    education = make_education()

    response = getattr(api_client, method)(detail_url(education.id))

    assert response.status_code == 405
