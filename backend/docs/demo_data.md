# Demo data

Three management commands fill the local database with fictional content, so
the API can be tried by hand (in a browser, curl or Insomnia) without typing
entries into the Django admin. The data includes hidden entries, to check that
the API leaves them out.

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
cp .env.example .env                          # then set SECRET_KEY, and DEBUG=True
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

| Resource | Id | Entry | Notes |
|---|---|---|---|
| Education | 1 | Master, Demo University (2015–2017) | |
| | 2 | Bachelor, Demo Institute of Technology (2012–2015) | |
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
| Skill | 1, 2 | Python, API design | |
| Tool | 3, 4, 5 | Django, React, Docker | |
| Methodology | 6, 7 | Scrum, TDD | |

## What to check

Start the server with `pipenv run python manage.py runserver`. Paths are
relative to `http://localhost:8000/api/v1/experience/`; see
[api.md](api.md) for the full API.

| Request | Expected |
|---|---|
| `education/` | Master first, then Bachelor (newest first) |
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
| `certifications/1/` | `specializations: [{"id": 1, "name": "Agile path"}]` |
| `specializations/1/` | Certifications 2, 1, not the hidden one |

No response should contain `is_visible`, `display_order`, `created_at` or
`updated_at`.

To try the admin login, see [auth.md](auth.md).
