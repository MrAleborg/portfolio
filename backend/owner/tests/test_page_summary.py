"""Tests for the Page summary: ``/api/v1/profile/page-summary/?page=&locale=``.

It returns the ``<head>`` tags of a Page as an HTML fragment, which the
frontend's nginx splices into the built shell. Only Home (``home``, per Locale)
and ``root`` (``/`` itself, Home's English text) exist so far.
"""

import json
import re
from html.parser import HTMLParser

import pytest
from django.urls import reverse

from owner.models import ContactLink, Profile

pytestmark = pytest.mark.django_db

URL = reverse("owner:page-summary")
CANONICAL = "alexandreleborgne.fr"


class Head(HTMLParser):
    """Collects the tags of the fragment, and the JSON-LD script's text."""

    def __init__(self, html):
        super().__init__()
        self.tags = []
        self.title = None
        self.json_ld = None
        self._in = None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))
        self._in = tag if tag in ("title", "script") else None

    def handle_data(self, data):
        if self._in == "title":
            self.title = data
        elif self._in == "script":
            self.json_ld = json.loads(data)

    def handle_endtag(self, tag):
        self._in = None

    def attr(self, tag, key, value, wanted):
        return next(a[wanted] for t, a in self.tags if t == tag and a.get(key) == value)

    def meta(self, key, value):
        return self.attr("meta", key, value, "content")

    def link(self, rel, hreflang=None):
        for tag, attrs in self.tags:
            if (
                tag == "link"
                and attrs["rel"] == rel
                and attrs.get("hreflang") == hreflang
            ):
                return attrs["href"]


@pytest.fixture(autouse=True)
def hosts(settings):
    settings.ALLOWED_HOSTS = [CANONICAL, "dev-box", "testserver"]


@pytest.fixture
def profile():
    return Profile.objects.create(
        full_name="Ada Lovelace",
        headline_en="Analyst",
        headline_fr="Analyste",
        bio_en="I write programs.",
        bio_fr="J’écris des programmes.",
    )


def get(client, page, locale=None, host=CANONICAL):
    query = {"page": page, **({"locale": locale} if locale else {})}
    return client.get(URL, query, HTTP_HOST=host)


@pytest.mark.parametrize(
    ("locale", "headline", "bio", "og_locale"),
    [
        ("en", "Analyst", "I write programs.", "en_US"),
        ("fr", "Analyste", "J’écris des programmes.", "fr_FR"),
    ],
)
def test_home_summary_in_each_locale(client, profile, locale, headline, bio, og_locale):
    response = get(client, "home", locale)

    assert response.status_code == 200
    assert response["Content-Type"].startswith("text/html")
    head = Head(response.content.decode())
    own = f"https://{CANONICAL}/{locale}/"
    assert head.title == f"Ada Lovelace – {headline}"
    assert head.meta("name", "description") == bio
    assert head.link("canonical") == own
    assert head.link("alternate", "fr") == f"https://{CANONICAL}/fr/"
    assert head.link("alternate", "en") == f"https://{CANONICAL}/en/"
    assert head.link("alternate", "x-default") == f"https://{CANONICAL}/"
    assert head.meta("property", "og:title") == head.title
    assert head.meta("property", "og:description") == bio
    assert head.meta("property", "og:url") == own
    assert head.meta("property", "og:type") == "profile"
    assert head.meta("property", "og:locale") == og_locale
    assert head.meta("property", "og:image") == f"https://{CANONICAL}/media/avatar.webp"
    assert head.meta("name", "twitter:card") == "summary"
    assert head.json_ld == {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Ada Lovelace",
        "jobTitle": headline,
        "description": bio,
        "url": own,
        "image": f"https://{CANONICAL}/media/avatar.webp",
        "sameAs": [],
    }


def test_root_summary_is_homes_english_text_canonical_at_the_root(client, profile):
    response = get(client, "root")

    assert response.status_code == 200
    head = Head(response.content.decode())
    assert head.title == "Ada Lovelace – Analyst"
    assert head.meta("name", "description") == "I write programs."
    assert head.link("canonical") == f"https://{CANONICAL}/"
    assert head.link("alternate", "x-default") == f"https://{CANONICAL}/"
    assert head.meta("property", "og:locale") == "en_US"
    assert head.json_ld["@type"] == "Person"
    assert head.json_ld["url"] == f"https://{CANONICAL}/"


def test_root_ignores_the_locale(client, profile):
    assert get(client, "root", "fr").content == get(client, "root").content


