# API

The API is public and read-only. It is built with Django REST Framework in the
`experience` app ([`experience/urls.py`](../experience/urls.py),
[`experience/views.py`](../experience/views.py),
[`experience/serializers.py`](../experience/serializers.py)). Content is
managed through the [admin API](admin_api.md) (`/api/v1/admin/`, for the
frontend) or the Django admin (`/admin/`).

Every path below is relative to the base URL `/api/v1/experience/`, except the
owner's [profile](#profile-apiv1profile), which is in the `owner` app.

## Endpoints

| Path | Returns | List filters |
|---|---|---|
| `/` | Links to every collection below | |
| `education/`, `education/{id}/` | Degrees and schools | |
| `professional-experiences/`, `professional-experiences/{id}/` | Jobs, with their projects nested | |
| `projects/`, `projects/{id}/` | Work projects and side projects | `experience`, `side_project`, `tag` |
| `certifications/`, `certifications/{id}/` | Certifications | `tag` |
| `specializations/`, `specializations/{id}/` | Specializations (paths of certifications) | |
| `skills/`, `skills/{id}/` | Skill tags | |
| `tools/`, `tools/{id}/` | Tool tags | |
| `methodologies/`, `methodologies/{id}/` | Methodology tags | |

## Common behavior

| Case | Response |
|---|---|
| `GET` a list | `200` with a plain JSON list (no pagination) |
| `GET` a detail | `200` with one object |
| Unknown id, or hidden entry | `404` |
| `POST`, `PUT`, `PATCH`, `DELETE` | `405` |
| Filter on an id that matches nothing (`?tag=999`) | `200` with an empty list |
| Filter with an invalid id: not an integer (`?tag=python`) or outside `1..2**63-1` (`?tag=-1`) | `400`, e.g. `{"tag": ["A valid tag id is required."]}` |
| List filters on a detail route (`projects/5/?tag=999`) | Ignored |

- **Hidden entries never appear.** Entries with `is_visible=False` are left out
  of lists and nested lists. A project whose professional experience is hidden
  is hidden too, wherever projects appear.
- **Internal fields are never returned**: `is_visible`, `display_order`,
  `created_at`, `updated_at`.
- **Ordering**: `display_order`, then newest first (`start_date` or
  `issue_date`). Tags are ordered by kind, then English name. Nested lists
  follow the same order.
- **Dates** are ISO 8601 strings (`"2024-03-01"`). A null `end_date` means the
  entry is ongoing, and `is_current` is then `true`.
- **Translated texts** are returned in every language at once, so the
  frontend shows the visitor's language and can switch without a new request:

  ```json
  "position": {"en": "Backend developer", "fr": "Développeur backend"}
  ```

  The languages are `en` and `fr`. A text is filled in every language, or
  empty (`""`) in every language. Proper nouns, codes, URLs and dates are not
  translated: `institution`, `company`, `issuer`, `credential_id`, the URLs,
  `employment_type` (a code the frontend labels) and `kind`.

  | Resource | Translated fields |
  |---|---|
  | Education | `degree`, `field_of_study`, `grade`, `location`, `description` |
  | Professional experience | `position`, `location`, `description` |
  | Project | `title`, `description`, each item of `achievements` and `missions` |
  | Certification, specialization | `name`, `description` |
  | Tag | `name` |

These rules are pinned down by the test suite; see
[testing.md](testing.md#rules-every-endpoint-is-tested-against).

## Resources

The examples show a detail response. The list of a resource returns an array of
the same objects, except for tags (see [Tags](#skills-tools-methodologies)).

### `education/`

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

`employment_type` is one of `full_time`, `part_time`, `contract`, `freelance`,
`internship`, `apprenticeship`. `projects` holds the experience's visible
projects, in the same shape as [`projects/`](#projects) without the
`experience` field.

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
  "description": {"en": "", "fr": ""},
  "projects": [
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
      "missions": [{"en": "Design the REST API", "fr": "Concevoir l'API REST"}],
      "tags": [{"id": 2, "name": {"en": "Django", "fr": "Django"}, "kind": "tool"}]
    }
  ]
}
```

### `projects/`

`experience` is `null` for a side project. `missions` and `achievements` are
lists of translated texts. `tags` mixes the three kinds, so each tag carries its `kind`
(`skill`, `tool` or `methodology`).

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
  "experience": {
    "id": 3,
    "company": "Acme",
    "position": {"en": "Backend developer", "fr": "Développeur backend"}
  },
  "missions": [{"en": "Design the REST API", "fr": "Concevoir l'API REST"}],
  "tags": [{"id": 2, "name": {"en": "Django", "fr": "Django"}, "kind": "tool"}]
}
```

List filters (they can be combined):

| Parameter | Keeps |
|---|---|
| `?experience={id}` | Projects of that professional experience |
| `?side_project=true` | Side projects only (no experience) |
| `?side_project=false` | Work projects only; any other value is a `400` |
| `?tag={id}` | Projects tagged with that tag (any kind) |

### `certifications/`

`specializations` lists the visible specializations the certification is part
of.

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
  "tags": [{"id": 9, "name": {"en": "Scrum", "fr": "Scrum"}, "kind": "methodology"}],
  "specializations": [{"id": 1, "name": {"en": "Agile path", "fr": "Parcours agile"}}]
}
```

List filter: `?tag={id}` keeps the certifications tagged with that tag.

### `specializations/`

`certifications` lists the visible certifications on the specialization's
path.

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
  "certifications": [
    {"id": 7, "name": {"en": "Professional Scrum Master I", "fr": "Professional Scrum Master I"}}
  ]
}
```

### `skills/`, `tools/`, `methodologies/`

The three tag kinds behave the same way; each only returns tags of its kind.
The list only includes tags used by at least one visible project or
certification, so a tag that only tags hidden entries (or nothing) is left out.
It returns `id` and `name`:

```json
[
  {"id": 12, "name": {"en": "API design", "fr": "Conception d'API"}},
  {"id": 2, "name": {"en": "Python", "fr": "Python"}}
]
```

The detail adds the visible projects and certifications tagged with it, so the
frontend can show everything related to a tag:

```json
{
  "id": 2,
  "name": {"en": "Django", "fr": "Django"},
  "projects": [
    {"id": 5, "title": {"en": "Billing platform", "fr": "Plateforme de facturation"}}
  ],
  "certifications": []
}
```

Tag ids are shared across kinds (they are rows of one `Tag` table, see
[database.md](database.md#tags-tools-methodologies-and-skills)), so the id
returned by `tools/` can be passed as `?tag=` to `projects/` or
`certifications/`. Requesting a tool's id under `skills/` is a `404`.

## Profile: `/api/v1/profile/`

Who the portfolio belongs to, from the `owner` app
([`owner/urls.py`](../owner/urls.py), [`owner/views.py`](../owner/views.py),
[`owner/serializers.py`](../owner/serializers.py)). There is a single profile,
so the route has no id, and no list.

```json
{
  "full_name": "Ada Lovelace",
  "headline": {"en": "Analyst", "fr": "Analyste"},
  "bio": {"en": "I write programs.", "fr": "J’écris des programmes."}
}
```

- `headline` and `bio` are translated; `full_name` is not. `bio` may be empty
  in every language.
- `404` until the profile is created through the
  [admin API](admin_api.md#profile-apiv1adminprofile). Write methods are
  `405`.
