"""Tests for building the MAILERS setting from an ``EMAIL_URL``."""

from portfolio.mailers import mailer_from_url

SMTP_BACKEND = "django.core.mail.backends.smtp.EmailBackend"


def test_console_url_gives_the_console_backend_without_options():
    assert mailer_from_url("consolemail://") == {
        "BACKEND": "django.core.mail.backends.console.EmailBackend",
    }


def test_smtp_tls_url_gives_smtp_options():
    mailer = mailer_from_url("smtp+tls://user:secret@smtp.example.com:587")

    assert mailer == {
        "BACKEND": SMTP_BACKEND,
        "OPTIONS": {
            "host": "smtp.example.com",
            "port": 587,
            "username": "user",
            "password": "secret",
            "use_tls": True,
            "use_ssl": False,
        },
    }


def test_smtp_ssl_url_uses_ssl():
    mailer = mailer_from_url("smtp+ssl://user:secret@smtp.example.com:465")

    assert mailer["OPTIONS"]["use_ssl"] is True
    assert mailer["OPTIONS"]["use_tls"] is False


def test_url_encoded_credentials_are_decoded():
    mailer = mailer_from_url("smtp+tls://me%40example.com:p%40ss@smtp.example.com:587")

    assert mailer["OPTIONS"]["username"] == "me@example.com"
    assert mailer["OPTIONS"]["password"] == "p@ss"
