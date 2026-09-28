"""Tests for the server error reports emailed to ADMINS."""

import logging

from django.core import mail


def report_error(settings):
    settings.DEBUG = False
    settings.ADMINS = ["admin@example.com"]
    settings.SERVER_EMAIL = "logs@example.com"
    logging.getLogger("django.request").error("Internal Server Error: /boom/")


def test_error_reports_use_the_server_mailer(settings):
    report_error(settings)

    assert len(mail.outbox) == 1
    assert mail.outbox[0].sent_using == "server"


def test_error_reports_are_sent_from_server_email(settings):
    report_error(settings)

    assert mail.outbox[0].from_email == "logs@example.com"
    assert mail.outbox[0].to == ["admin@example.com"]


def test_no_error_report_when_debug_is_on(settings):
    report_error(settings)
    mail.outbox.clear()
    settings.DEBUG = True

    logging.getLogger("django.request").error("Internal Server Error: /boom/")

    assert mail.outbox == []
