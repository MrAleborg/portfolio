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

## Layout

Tests live in [`experience/tests/`](../experience/tests/), one file per API
resource:

| File | Covers |
|---|---|
| [`conftest.py`](../experience/tests/conftest.py) | Shared fixtures (`api_client`) |
| [`test_education.py`](../experience/tests/test_education.py) | `education/` |
| [`test_certifications.py`](../experience/tests/test_certifications.py) | `certifications/` (with `?tag=` filter) |
| [`test_specializations.py`](../experience/tests/test_specializations.py) | `specializations/` |
| [`test_tags.py`](../experience/tests/test_tags.py) | `skills/`, `tools/`, `methodologies/` |

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
| Hidden entry (`is_visible=False`) | Left out of lists, `404` on its detail route |
| Unknown id | `404` |
| Filter on an unknown id (e.g. `?tag=999`) | `200` with an empty list |
| Filter with a non-integer id (e.g. `?tag=python`) | `400` |
| `POST` on a list, `PUT`/`PATCH`/`DELETE` on a detail | `405` |
| Internal fields (`is_visible`, `display_order`, `created_at`, `updated_at`) | Never returned |
| Ordering | `display_order`, then newest date (`start_date` or `issue_date`) |
