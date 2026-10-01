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
    environ.pop("SECURE_HSTS_INCLUDE_SUBDOMAINS", None)
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


def test_other_databases_do_not_get_the_sqlite_options():
    databases = load_settings(
        ["DATABASES"], DATABASE_URL="postgres://user:pass@localhost:5432/portfolio"
    )["DATABASES"]

    options = databases["default"].get("OPTIONS", {})
    assert "transaction_mode" not in options
    assert "init_command" not in options


def test_hsts_does_not_cover_subdomains_by_default():
    settings = load_settings(["SECURE_HSTS_INCLUDE_SUBDOMAINS"])

    assert settings["SECURE_HSTS_INCLUDE_SUBDOMAINS"] is False


def test_hsts_covers_subdomains_when_asked():
    settings = load_settings(
        ["SECURE_HSTS_INCLUDE_SUBDOMAINS"], SECURE_HSTS_INCLUDE_SUBDOMAINS="True"
    )

    assert settings["SECURE_HSTS_INCLUDE_SUBDOMAINS"] is True


def test_cache_is_shared_between_worker_processes(settings):
    """Throttle counters must not be per process, as with the local-memory cache."""
    backend = settings.CACHES["default"]["BACKEND"]

    assert backend == "django.core.cache.backends.filebased.FileBasedCache"


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
