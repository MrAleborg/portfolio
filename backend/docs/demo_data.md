# Demo data

Three management commands fill the local database with fictional content, so
the API can be tried by hand (in a browser, curl or Insomnia) without typing
entries into the Django admin. The data includes hidden entries, to check that
the API leaves them out, and every text is written in English and French.

| Command | Does |
|---|---|
| `seed_demo` | Fills an empty database. Refuses to run if there is content already |
| `flush_demo` | Deletes all portfolio content |
| `reset_demo` | Deletes all portfolio content, then seeds again |

The code is in
[`experience/management/`](../experience/management/), and the tests in
[`experience/tests/test_demo_commands.py`](../experience/tests/test_demo_commands.py).

> **Local use only.** The commands act on whatever database the settings point
> to. Never run `flush_demo` or `reset_demo` against production.

## Before the first run

From `backend/`:

```bash
pipenv install --dev                          # dependencies
cp .env.example .env                          # then set SECRET_KEY
pipenv run python manage.py migrate           # create the tables
pipenv run python manage.py createsuperuser   # admin account, to log in (optional)
```

## Commands

### `seed_demo`: fill an empty database

```bash
pipenv run python manage.py seed_demo
```

```text
Demo content created.
```

If the database already has portfolio content, nothing is written, so real
entries are never mixed with demo data:

```text
CommandError: The database already has content. Use reset_demo to replace it with the demo content.
```

### `flush_demo`: delete all content

```bash
pipenv run python manage.py flush_demo
```

```text
This will delete all portfolio content in the database (users are kept).
Type 'yes' to continue:
```

Anything but `yes` cancels (`CommandError: Cancelled.`) and nothing is
deleted.

### `reset_demo`: start over

```bash
pipenv run python manage.py reset_demo
```

It asks the same confirmation, then flushes and seeds. Use it after editing
entries in the admin, or when the demo data changes. It also works on an empty
database.

### Options and guarantees

- `--no-input` (or `--noinput`) skips the confirmation, e.g. in a script:
  `pipenv run python manage.py reset_demo --no-input`.
- **Users are kept.** Only portfolio tables are emptied, so the admin account
  and its login survive.
- **Ids restart at 1.** Flushing resets the id counters of the portfolio
  tables, so after every reset the ids are the ones listed below and saved
  requests keep working.
- **All or nothing.** Each command runs in one transaction: if something
  fails, the database is left as it was.

## What gets created

Entries are listed by their English text.

| Resource | Id | Entry | Notes |
|---|---|---|---|
| Profile | 1 | Demo Owner, Software engineer | With a bio and a desired role (Tech lead) |
| Education | 1 | Master's degree, Demo University (2015–2017) | French: Master |
| | 2 | Bachelor's degree, Demo Institute of Technology (2012–2015) | French: Licence |
| Experience | 1 | Backend developer @ Acme Corp | Ongoing (`end_date` null) |
| | 2 | Junior developer @ Globex | Apprenticeship |
| | 3 | Consultant @ Hidden Inc | **Hidden** |
| Project | 1 | Billing platform (Acme) | Tags Python, Django, TDD |
| | 2 | Customer dashboard (Acme) | Ongoing, `display_order` 1 |
| | 3 | Hidden project (Acme) | **Hidden** |
| | 4 | Internal tools (Globex) | Tags Docker, Python |
| | 5 | Project of a hidden experience (Hidden Inc) | Visible, but **hidden** through its experience |
| | 6 | Portfolio | Side project (no experience) |
| Certification | 1 | Professional Scrum Master I | Tag Scrum |
| | 2 | Professional Scrum Product Owner I | Tag Scrum |
| | 3 | Python Developer | Has an `expiration_date` |
| | 4 | Hidden certification | **Hidden** |
| Specialization | 1 | Agile path | Certifications 1, 2 and the hidden 4 |
| Skill | 1, 2 | Python, API design | Python has a note and sits in two categories |
| Tool | 3, 4, 5 | Django, React, Docker | |
| Methodology | 6, 7 | Scrum, TDD | |
| Tag category | 1 | Software engineering | Domain: categories 2 Backend & APIs (Python, Django, API design), 3 Frontend (React), 4 Delivery practices (TDD, Scrum, Docker) |
| | 5 | Data | Domain: categories 6 Data pipelines (Python, Docker), 7 Data products (Django, API design) |
| Hobby | 1 | Climbing | With a description |
| | 2 | Chess | |
| | 3 | Hidden hobby | **Hidden** |
| Commitment | 1 | Treasurer @ Demo Robotics Club | Association, ongoing (`end_date` null), with a location and a URL |
| | 2 | Program organizer @ Demo Dev Conference | Conference organization, `display_order` 1 |
| | 3 | Mentor @ Demo Hackathon | Other event, `display_order` 2 |
| | 4 | Hidden role @ Hidden Association | **Hidden** |
| Scientific communication | 1 | Static analysis for Python services | Talk, `display_order` 0, with a URL |
| | 2 | Type inference at scale | Poster, `display_order` 1 |
| | 3 | Testing REST APIs from their specification | Paper, `display_order` 2, with a URL |
| | 4 | Lessons from migrating a monolith | Article, `display_order` 3, the newest date (2025) but listed last: `display_order` beats the date |
| | 5 | Hidden communication | **Hidden** |

