"""Translate the description of every entry: one column per language."""

from django.db import migrations, models

from experience.migrations._translation import translate

DESCRIBED_MODELS = [
    "education",
    "professionalexperience",
    "project",
    "certification",
    "specialization",
]


class Migration(migrations.Migration):
    dependencies = [
        ("experience", "0006_localized_names"),
    ]

    operations = [
        operation
        for model_name in DESCRIBED_MODELS
        for operation in translate(
            model_name, {"description": models.TextField(blank=True)}
        )
    ]
