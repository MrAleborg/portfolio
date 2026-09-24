"""Helpers shared by the seed_demo, flush_demo and reset_demo commands."""

from django.core.management.base import CommandError
from django.core.management.color import no_style
from django.db import connection

from experience.models import (
    Certification,
    Education,
    Mission,
    ProfessionalExperience,
    Project,
    Specialization,
    Tag,
)

# Every portfolio model. Users are not content and are never touched.
CONTENT_MODELS = [
    Education,
    ProfessionalExperience,
    Project,
    Mission,
    Certification,
    Specialization,
    Tag,
]


def has_content():
    return any(model.objects.exists() for model in CONTENT_MODELS)


def content_tables():
    """The content tables and their many-to-many join tables."""
    tables = []
    for model in CONTENT_MODELS:
        tables.append(model._meta.db_table)
        tables.extend(
            field.remote_field.through._meta.db_table
            for field in model._meta.local_many_to_many
        )
    return tables


def flush():
    """Empty the content tables and restart their ids at 1.

    Like Django's flush command, but limited to the portfolio tables.
    """
    sql = connection.ops.sql_flush(
        no_style(), content_tables(), reset_sequences=True
    )
    connection.ops.execute_sql_flush(sql)


def add_no_input_argument(parser):
    """The same flag as Django's own flush command."""
    parser.add_argument(
        "--noinput",
        "--no-input",
        action="store_false",
        dest="interactive",
        help="Do not ask for confirmation.",
    )


def confirm(interactive, action):
    """Ask before deleting content; anything but "yes" cancels."""
    if not interactive:
        return
    answer = input(
        f"This will {action} all portfolio content in the database "
        "(users are kept).\nType 'yes' to continue: "
    )
    if answer != "yes":
        raise CommandError("Cancelled.")
