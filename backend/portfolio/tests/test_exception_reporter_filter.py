"""Tests for what the HTML error reports reveal about the failing frames.

The plain-text report emailed to ADMINS lists no frame variables; the HTML one
(technical 500 page, or the email if it is ever sent with ``include_html``) does.
"""

import html
import sys

from django.views.debug import ExceptionReporter

PASSWORD = "hunter2-secret-value"


def fail_while_logging_in():
    # Locals shaped like those of Simple JWT's TokenObtainSerializer.validate.
    attrs = {"username": "admin", "password": PASSWORD}  # noqa: F841
    authenticate_kwargs = {"username": "admin", "password": PASSWORD}  # noqa: F841
    raise RuntimeError("boom")


def error_report(settings):
    settings.DEBUG = False
    try:
        fail_while_logging_in()
    except RuntimeError:
        reporter = ExceptionReporter(None, *sys.exc_info(), is_email=True)
        return html.unescape(reporter.get_traceback_html())


def test_error_report_does_not_contain_the_password_held_in_frame_locals(settings):
    report = error_report(settings)

    assert PASSWORD not in report


def test_error_report_still_shows_the_other_frame_locals(settings):
    report = error_report(settings)

    assert "'username': 'admin'" in report
