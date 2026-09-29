"""Operations of the migrations that translate texts into one column per language.

Not a migration itself: Django skips modules whose name starts with "_".
Migrations depend on it, so it must keep producing the same operations.
"""

from django.db import migrations, models

# Frozen copy of experience.languages.LANGUAGES at the time of the migrations.
LANGUAGES = ("en", "fr")
SOURCE_LANGUAGE, *OTHER_LANGUAGES = LANGUAGES


def translated_together(model_name, field):
    """Frozen copy of experience.models.translated_together."""
    columns = [f"{field}_{language}" for language in LANGUAGES]
    all_empty = models.Q(**{column: "" for column in columns})
    all_filled = models.Q()
    for column in columns:
        all_filled &= ~models.Q(**{column: ""})
    return models.CheckConstraint(
        condition=all_empty | all_filled,
        name=f"experience_{model_name}_{field}_translated",
        violation_error_message="Fill in every language, or leave them all empty.",
    )


def translate(model_name, fields):
    """Operations that translate text `fields` of `model_name`.

    `fields` maps each field name to its model field (the definition of every
    language column). The existing column becomes the first language, and its
    content is copied to the others, to be translated afterwards. Optional
    (blank) texts are then constrained to be empty in every language or in
    none.
    """
    renames = [
        migrations.RenameField(
            model_name=model_name,
            old_name=name,
            new_name=f"{name}_{SOURCE_LANGUAGE}",
        )
        for name in fields
    ]
    additions = [
        add_field(model_name, f"{name}_{language}", field)
        for name, field in fields.items()
        for language in OTHER_LANGUAGES
    ]

    def copy(apps, schema_editor):
        model = apps.get_model("experience", model_name)
        model.objects.update(
            **{
                f"{name}_{language}": models.F(f"{name}_{SOURCE_LANGUAGE}")
                for name in fields
                for language in OTHER_LANGUAGES
            }
        )

    constraints = [
        migrations.AddConstraint(
            model_name=model_name, constraint=translated_together(model_name, name)
        )
        for name, field in fields.items()
        if field.blank
    ]
    return [
        *renames,
        *additions,
        migrations.RunPython(copy, migrations.RunPython.noop),
        *constraints,
    ]


def add_field(model_name, name, field):
    """AddField; a required column gets a one-off default for existing rows."""
    if field.blank:
        return migrations.AddField(model_name=model_name, name=name, field=field)
    _, _, args, kwargs = field.deconstruct()
    return migrations.AddField(
        model_name=model_name,
        name=name,
        field=type(field)(*args, **kwargs, default=""),
        preserve_default=False,
    )
