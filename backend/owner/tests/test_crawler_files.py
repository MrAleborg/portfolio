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


def test_robots_on_canonical_domain_allows_all_but_api_and_admin(client):
    response = client.get("/robots.txt", HTTP_HOST=CANONICAL)

    assert response.status_code == 200
    assert response["Content-Type"].startswith("text/plain")
    lines = response.content.decode().splitlines()
    assert "User-agent: *" in lines
    assert "Disallow: /api/" in lines
    assert "Disallow: /admin/" in lines
    assert f"Sitemap: https://{CANONICAL}/sitemap.xml" in lines
    assert "Disallow: /" not in lines


@pytest.mark.parametrize("host", ["dev-box", "testserver"])
def test_robots_on_any_other_host_disallows_everything(client, host):
    response = client.get("/robots.txt", HTTP_HOST=host)

    assert response.content.decode().splitlines() == ["User-agent: *", "Disallow: /"]


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
        "x-default": f"{base}/en/resume",
    }
    assert by_loc[f"{base}/fr/"]["x-default"] == f"{base}/"
    assert all(set(a) == {"fr", "en", "x-default"} for a in by_loc.values())


def test_sitemap_uses_canonical_domain_whatever_the_host(client):
    response = client.get("/sitemap.xml", HTTP_HOST="dev-box")

    assert b"dev-box" not in response.content
    assert f"https://{CANONICAL}/fr/".encode() in response.content
