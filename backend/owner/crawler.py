"""The crawler files: robots.txt and sitemap.xml, served at the site root."""

from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.http import require_GET

# The three Pages, as in the frontend router and nginx.
PAGES = ["", "resume", "contact"]
LOCALES = ["fr", "en"]


def _canonical(path):
    return f"https://{settings.CANONICAL_DOMAIN}{path}"


@require_GET
def robots_txt(request):
    if request.get_host() == settings.CANONICAL_DOMAIN:
        body = (
            "User-agent: *\n"
            "Disallow: /api/\n"
            "Disallow: /admin/\n"
            f"Sitemap: {_canonical('/sitemap.xml')}\n"
        )
    else:
        body = "User-agent: *\nDisallow: /\n"
    return HttpResponse(body, content_type="text/plain")


def _url(loc, alternates):
    links = "".join(
        f'<xhtml:link rel="alternate" hreflang="{lang}" href="{_canonical(path)}"/>'
        for lang, path in alternates.items()
    )
    return f"<url><loc>{_canonical(loc)}</loc>{links}</url>"


@require_GET
def sitemap_xml(request):
    # x-default is the root for Home and the English Page for the others.
    urls = [
        _url("/", {"fr": "/fr/", "en": "/en/", "x-default": "/"}),
    ]
    for page in PAGES:
        paths = {lang: f"/{lang}/{page}" for lang in LOCALES}
        for path in paths.values():
            urls.append(
                _url(path, {**paths, "x-default": "/" if not page else paths["en"]})
            )
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">' + "".join(urls) + "</urlset>"
    )
    return HttpResponse(body, content_type="application/xml")
