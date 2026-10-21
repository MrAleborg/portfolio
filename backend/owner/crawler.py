"""The crawler files: robots.txt and sitemap.xml, served at the site root."""

from django.conf import settings
from django.http import HttpResponse
from django.http.request import split_domain_port
from django.views.decorators.http import require_safe


def _canonical(path):
    return f"https://{settings.CANONICAL_DOMAIN}{path}"


@require_safe
def robots_txt(request):
    domain, _port = split_domain_port(request.get_host())
    if domain == settings.CANONICAL_DOMAIN.lower():
        body = (
            f"User-agent: *\nDisallow: /admin/\nSitemap: {_canonical('/sitemap.xml')}\n"
        )
    else:
        body = "User-agent: *\nDisallow: /\n"
    return HttpResponse(body, content_type="text/plain")


def _url(path, alternates):
    links = "".join(
        f'<xhtml:link rel="alternate" hreflang="{lang}" href="{_canonical(href)}"/>'
        for lang, href in alternates.items()
    )
    return f"<url><loc>{_canonical(path)}</loc>{links}</url>"


@require_safe
def sitemap_xml(request):
    urls = []
    # x-default (the visitor-picks-a-Locale root) only makes sense for Home.
    for path in ["/", "/fr/", "/en/"]:
        urls.append(_url(path, {"fr": "/fr/", "en": "/en/", "x-default": "/"}))
    for page in ["resume", "contact"]:
        for lang in ["fr", "en"]:
            urls.append(
                _url(
                    f"/{lang}/{page}",
                    {"fr": f"/fr/{page}", "en": f"/en/{page}"},
                )
            )
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">' + "".join(urls) + "</urlset>"
    )
    return HttpResponse(body, content_type="application/xml")


def noindex_api(get_response):
    """Mark every API response noindex: crawlers may load it, not index it."""

    def middleware(request):
        response = get_response(request)
        if request.path.startswith("/api/"):
            response["X-Robots-Tag"] = "noindex"
        return response

    return middleware
