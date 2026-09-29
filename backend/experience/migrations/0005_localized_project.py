"""Translate project titles, missions and achievements.

Titles and missions get one column per language. Achievements stay a JSON
list, each string becoming an object with the same text in every language.
"""

from django.db import migrations, models

from experience.migrations._translation import (
    LANGUAGES,
    SOURCE_LANGUAGE,
    translate,
)


def translate_achievements(apps, schema_editor):
    Project = apps.get_model("experience", "Project")
    for project in Project.objects.exclude(achievements=[]):
        project.achievements = [
            {language: text for language in LANGUAGES} for text in project.achievements
        ]
        project.save(update_fields=["achievements"])


def keep_source_language(apps, schema_editor):
    Project = apps.get_model("experience", "Project")
    for project in Project.objects.exclude(achievements=[]):
        project.achievements = [
            texts[SOURCE_LANGUAGE] for texts in project.achievements
        ]
        project.save(update_fields=["achievements"])


class Migration(migrations.Migration):
    dependencies = [
        ("experience", "0004_localized_experience"),
    ]

    operations = [
        *translate("project", {"title": models.CharField(max_length=255)}),
        *translate("mission", {"description": models.TextField()}),
        migrations.AlterField(
            model_name="project",
            name="achievements",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text=(
                    "Valorization elements, each in every language, e.g. "
                    '[{"en": "Won an award", "fr": "A remporté un prix"}].'
                ),
            ),
        ),
        migrations.RunPython(translate_achievements, keep_source_language),
    ]