def test_long_bio_is_cut_at_a_word_boundary(client, profile):
    profile.bio_en = " ".join(["word"] * 60)
    profile.bio_fr = "J’écris des programmes."
    profile.save()

    head = Head(get(client, "home", "en").content.decode())

    description = head.meta("name", "description")
    assert description == " ".join(["word"] * 31) + "…"
    assert len(description) <= 156
    assert head.json_ld["description"] == description


def test_bio_of_exactly_the_limit_is_kept_whole(client, profile):
    profile.bio_en = " ".join(["abcd"] * 30 + ["abcde"])
    assert len(profile.bio_en) == 155
    profile.bio_fr = "x"
    profile.save()

    description = Head(get(client, "home", "en").content.decode()).meta(
        "name", "description"
    )

    assert description == profile.bio_en
    assert not description.endswith("…")


def test_description_is_the_headline_without_a_bio(client, profile):
    profile.bio_en = profile.bio_fr = ""
    profile.save()

    head = Head(get(client, "home", "fr").content.decode())

    assert head.meta("name", "description") == "Analyste"


def test_same_as_lists_visible_non_email_links_in_display_order(client, profile):
    for kind, url, order, visible in [
        ("github", "https://github.com/ada", 2, True),
        ("linkedin", "https://linkedin.com/in/ada", 1, True),
        ("email", "mailto:ada@example.com", 0, True),
        ("website", "https://hidden.example.com", 3, False),
    ]:
        ContactLink.objects.create(
            kind=kind, url=url, display_order=order, is_visible=visible
        )

    response = get(client, "home", "en")

    assert Head(response.content.decode()).json_ld["sameAs"] == [
        "https://linkedin.com/in/ada",
        "https://github.com/ada",
    ]
    assert "ada@example.com" not in response.content.decode()


def test_profile_text_is_html_escaped(client, profile):
    profile.full_name = 'Ada <b>"&"</b>'
    profile.headline_en = "<i>Analyst</i>"
    profile.bio_en = '"><script>alert(1)</script>'
    profile.bio_fr = "x"
    profile.save()

    html = get(client, "home", "en").content.decode()

    assert "<b>" not in html and "<i>" not in html and "alert(1)</script>" not in html
    head = Head(html)
    assert head.title == 'Ada <b>"&"</b> – <i>Analyst</i>'
    assert head.meta("name", "description") == '"><script>alert(1)</script>'


def test_json_ld_cannot_be_broken_out_of(client, profile):
    profile.bio_en = "</script><script>alert(1)</script> & <!--"
    profile.bio_fr = "x"
    profile.save()
    ContactLink.objects.create(kind="other", url="https://x.example/</script>")

    html = get(client, "home", "en").content.decode()

    script = re.search(
        r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL
    )
    assert script, "the JSON-LD script is not closed early"
    assert html.count("</script>") == 1
    data = json.loads(script.group(1))
    assert data["description"] == "</script><script>alert(1)</script> & <!--"
    assert data["sameAs"] == ["https://x.example/</script>"]


@pytest.mark.parametrize(
    "query",
    [
        {},
        {"page": "home"},
        {"page": "home", "locale": "de"},
        {"page": "nope", "locale": "en"},
        {"page": "resume", "locale": "en"},
        {"locale": "en"},
    ],
)
def test_bad_page_or_locale_is_a_400(client, profile, query):
    response = client.get(URL, query, HTTP_HOST=CANONICAL)

    assert response.status_code == 400


@pytest.mark.parametrize(
    "query", [{"page": "home", "locale": "en"}, {"page": "root"}], ids=str
)
def test_no_profile_is_a_404_with_an_empty_body(client, query):
    response = client.get(URL, query, HTTP_HOST=CANONICAL)

    assert response.status_code == 404
    assert response.content == b""


def test_canonical_host_is_indexable(client, profile):
    head = Head(get(client, "home", "en", host=f"{CANONICAL}:443").content.decode())

    assert not any(a.get("name") == "robots" for _, a in head.tags)


@pytest.mark.parametrize("host", ["dev-box", "testserver"])
def test_any_other_host_gets_noindex_but_the_canonical_address(client, profile, host):
    head = Head(get(client, "home", "en", host=host).content.decode())

    assert head.meta("name", "robots") == "noindex"
    assert head.link("canonical") == f"https://{CANONICAL}/en/"


def test_head_answers_like_get(client, profile):
    got = get(client, "home", "en")

    response = client.head(URL, {"page": "home", "locale": "en"}, HTTP_HOST=CANONICAL)

    assert response.status_code == got.status_code == 200
