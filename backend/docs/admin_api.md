# Admin API

The admin API lets the site admin create, edit and delete all portfolio
content from the frontend. It lives in
[`experience/admin_api/`](../experience/admin_api/), next to the public API
([api.md](api.md)), which stays read-only.

Every path below is relative to the base URL `/api/v1/admin/`.

## Access

Every route, including the root, needs the access token of a staff user (see
[auth.md](auth.md)):

```http
GET /api/v1/admin/projects/
Authorization: Bearer <access>
```

| Case | Response |
|---|---|
| No token | `401` |
| Token of a user who is not staff | `403` |
| Invalid or expired token | `401` |

Access is checked before the entry is looked up, so an unknown id gets the
same answers.

## Endpoints

| Path | Resource |
|---|---|
| `/` | Links to every collection below |
| `education/` | Degrees and schools |
| `professional-experiences/` | Jobs |
| `projects/` | Work projects and side projects, with their missions |
| `certifications/` | Certifications |
| `specializations/` | Specializations (paths of certifications) |
| `skills/`, `tools/`, `methodologies/` | Tags of each kind |

Each collection supports:

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `{collection}/` | | `200` with a plain JSON list |
| `POST` | `{collection}/` | The entry | `201` with the created entry |
| `GET` | `{collection}/{id}/` | | `200` with the entry |
| `PUT` | `{collection}/{id}/` | The entry | `200` with the updated entry |
| `PATCH` | `{collection}/{id}/` | Only the fields to change | `200` with the updated entry |
| `DELETE` | `{collection}/{id}/` | | `204` |

Send bodies as JSON (`Content-Type: application/json`).

## Differences from the public API

- **Hidden entries are included**, in lists and on detail routes. Hide or show
  an entry with `PATCH {"is_visible": false}`.
- **Internal fields are returned**: `display_order` and `is_visible` can be
  written; `created_at` and `updated_at` are read-only.
- **Relations are ids**, in reads and writes alike: `"experience": 3`,
  `"tags": [2, 9]`. Nothing is nested.
- **No list filters.** Lists have the same order as on the public site:
  `display_order`, then newest date. Tags are ordered by English name.

## Writing rules

- `id`, `is_current`, `created_at` and `updated_at` are read-only: they are
  ignored if sent.
- `POST` and `PUT` need every required field. With `PUT`, an optional field
  that is left out keeps its stored value; send it to change it.
- A missing or invalid field is a `400` that names each field in error:

  ```json
  {"start_date": ["This field is required."], "tags": ["Invalid pk \"999\" - object does not exist."]}
  ```

