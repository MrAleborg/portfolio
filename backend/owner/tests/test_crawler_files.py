"""Tests for ``/robots.txt`` and ``/sitemap.xml``.

Only the Canonical domain may be indexed: any other host gets ``Disallow: /``.
The sitemap always uses the Canonical domain, whatever the Host.
"""

import xml.etree.ElementTree as ET

import pytest

CANONICAL = "alexandreleborgne.fr"
NS = {
    "sm": "http://www.sitemaps.org/schemas/sitemap/0.9",
    "xhtml": "http://www.w3.org/1999/xhtml",
}


@pytest.fixture(autouse=True)
def hosts(settings):
    settings.ALLOWED_HOSTS = [CANONICAL, "dev-box", "testserver"]


@pytest.mark.parametrize(
    "host", [CANONICAL, f"{CANONICAL}:443", CANONICAL.upper()], ids=str
)
def test_robots_on_canonical_domain_allows_all_but_admin(client, settings, host):
    settings.ALLOWED_HOSTS = [CANONICAL, host.split(":")[0]]

    response = client.get("/robots.txt", HTTP_HOST=host)

    assert response.status_code == 200
    assert response["Content-Type"].startswith("text/plain")
    lines = response.content.decode().splitlines()
    assert "User-agent: *" in lines
    assert "Disallow: /api/" not in lines
    assert "Disallow: /admin/" in lines
    assert f"Sitemap: https://{CANONICAL}/sitemap.xml" in lines
    assert "Disallow: /" not in lines


@pytest.mark.parametrize("host", ["dev-box", "testserver"])
def test_robots_on_any_other_host_disallows_everything(client, host):
    response = client.get("/robots.txt", HTTP_HOST=host)

    assert response.status_code == 200
    assert response["Content-Type"].startswith("text/plain")
    assert response.content.decode().splitlines() == ["User-agent: *", "Disallow: /"]


@pytest.mark.parametrize("path", ["/robots.txt", "/sitemap.xml"])
def test_head_answers_like_get_without_a_body(client, path):
    response = client.head(path, HTTP_HOST=CANONICAL)

    assert response.status_code == 200
    assert response.content == b""


@pytest.mark.django_db
def test_api_responses_are_marked_noindex(client):
    response = client.get("/api/v1/profile/contact-links/")

    assert response.status_code == 200
    assert response["X-Robots-Tag"] == "noindex"


def test_pages_outside_the_api_are_not_marked_noindex(client):
    response = client.get("/robots.txt", HTTP_HOST=CANONICAL)

    assert "X-Robots-Tag" not in response


def test_canonical_domain_follows_the_setting(client, settings):
    settings.CANONICAL_DOMAIN = "dev-box"

    response = client.get("/robots.txt", HTTP_HOST="dev-box")

    assert "Sitemap: https://dev-box/sitemap.xml" in response.content.decode()


def sitemap(client, host):
    response = client.get("/sitemap.xml", HTTP_HOST=host)
    assert response.status_code == 200
    assert response["Content-Type"].startswith("application/xml")
    return ET.fromstring(response.content)


def alternates(url):
    return {
        link.get("hreflang"): link.get("href") for link in url.findall("xhtml:link", NS)
    }


def test_sitemap_lists_root_and_the_six_pages(client):
    root = sitemap(client, CANONICAL)

    locs = [u.find("sm:loc", NS).text for u in root.findall("sm:url", NS)]
    assert sorted(locs) == sorted(
        f"https://{CANONICAL}{path}"
        for path in [
            "/",
            "/fr/",
            "/en/",
            "/fr/resume",
            "/en/resume",
            "/fr/contact",
            "/en/contact",
        ]
    )


def test_sitemap_pages_carry_fr_en_and_x_default_alternates(client):
    root = sitemap(client, CANONICAL)

    by_loc = {
        u.find("sm:loc", NS).text: alternates(u) for u in root.findall("sm:url", NS)
    }
    base = f"https://{CANONICAL}"
    assert by_loc[f"{base}/"] == {
        "fr": f"{base}/fr/",
        "en": f"{base}/en/",
        "x-default": f"{base}/",
    }
    assert by_loc[f"{base}/en/resume"] == {
        "fr": f"{base}/fr/resume",
        "en": f"{base}/en/resume",
    }
    for home in ["/fr/", "/en/"]:
        assert by_loc[f"{base}{home}"]["x-default"] == f"{base}/"
    assert sum("x-default" in a for a in by_loc.values()) == 3


def test_sitemap_uses_canonical_domain_whatever_the_host(client):
    response = client.get("/sitemap.xml", HTTP_HOST="dev-box")

    assert b"dev-box" not in response.content
    assert f"https://{CANONICAL}/fr/".encode() in response.content


def test_sitemap_urls_follow_the_canonical_domain_setting(client, settings):
    settings.CANONICAL_DOMAIN = "dev-box"

    response = client.get("/sitemap.xml", HTTP_HOST="testserver")

    assert b"https://dev-box/fr/resume" in response.content
    assert CANONICAL.encode() not in response.content
