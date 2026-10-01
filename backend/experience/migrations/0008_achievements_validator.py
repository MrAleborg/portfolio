"""Validate the shape of the achievements of a project."""

from django.db import migrations, models

import experience.models


class Migration(migrations.Migration):

    dependencies = [
        ('experience', '0007_localized_descriptions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='achievements',
            field=models.JSONField(blank=True, default=list, help_text='Valorization elements, each in every language, e.g. [{"en": "Won an award", "fr": "A remporté un prix"}].', validators=[experience.models.validate_achievements]),
        ),
    ]
