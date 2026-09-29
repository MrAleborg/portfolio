"""Translate professional experience texts: one column per language."""

from django.db import migrations, models

from experience.migrations._translation import translate


class Migration(migrations.Migration):
    dependencies = [
        ("experience", "0003_localized_education"),
    ]

    operations = translate(
        "professionalexperience",
        {
            "position": models.CharField(max_length=255),
            "location": models.CharField(blank=True, max_length=255),
        },
    )
