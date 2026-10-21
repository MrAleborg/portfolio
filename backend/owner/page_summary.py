"""The Page summary: the <head> tags for a Page, spliced into the shell by nginx."""

import json

from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render
from django.views.decorators.http import require_safe

from owner.crawler import canonical_url, is_canonical_host
from owner.models import ContactLink, Profile

LOCALES = {"fr": "fr_FR", "en": "en_US"}
DESCRIPTION_LENGTH = 155


def _description(bio, headline):
    """The bio cut at a word boundary (with "…"), or the headline with no bio."""
    text = " ".join(bio.split())
    if not text:
        return headline
    if len(text) <= DESCRIPTION_LENGTH:
        return text
    cut = text[: DESCRIPTION_LENGTH + 1]
    space = cut.rfind(" ")
    # shortcut: a single word longer than the limit is cut mid-word.
    return (cut[:space] if space > 0 else cut[:DESCRIPTION_LENGTH]) + "…"


def _json_ld(data):
    """JSON safe inside <script>: `<`, `>` and `&` are escaped, so no `</script>`."""
    text = json.dumps(data, ensure_ascii=True)
    return text.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


@require_safe
def page_summary(request):
    """`?page=home&locale=fr|en`, or `?page=root` (Home's English text, x-default)."""
    page = request.GET.get("page")
    locale = "en" if page == "root" else request.GET.get("locale")
    # Only Home's summary exists so far.
    if page not in ("home", "root") or locale not in LOCALES:
        return HttpResponseBadRequest()
    profile = Profile.objects.first()
    if profile is None:
        return HttpResponse(status=404)

    name = profile.full_name
    headline = getattr(profile, f"headline_{locale}")
    description = _description(getattr(profile, f"bio_{locale}"), headline)
    canonical = canonical_url("/" if page == "root" else f"/{locale}/")
    image = canonical_url("/media/avatar.webp")
    same_as = [
        link.url
        for link in ContactLink.objects.filter(is_visible=True).exclude(
            kind=ContactLink.Kind.EMAIL
        )
    ]
    person = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": name,
        "jobTitle": headline,
        "description": description,
        "url": canonical,
        "image": image,
        "sameAs": same_as,
    }
    return render(
        request,
        "owner/page_summary.html",
        {
            "title": f"{name} – {headline}",
            "description": description,
            "canonical": canonical,
            "alternates": [
                ("fr", canonical_url("/fr/")),
                ("en", canonical_url("/en/")),
                ("x-default", canonical_url("/")),
            ],
            "og_type": "profile",
            "og_locale": LOCALES[locale],
            "image": image,
            "noindex": not is_canonical_host(request),
            "json_ld": _json_ld(person),
        },
    )
