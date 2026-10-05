# Resume import

The Django admin can fill or refresh the whole database from one JSON file in
the format of `GET /api/v1/resume/` (see [api.md](api.md)), for example the
resume of another environment. The code is in
[`experience/resume_import.py`](../experience/resume_import.py) (the import)
and [`experience/admin_import.py`](../experience/admin_import.py) (the page).

## Use

1. As a superuser, open `/admin/` and follow **Import resume**
   (`/admin/import-resume/`). Other staff users get a 403.
2. Choose the file (JSON, 5 MB at most) and press **Import**.
3. On success, the admin index shows how many records were created and updated
   per section. Otherwise, the page lists each problem, like
   `projects[2].title.fr: This field is required.`, and nothing is written.

To copy one environment to another:
`curl https://<host>/api/v1/resume/ > resume.json`, then import `resume.json`.

## What an import writes

- Records are matched by `id`: a known id is overwritten, an unknown id is
  created with that id. Records absent from the file are kept, hidden ones
  included (the resume never lists hidden entries).
- All or nothing: every record is validated by the admin API serializers, so
  with the same rules as an edit, and a single invalid record cancels the
  whole import.
- Fields the resume does not show are kept on update and take their default
  on create: `is_visible`, `display_order`, the position of tag categories and
  the description of scientific communications. `is_current` is computed, so
  ignored.
- Each piece of data is read from one place, since the resume repeats some:

| Data | Read from | Ignored |
|---|---|---|
| A project, its experience, missions, achievements and tags | `projects` | `professional_experiences[].projects` |
| The certifications of a specialization | `specializations[].certifications` | `certifications[].specializations` |
| A tag's name and kind | `skills`, `tools`, `methodologies`, and the tags nested in `projects`, `certifications` and `tag_categories` | |
| A tag's note and categories | `tag_categories` | |

- Lists are replaced by what the file lists: missions (in the file's order),
  achievements and the tags of projects and certifications. Two lists keep
  their links to records the file cannot show: a specialization keeps its
  hidden certifications, and a tag in the file keeps its categories absent
  from the file (a tag in the file but in none of the file's categories loses
  those).
- A reference (experience, tag or certification id) must be in the file or
  already in the database. A new tag needs a kind, which every export gives.
  A tag given two different names or kinds is refused; an existing tag given
  another kind changes kind.
- Categories may move between domains, or become domains, in one import. The
  tree as imported must keep two levels: a category's parent is a domain, and
  only categories (not domains) have tags.
