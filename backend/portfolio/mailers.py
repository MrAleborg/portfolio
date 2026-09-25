"""Build a Django 6.1 ``MAILERS`` entry from an ``EMAIL_URL``.

django-environ parses email URLs into the older ``EMAIL_*`` settings; this
maps them onto a mailer's ``BACKEND`` and ``OPTIONS``.
"""

import environ

SMTP_BACKEND = "django.core.mail.backends.smtp.EmailBackend"


def mailer_from_url(url):
    """Return a mailer config, e.g. from ``smtp+tls://user:pass@host:587``."""
    config = environ.Env.email_url_config(url)
    mailer = {"BACKEND": config["EMAIL_BACKEND"]}
    if mailer["BACKEND"] == SMTP_BACKEND:
        mailer["OPTIONS"] = {
            "host": config["EMAIL_HOST"],
            "port": config["EMAIL_PORT"],
            "username": config["EMAIL_HOST_USER"],
            "password": config["EMAIL_HOST_PASSWORD"],
            "use_tls": config.get("EMAIL_USE_TLS", False),
            "use_ssl": config.get("EMAIL_USE_SSL", False),
        }
    return mailer