## What to check

Start the server with `pipenv run python manage.py runserver`. Paths are
relative to `http://localhost:8000/api/v1/experience/`; see
[api.md](api.md) for the full API.

| Request | Expected |
|---|---|
| `education/` | Master's degree first, then Bachelor's degree (newest first) |
| `education/1/` | Each text in both languages, e.g. `"degree": {"en": "Master's degree", "fr": "Master"}` |
| `professional-experiences/` | Acme and Globex, not Hidden Inc |
| `professional-experiences/1/` | Projects Billing platform then Customer dashboard, not "Hidden project" |
| `professional-experiences/3/` | `404` |
| `projects/` | Portfolio, Billing platform, Internal tools, then Customer dashboard (`display_order` 1). Not 3 or 5 |
| `projects/3/`, `projects/5/` | `404` |
| `projects/6/` | `"experience": null` |
| `projects/?experience=1` | Billing platform, Customer dashboard |
| `projects/?experience=3` | `[]` |
| `projects/?side_project=true` | Portfolio only |
| `projects/?tag=3` | Portfolio, Billing platform (not project 5) |
| `projects/?tag=python` | `400` |
| `tools/3/` | Projects Portfolio and Billing platform |
| `skills/3/` | `404`: Django is a tool |
| `methodologies/6/` | Certifications 2 then 1, not the hidden one |
| `certifications/?tag=6` | Certifications 2, 1 |
| `tag-categories/` | Software engineering, then Data. Python under Backend & APIs and Data pipelines, with its note; Backend & APIs lists API design, Django, Python |
| `tag-categories/2/` | `404`: Backend & APIs is a category, not a domain |
| `certifications/1/` | `specializations: [{"id": 1, "name": {"en": "Agile path", "fr": "Parcours agile"}}]` |
| `specializations/1/` | Certifications 2, 1, not the hidden one |
| `hobbies/` | Chess, then Climbing (same `display_order`, so by English name). Not 3 |
| `hobbies/3/` | `404` |
| `commitments/` | Commitments 1, 2, 3 (by `display_order`), one of each `kind`. Not 4 |
| `commitments/1/` | `"is_current": true`, with `location` and `url` |
| `commitments/4/` | `404` |
| `scientific-communications/` | Communications 1, 2, 3, 4 (by `display_order`, although 4 is the newest), one of each `kind`. Not 5. No `description` |
| `scientific-communications/5/` | `404` |
| `/api/v1/profile/` (absolute path) | Demo Owner, with headline, bio and desired role in both languages |

No response should contain `is_visible`, `display_order`, `created_at` or
`updated_at`.

To try the admin login, see [auth.md](auth.md).
