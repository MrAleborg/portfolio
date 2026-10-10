# Resume import

The Django admin can fill or refresh the whole database from one JSON file:
the resume of another environment, or a file generated for the admin API. The
code is in [`experience/resume_import.py`](../experience/resume_import.py)
(the import) and [`experience/admin_import.py`](../experience/admin_import.py)
(the page).

## Use

1. As a superuser, open `/admin/` and follow **Import resume**
   (`/admin/import-resume/`). Other staff users get a 403.
2. Choose the file (JSON, 5 MB at most) and press **Import**.
3. On success, the admin index shows how many records were created and updated
   per section. Otherwise, the page lists each problem, like
   `projects[2].title.fr: This field is required.`, and nothing is written.

To copy one environment to another:
`curl https://<host>/api/v1/resume/ > resume.json`, then import `resume.json`.

## File format

The file is one JSON object. Each key below is optional: a missing section
(or `"profile": null`) leaves its records as they are. Other keys, such as
`_meta`, are ignored.

The file can take two shapes, which may be mixed, even within a section:

- **Resume shape**: exactly what `GET /api/v1/resume/` returns (see
  [api.md](api.md)). Relations are nested objects (`"experience": {"id": 5,
  ...}`), tag categories are a tree, and internal fields are absent, since the
  resume hides them.
- **Admin API shape**: records as the admin API reads and writes them (see
  [admin_api.md](admin_api.md)). Relations are ids (`"experience": 5`,
  `"tags": [1, 2]`), tag categories are a flat list, and internal fields
  (`display_order`, `is_visible`, `position`) may be given.

### Values

- **Ids** are integers from 1. Every record but the profile needs one, unique
  within its section (tag categories: across domains and categories; tags:
  across `skills`, `tools` and `methodologies`).
- **Translated texts** are objects with every language:
  `{"en": "Developer", "fr": "Développeur"}`. A required text is filled in
  every language; an optional one is filled in every language or empty in
  all of them (`{"en": "", "fr": ""}`).
- **Dates** are `"YYYY-MM-DD"`. An end date (`end_date`, `expiration_date`)
  may be `null` (ongoing, never expiring) and cannot be before the start date.
- **A reference** to another record is its id, or an object holding it
  (`{"id": 5, ...}`; the other fields are ignored). It must point to a record
  in the file or already in the database.
