# Testing

The backend is developed test-first: each behavior gets a failing test before
any implementation code is written.

## Running the tests

```bash
pipenv run pytest            # whole suite
pipenv run pytest -q         # compact output
pipenv run pytest experience/tests/test_tags.py -k skill   # one file, one kind
```

[pytest-django](https://pytest-django.readthedocs.io/) reads its settings from
[`pytest.ini`](../pytest.ini) and runs every test against a fresh test
database, rolled back after each test.

To see which lines the tests reach (configured in [`.coveragerc`](../.coveragerc)):

```bash
pipenv run pytest --cov --cov-report=term-missing
```

## Continuous integration

[`backend-ci.yml`](../../.github/workflows/backend-ci.yml) runs on every pull
request and every push to `main` that touches `backend/`. The job fails at the
first step that fails:

| Step | Run locally with |
|---|---|
| Lint | `pipenv run ruff check .` |
| Formatting | `pipenv run ruff format --check .` (fix with `ruff format .`) |
| Django system check | `pipenv run python manage.py check` |
| Missing migrations | `pipenv run python manage.py makemigrations --check --dry-run` |
| Tests with coverage | `pipenv run pytest --cov --cov-report=term-missing` |

Dependencies are installed with `pipenv install --dev --deploy`, so CI also
fails if `Pipfile.lock` is out of date. There is no `.env` in CI: the workflow
sets a throwaway `SECRET_KEY` and `DEBUG=False`.

## Demo data for manual testing

To try the API by hand, fill the local database with fictional content:

```bash
pipenv run python manage.py reset_demo
```

See [demo_data.md](demo_data.md) for the three commands (`seed_demo`,
`flush_demo`, `reset_demo`), the data they create and what to check.

## Layout

Tests live in each app's `tests/` folder, one file per API resource. Shared
fixtures are in [`conftest.py`](../conftest.py) at the backend root
(`api_client`, and a fast password hasher applied to every test).

| File | Covers |
|---|---|
| [`accounts/tests/test_auth.py`](../accounts/tests/test_auth.py) | `api/v1/auth/`: JWT login, refresh, logout, `users/me/`, `set_password`, and routes that are not exposed |
| [`test_api_root.py`](../experience/tests/test_api_root.py) | `api/v1/experience/` (the list of collections) |
| [`test_admin.py`](../experience/tests/test_admin.py) | Django admin pages of every content model |
| [`test_education.py`](../experience/tests/test_education.py) | `education/` |
| [`test_professional_experiences.py`](../experience/tests/test_professional_experiences.py) | `professional-experiences/` |
| [`test_projects.py`](../experience/tests/test_projects.py) | `projects/` (with `?experience=`, `?side_project=` and `?tag=` filters) |
| [`test_certifications.py`](../experience/tests/test_certifications.py) | `certifications/` (with `?tag=` filter) |
| [`test_specializations.py`](../experience/tests/test_specializations.py) | `specializations/` |
| [`test_tags.py`](../experience/tests/test_tags.py) | `skills/`, `tools/`, `methodologies/` |
| [`test_demo_commands.py`](../experience/tests/test_demo_commands.py) | The `seed_demo`, `flush_demo` and `reset_demo` management commands |

Each file starts with a docstring summarizing the behavior it pins down, and
each test has a one-line docstring explaining why it exists.

## Conventions

- **Tests go through HTTP.** They call the endpoints with DRF's `APIClient`
  and check the JSON, so serializers and views can be refactored freely.
- **URLs are built with `reverse()`** from namespaced names
  (`experience:education-list`). A single `test_routes` per file checks the
  literal paths.
- **`make_<model>(**kwargs)` helpers** create rows with sensible defaults;
  a test only passes the fields it cares about.
- **Detail responses are compared as a whole** (`response.json() == {...}`),
  so adding or leaking a field makes the test fail.
- **Resources that behave alike share one parametrized test file** (e.g. the
  three tag kinds), so each test runs once per resource.

## Rules every endpoint is tested against

The API is public and read-only; content is managed in the Django admin.

| Rule | Expected |
|---|---|
| List of a resource | `200` with a plain JSON list (no pagination) |
| Hidden entry (`is_visible=False`) | Left out of lists and nested lists, `404` on its detail route |
| Project of a hidden experience | Hidden like the experience, wherever projects appear |
| Unknown id | `404` |
| Filter on an unknown id (e.g. `?tag=999`) | `200` with an empty list |
| Filter with an invalid id: not an integer (`?tag=python`) or outside `1..2**63-1` (`?tag=-1`) | `400` |
| List filters on a detail route (e.g. `projects/5/?tag=999`) | Ignored |
| `POST` on a list, `PUT`/`PATCH`/`DELETE` on a detail | `405` |
| Internal fields (`is_visible`, `display_order`, `created_at`, `updated_at`) | Never returned |
| Ordering | `display_order`, then newest date (`start_date` or `issue_date`) |
