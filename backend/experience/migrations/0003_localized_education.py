"""Translate education texts: one column per language."""

from django.db import migrations, models

from experience.migrations._translation import translate


class Migration(migrations.Migration):
    dependencies = [
        ("experience", "0002_date_constraints"),
    ]

    operations = translate(
        "education",
        {
            "degree": models.CharField(max_length=255),
            "field_of_study": models.CharField(blank=True, max_length=255),
            "grade": models.CharField(blank=True, max_length=100),
            "location": models.CharField(blank=True, max_length=255),
        },
    )