- Other fields follow the [admin API's writing rules](admin_api.md#writing-rules):
  the same required fields, lengths and choices.

### Sections

Required fields are in **bold**. "Internal" fields are optional: left out,
they keep their stored value, or take their default on creation.

| Key | Records | Fields |
|---|---|---|
| `profile` | One object, no `id` | **`full_name`**, **`headline`** (text), `bio` (optional text), `desired_role` (optional text) |
| `education` | List | **`id`**, **`institution`**, **`degree`** (text), `field_of_study`, `grade`, `location`, `description` (optional texts), **`start_date`**, `end_date`; internal: `display_order`, `is_visible` |
| `professional_experiences` | List | **`id`**, **`company`**, **`position`** (text), `employment_type` (`full_time`, the default, `part_time`, `contract`, `freelance`, `internship`, `apprenticeship`), `company_url`, `location`, `description` (optional texts), **`start_date`**, `end_date`; internal: `display_order`, `is_visible`. `projects` is ignored. |
| `projects` | List | **`id`**, **`title`** (text), `description` (optional text), **`start_date`**, `end_date`, `experience` (a reference, or `null` for a side project), `achievements` and `missions` (lists of texts, in display order), `tags` (references); internal: `display_order`, `is_visible` |
| `certifications` | List | **`id`**, **`name`** (text), **`issuer`**, **`issue_date`**, `expiration_date`, `credential_id`, `credential_url`, `description` (optional text), `tags` (references); internal: `display_order`, `is_visible`. `specializations` is ignored. |
| `specializations` | List | The fields of a certification, with `certifications` (references) instead of `tags` |
| `skills`, `tools`, `methodologies` | List: the tags of that kind | **`id`**, **`name`** (text); admin API shape: `note` (optional text), `categories` (category ids) |
| `tag_categories` | List | See below |
| `hobbies` | List | **`id`**, **`name`** (text), `description` (optional text); internal: `display_order`, `is_visible` |
| `commitments` | List | **`id`**, `kind` (`association`, the default, `conference_organization`, `other_event`), **`organization`**, **`role`** (text), `location`, `description` (optional texts), `url`, **`start_date`**, `end_date`; internal: `display_order`, `is_visible` |
| `scientific_communications` | List | **`id`**, **`kind`** (`talk`, `poster`, `paper`, `article`), **`title`** (text), **`authors`**, **`venue`**, **`date`**, `url`; internal: `description` (optional text), `display_order`, `is_visible` |

`is_current` is computed from `end_date`: it is ignored wherever it appears.

### Tags

A tag is defined by its `id`, `name` and kind. The kind comes from the
section listing it (`skills`, `tools`, `methodologies`) or from its `kind`
field (`skill`, `tool`, `methodology`) where it is nested. A tag can appear
in several places; they must agree on its name, kind and note.

- In `projects[].tags` and `certifications[].tags`, a tag is an object
  (resume shape: `{"id": 1, "name": {...}, "kind": "skill"}`, which also
  defines it) or a bare id (admin API shape, a reference only).
- A new tag needs a kind, so it must appear in a section or with its `kind`.
  An existing tag given another kind changes kind.

### Tag categories

Domains hold categories, and categories hold tags; the tree has two levels.

Resume shape: a list of domains, each with its categories as `children`, each
with its tags (which carry `kind` and `note`):

```json
"tag_categories": [
  {
    "id": 1,
    "name": {"en": "Software Engineering", "fr": "Génie logiciel"},
    "children": [
      {
        "id": 9,
        "name": {"en": "Languages", "fr": "Langages"},
        "tags": [
          {"id": 37, "name": {"en": "Python", "fr": "Python"}, "kind": "skill", "note": {"en": "", "fr": ""}}
        ]
      }
    ]
  }
]
```

Admin API shape: a flat list, where a domain's `parent` is `null` and a
category's is its domain's id; tags list their categories themselves:

```json
"tag_categories": [
  {"id": 1, "name": {"en": "Software Engineering", "fr": "Génie logiciel"}, "parent": null, "position": 0},
  {"id": 9, "name": {"en": "Languages", "fr": "Langages"}, "parent": 1, "position": 1}
],
"skills": [
  {"id": 37, "name": {"en": "Python", "fr": "Python"}, "categories": [9], "note": {"en": "", "fr": ""}}
]
```

`position` is optional (lower first). A tag's categories are the union of the
categories listing it and the ones it lists.

### Example: a project in each shape

Resume shape:

```json
{
  "id": 4,
  "title": {"en": "Cloud simulation", "fr": "Simulation cloud"},
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "is_current": false,
  "description": {"en": "", "fr": ""},
  "achievements": [{"en": "Won an award", "fr": "Prix obtenu"}],
  "experience": {"id": 1, "company": "Huawei", "position": {"en": "Engineer", "fr": "Ingénieur"}},
  "missions": [{"en": "Designed the simulator", "fr": "Conception du simulateur"}],
  "tags": [{"id": 37, "name": {"en": "Python", "fr": "Python"}, "kind": "skill"}]
}
```

Admin API shape:

```json
{
  "id": 4,
  "title": {"en": "Cloud simulation", "fr": "Simulation cloud"},
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "description": {"en": "", "fr": ""},
  "achievements": [{"en": "Won an award", "fr": "Prix obtenu"}],
  "experience": 1,
  "missions": [{"en": "Designed the simulator", "fr": "Conception du simulateur"}],
  "tags": [37],
  "display_order": 3,
  "is_visible": true
}
```

## What an import writes

- Records are matched by `id`: a known id is overwritten, an unknown id is
  created with that id. Records absent from the file are kept, hidden ones
  included (the resume never lists hidden entries).
- All or nothing: every record is validated by the admin API serializers, so
  with the same rules as an edit, and a single invalid record cancels the
  whole import.
- Fields the file leaves out are kept on update and take their default on
  create. A resume never gives `is_visible`, `display_order`, the position of
  tag categories nor the description of scientific communications, so it
  keeps them.
- Each piece of data is read from one place, since the resume repeats some:

| Data | Read from | Ignored |
|---|---|---|
| A project, its experience, missions, achievements and tags | `projects` | `professional_experiences[].projects` |
| The certifications of a specialization | `specializations[].certifications` | `certifications[].specializations` |
| A tag's name and kind | `skills`, `tools`, `methodologies`, and the tags nested in `projects`, `certifications` and `tag_categories` | |
| A tag's note and categories | `tag_categories`, and the tag's own `note` and `categories` | |

- Lists are replaced by what the file lists: missions (in the file's order),
  achievements and the tags of projects and certifications. Two lists keep
  their links to records the file cannot show: a specialization in the resume
  shape (without `is_visible`) keeps its hidden certifications, and a tag in
  the file keeps its categories absent from the file (a tag in the file but in none of the file's categories loses
  those).
- Categories may move between domains, or become domains, in one import. The
  tree as imported must keep two levels: a category's parent is a domain, and
  only categories (not domains) have tags.
