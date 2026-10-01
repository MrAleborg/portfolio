"""Tests for settings that depend on the environment or on the logging setup.

The environment ones load the settings in a fresh interpreter, since they are
read once at import time.
"""

import io
import json
import logging
import os
import subprocess
import sys
from pathlib import Path

import pytest

BASE_DIR = Path(__file__).resolve().parents[2]


def load_settings(names, **env):
    """Return these settings as a fresh process sees them with this environment."""
    code = (
        "import json; from portfolio import settings; "
        f"print(json.dumps({{n: getattr(settings, n) for n in {names!r}}}))"
    )
    environ = {**os.environ, "SECRET_KEY": "test", "DEBUG": "False"}
    environ.pop("DATABASE_URL", None)
    environ.update(env)
    result = subprocess.run(
        [sys.executable, "-c", code],
        cwd=BASE_DIR,
        env=environ,
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout)


def test_sqlite_runs_in_wal_mode_with_immediate_transactions():
    databases = load_settings(["DATABASES"], DATABASE_URL="sqlite:////tmp/x.sqlite3")[
        "DATABASES"
    ]

    options = databases["default"]["OPTIONS"]
    assert options["transaction_mode"] == "IMMEDIATE"
    assert "journal_mode=WAL" in options["init_command"]


@pytest.fixture
def console_output(monkeypatch, settings):
    """Whatever the root console handler prints to stdout, with DEBUG off."""
    settings.DEBUG = False
    handler = logging.getHandlerByName("console")
    stream = io.StringIO()
    monkeypatch.setattr(handler, "stream", stream)
    return stream


def test_console_does_not_print_info_from_django_loggers(console_output):
    logging.getLogger("django.server").info("GET /api/v1/experience/ 200")

    assert console_output.getvalue() == ""


def test_console_prints_warnings_from_django_loggers(console_output):
    logging.getLogger("django.request").warning("Not Found: /nope/")

    assert "Not Found: /nope/" in console_output.getvalue()
