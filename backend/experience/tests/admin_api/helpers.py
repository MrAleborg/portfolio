"""Helpers shared by the admin API tests."""

from django.urls import reverse
from rest_framework.fields import DateTimeField


def list_url(basename):
    return reverse(f"experience-admin:{basename}-list")


def detail_url(basename, pk):
    return reverse(f"experience-admin:{basename}-detail", args=[pk])


def timestamps(instance):
    """created_at and updated_at of `instance`, as the API renders them."""
    instance.refresh_from_db()
    field = DateTimeField()
    return {
        "created_at": field.to_representation(instance.created_at),
        "updated_at": field.to_representation(instance.updated_at),
    }


def listed_ids(response):
    return [entry["id"] for entry in response.json()]