- **Translated texts** are read and written in every language at once, in
  the same shape as the public API ([api.md](api.md#common-behavior) lists
  the translated fields):

  ```json
  {"position": {"en": "Backend developer", "fr": "Développeur backend"}}
  ```

  - A required text (e.g. `degree`, `title`, `name`) must be filled in every
    language.
  - An optional text (e.g. `grade`, `location`, `description`) is either
    filled in every language or empty in all of them. Left out on creation,
    it is empty: `{"en": "", "fr": ""}`.
  - Every language must be sent, even to change only one: a `PATCH` sets the
    whole field. Unknown languages are refused. Texts are trimmed.
  - Errors are reported per language, so a form can show them next to the
    right input:

    ```json
    {"degree": {"fr": ["This field may not be blank."]}, "grade": {"en": ["Fill in every language, or leave them all empty."]}}
    ```

  The database enforces the "every language or none" rule too, so the Django
  admin applies it.

- **Dates**: `end_date` cannot be before `start_date`, and `expiration_date`
  cannot be before `issue_date` (the same day is allowed, `null` means ongoing
  or never expiring). The error is reported on the end field. A `PATCH` that
  sends only one of the two dates is checked against the stored one. The
  database enforces the same rules (see
  [database.md](database.md)), so the Django admin applies them too.

## Resources

The examples show a detail response; lists return arrays of the same objects.
Every entry except tags also has `display_order`, `is_visible`, `created_at`
and `updated_at`, left out of the examples below:

```json
{"display_order": 0, "is_visible": true, "created_at": "2026-09-25T10:00:00.000000Z", "updated_at": "2026-09-25T10:00:00.000000Z"}
```

### `education/`

Required: `institution`, `degree`, `start_date`.

```json
{
  "id": 1,
  "institution": "Université de Rennes",
  "degree": {"en": "Master's degree", "fr": "Master"},
  "field_of_study": {"en": "Computer Science", "fr": "Informatique"},
  "grade": {"en": "", "fr": ""},
  "location": {"en": "Rennes", "fr": "Rennes"},
  "start_date": "2015-09-01",
  "end_date": "2017-06-30",
  "is_current": false,
  "description": {"en": "", "fr": ""}
}
```

### `professional-experiences/`

Required: `company`, `position`, `start_date`. `employment_type` is one of
`full_time` (default), `part_time`, `contract`, `freelance`, `internship`,
`apprenticeship`. Projects are not nested: they are edited on `projects/`.

**Deleting an experience deletes its projects** (and their missions).

```json
{
  "id": 3,
  "company": "Acme",
  "position": {"en": "Backend developer", "fr": "Développeur backend"},
  "employment_type": "full_time",
  "company_url": "https://acme.example",
  "location": {"en": "Paris", "fr": "Paris"},
  "start_date": "2021-01-04",
  "end_date": null,
  "is_current": true,
  "description": {"en": "", "fr": ""}
}
```

### `projects/`

Required: `title`, `start_date`.

- `experience`: the id of a professional experience, or `null` for a side
  project (the default).
- `tags`: ids of tags of any kind.
- `achievements`: a list of texts, each filled in every language.
- `missions`: a list of texts, each filled in every language, in display
  order. **Sending
  `missions` replaces all of them**: to add, remove, edit or reorder missions,
  send the whole new list. `[]` removes them all. A request that leaves
  `missions` out does not change them.

```json
{
  "id": 5,
  "title": {"en": "Billing platform", "fr": "Plateforme de facturation"},
  "start_date": "2021-02-01",
  "end_date": "2022-06-30",
  "is_current": false,
  "description": {"en": "", "fr": ""},
  "achievements": [
    {"en": "Cut invoice generation time by half", "fr": "Temps de facturation divisé par deux"}
  ],
  "experience": 3,
  "missions": [
    {"en": "Design the REST API", "fr": "Concevoir l'API REST"},
    {"en": "Write the tests", "fr": "Écrire les tests"}
  ],
  "tags": [2, 9]
}
```

### `certifications/`

Required: `name`, `issuer`, `issue_date`. `tags` is a list of tag ids.
`specializations` is read-only: add a certification to a specialization on
`specializations/`.

```json
{
  "id": 7,
  "name": {"en": "Professional Scrum Master I", "fr": "Professional Scrum Master I"},
  "issuer": "Scrum.org",
  "issue_date": "2023-05-12",
  "expiration_date": null,
  "credential_id": "123456",
  "credential_url": "https://www.scrum.org/certificates/123456",
  "description": {"en": "", "fr": ""},
  "tags": [9],
  "specializations": [1]
}
```

### `specializations/`

Required: `name`, `issuer`, `issue_date`. `certifications` is the list of ids
of the certifications on its path.

```json
{
  "id": 1,
  "name": {"en": "Agile path", "fr": "Parcours agile"},
  "issuer": "Scrum.org",
  "issue_date": "2024-01-15",
  "expiration_date": null,
  "credential_id": "",
  "credential_url": "",
  "description": {"en": "", "fr": ""},
  "certifications": [7]
}
```

### `skills/`, `tools/`, `methodologies/`

A tag only has a `name` (required); its kind is the route it is created on.

```json
{"id": 12, "name": {"en": "API design", "fr": "Conception d'API"}}
```

- A name is unique within its kind, in each language: a duplicate is a `400`
  on the clashing language, e.g.
  `{"name": {"fr": ["A skill with this name already exists."]}}`. A skill and
  a tool may share a name.
- Tag ids are shared across kinds, but each route only reaches its own kind:
  a tool's id under `skills/` is a `404`.
- Deleting a tag removes it from the projects and certifications that used it.
