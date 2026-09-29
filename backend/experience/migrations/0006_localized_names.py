"""Translate certification, specialization and tag names.

A tag name stays unique within its kind, now in each language.
"""

from django.db import migrations, models

from experience.migrations._translation import LANGUAGES, translate


class Migration(migrations.Migration):
    dependencies = [
        ("experience", "0005_localized_project"),
    ]

    operations = [
        migrations.RemoveConstraint(model_name="tag", name="unique_tag_per_kind"),
        *translate("certification", {"name": models.CharField(max_length=255)}),
        *translate("specialization", {"name": models.CharField(max_length=255)}),
        *translate("tag", {"name": models.CharField(max_length=100)}),
        migrations.AlterModelOptions(
            name="tag", options={"ordering": ["kind", "name_en"]}
        ),
        *(
            migrations.AddConstraint(
                model_name="tag",
                constraint=models.UniqueConstraint(
                    fields=(f"name_{language}", "kind"),
                    name=f"unique_tag_name_{language}_per_kind",
                ),
            )
            for language in LANGUAGES
        ),
    ]
