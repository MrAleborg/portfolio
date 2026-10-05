"""Import a resume file (the JSON of GET /api/v1/resume/) into the database.

Records are matched by id: a known id is overwritten, an unknown id is created
with that id, and records absent from the file are kept. Fields the resume
does not show (is_visible, display_order, ...) are kept on update. Records are
validated and saved with the admin API serializers, so an import follows the
same rules as an edit. It is all or nothing: on any problem, nothing is
written and ResumeImportError lists every problem found.

The resume shows some data in several places; each piece is read from one:
- a project's experience from the top-level projects (the projects nested in
  professional_experiences are ignored);
- the certifications of a specialization from the specializations (the
  specializations listed by a certification are ignored);
- a tag's name and kind from the skills, tools and methodologies, and from
  the tags nested in projects and certifications; its note and categories
  from tag_categories.
"""

from dataclasses import dataclass, field

from django.db import transaction

from experience.admin_api import serializers
from experience.models import (
    Certification,
    Commitment,
    Education,
    Hobby,
    ProfessionalExperience,
    Project,
    ScientificCommunication,
    Specialization,
    Tag,
    TagCategory,
)
from owner.admin_api.serializers import ProfileSerializer
from owner.models import Profile

LIST_SECTIONS = [
    "education",
    "certifications",
    "professional_experiences",
    "projects",
    "specializations",
    "skills",
    "tools",
    "methodologies",
    "tag_categories",
    "hobbies",
    "commitments",
    "scientific_communications",
]

TAG_SECTIONS = {
    "skills": Tag.Kind.SKILL,
    "tools": Tag.Kind.TOOL,
    "methodologies": Tag.Kind.METHODOLOGY,
}

TAG_SERIALIZERS = {
    Tag.Kind.SKILL: serializers.SkillSerializer,
    Tag.Kind.TOOL: serializers.ToolSerializer,
    Tag.Kind.METHODOLOGY: serializers.MethodologySerializer,
}

# Shown by the resume but computed, so never written.
DERIVED_FIELDS = {"id", "is_current"}


class ResumeImportError(Exception):
    """The file cannot be imported; nothing was written.

    `errors` maps a section to its problems, DRF style: section -> index in the
    file's list -> field -> messages. Profile errors are keyed by field
    directly, and tag errors by tag id, since tags come from several sections.
    """

    def __init__(self, errors):
        super().__init__(errors)
        self.errors = errors


@dataclass
class ImportReport:
    """What an import wrote: section -> (created, updated)."""

    sections: dict[str, tuple[int, int]] = field(default_factory=dict)

    @property
    def total_created(self):
        return sum(created for created, _ in self.sections.values())

    @property
    def total_updated(self):
        return sum(updated for _, updated in self.sections.values())


def import_resume(data) -> ImportReport:
    """Write `data`, a resume file, to the database (see the module docstring).

    Raises ResumeImportError, having written nothing, if any record is invalid.
    """
    if not isinstance(data, dict):
        raise ResumeImportError(
            {"non_field_errors": ["Expected an object, as GET /api/v1/resume/ gives."]}
        )
    errors = {
        key: ["Expected a list."]
        for key in LIST_SECTIONS
        if not isinstance(data.get(key, []), list)
    }
    if errors:
        raise ResumeImportError(errors)
    importer = _Importer(data)
    with transaction.atomic():
        importer.run()
        if importer.errors:
            # Roll back what was saved before the first error was found.
            raise ResumeImportError(importer.errors)
    return importer.report


def _ref(value):
    """The id of a nested record ({"id": ..., ...}); anything else as given,
    for the serializer to refuse."""
    return value.get("id") if isinstance(value, dict) else value


def _is_id(value):
    return isinstance(value, int) and not isinstance(value, bool) and value > 0


class _Importer:
    def __init__(self, data):
        self.data = data
        self.errors = {}
        self.report = ImportReport()

    def run(self):
        # Dependency order: a record is saved after those it refers to.
        self.import_tag_categories()
        self.import_tags()
        self.import_section(
            "professional_experiences",
            ProfessionalExperience,
            serializers.ProfessionalExperienceSerializer,
            ignored={"projects"},
        )
        self.import_section(
            "projects",
            Project,
            serializers.ProjectSerializer,
            convert=self.project_input,
        )
        self.import_section(
            "certifications",
            Certification,
            serializers.CertificationSerializer,
            convert=self.certification_input,
        )
        self.import_section(
            "specializations",
            Specialization,
            serializers.SpecializationSerializer,
            convert=self.specialization_input,
        )
        self.import_section("education", Education, serializers.EducationSerializer)
        self.import_section("hobbies", Hobby, serializers.HobbySerializer)
        self.import_section("commitments", Commitment, serializers.CommitmentSerializer)
        self.import_section(
            "scientific_communications",
            ScientificCommunication,
            serializers.ScientificCommunicationSerializer,
        )
        self.import_profile()

    # Shared steps

    def section(self, key):
        return self.data.get(key) or []

    def add_error(self, section, index, detail):
        self.errors.setdefault(section, {})[index] = detail

    def count(self, section, created):
        made, updated = self.report.sections.get(section, (0, 0))
        self.report.sections[section] = (
            (made + 1, updated) if created else (made, updated + 1)
        )

    def records(self, section):
        """(index, id, record) of each well-formed record of `section`."""
        seen = set()
        for index, record in enumerate(self.section(section)):
            if not isinstance(record, dict):
                self.add_error(
                    section, index, {"non_field_errors": ["Expected an object."]}
                )
                continue
            id_ = record.get("id")
            if not _is_id(id_):
                self.add_error(section, index, {"id": ["A valid id is required."]})
                continue
            if id_ in seen:
                self.add_error(section, index, {"id": ["This id is listed twice."]})
                continue
            seen.add(id_)
            yield index, id_, record

    def save(self, section, serializer_class, instance, id_, data):
        """Validate and save one record; return its errors, or None if saved."""
        serializer = serializer_class(instance, data=data)
        if not serializer.is_valid():
            return serializer.errors
        if instance is None:
            serializer.save(id=id_)
        else:
            serializer.save()
        self.count(section, created=instance is None)
        return None

    def import_section(
        self, section, model, serializer_class, convert=None, ignored=()
    ):
        records = list(self.records(section))
        existing = model.objects.in_bulk([id_ for _, id_, _ in records])
        for index, id_, record in records:
            data = {
                name: value
                for name, value in record.items()
                if name not in DERIVED_FIELDS and name not in ignored
            }
            if convert:
                data = convert(data)
            errors = self.save(section, serializer_class, existing.get(id_), id_, data)
            if errors:
                self.add_error(section, index, errors)

    # Conversions from the resume shape to the admin API's

    @staticmethod
    def project_input(data):
        data["experience"] = _ref(data.get("experience"))
        data["tags"] = _refs(data.get("tags", []))
        return data

    @staticmethod
    def certification_input(data):
        data.pop("specializations", None)
        data["tags"] = _refs(data.get("tags", []))
        return data

    @staticmethod
    def specialization_input(data):
        data["certifications"] = _refs(data.get("certifications", []))
        return data

    # Tag categories and tags

    def import_tag_categories(self):
        """Save the domains, then their categories."""
        section = "tag_categories"
        domains = list(self.records(section))
        children = []
        for index, parent_id, domain in domains:
            kids = domain.get("children", [])
            if not isinstance(kids, list):
                self.add_error(section, index, {"children": ["Expected a list."]})
                continue
            children.extend(
                (index, position, parent_id, child)
                for position, child in enumerate(kids)
            )
        ids = [id_ for _, id_, _ in domains] + [
            child.get("id") for *_, child in children if isinstance(child, dict)
        ]
        existing = TagCategory.objects.in_bulk([id_ for id_ in ids if _is_id(id_)])
        serializer_class = serializers.TagCategorySerializer
        for index, id_, domain in domains:
            data = {"name": domain.get("name"), "parent": None}
            errors = self.save(section, serializer_class, existing.get(id_), id_, data)
            if errors:
                self.add_error(section, index, errors)
        for index, position, parent_id, child in children:
            id_ = child.get("id") if isinstance(child, dict) else None
            if not _is_id(id_):
                errors = {"id": ["A valid id is required."]}
            else:
                data = {"name": child.get("name"), "parent": parent_id}
                errors = self.save(
                    section, serializer_class, existing.get(id_), id_, data
                )
            if errors:
                # A category's errors are reported under its domain.
                domain_errors = self.errors.setdefault(section, {}).setdefault(
                    index, {}
                )
                domain_errors.setdefault("children", {})[position] = errors

    def collect_tags(self):
        """Merge the tags the file shows into id -> fields, from every place.

        Fields: name, kind and note when known, and categories (the ids of the
        categories listing the tag). Disagreeing places are errors.
        """
        tags = {}

        def add(source, tag, **fields):
            if not isinstance(tag, dict) or not _is_id(tag.get("id")):
                self.add_error(source, "tags", ["Each tag needs a valid id."])
                return False
            merged = tags.setdefault(tag["id"], {"categories": []})
            for name, value in [("name", tag.get("name")), *fields.items()]:
                if name in merged and merged[name] != value:
                    self.add_error(
                        "tags",
                        tag["id"],
                        {name: [f"The file gives this tag two {name}s."]},
                    )
                merged[name] = value
            return True

        for section, kind in TAG_SECTIONS.items():
            for tag in self.section(section):
                add(section, tag, kind=kind)
        for section in ("projects", "certifications"):
            for record in self.section(section):
                nested = record.get("tags", []) if isinstance(record, dict) else []
                for tag in nested if isinstance(nested, list) else []:
                    add(
                        section,
                        tag,
                        kind=tag.get("kind") if isinstance(tag, dict) else None,
                    )
        for domain in self.section("tag_categories"):
            children = domain.get("children", []) if isinstance(domain, dict) else []
            for child in children if isinstance(children, list) else []:
                listed = child.get("tags", []) if isinstance(child, dict) else []
                for tag in listed if isinstance(listed, list) else []:
                    note = tag.get("note") if isinstance(tag, dict) else None
                    if add("tag_categories", tag, note=note):
                        tags[tag["id"]]["categories"].append(child.get("id"))
        return tags

    def import_tags(self):
        tags = self.collect_tags()
        existing = Tag.objects.in_bulk(list(tags))
        for id_, fields in tags.items():
            if "tags" in self.errors and id_ in self.errors["tags"]:
                continue
            instance = existing.get(id_)
            kind = fields.get("kind", instance and instance.kind)
            if kind is None:
                self.add_error(
                    "tag_categories",
                    id_,
                    {"tags": [f"Unknown tag {id_}: no section gives its kind."]},
                )
                continue
            serializer_class = TAG_SERIALIZERS.get(kind)
            if serializer_class is None:
                self.add_error(
                    "tags", id_, {"kind": [f'"{kind}" is not a valid kind.']}
                )
                continue
            data = {"name": fields["name"], "categories": fields["categories"]}
            if "note" in fields:
                data["note"] = fields["note"]
            errors = self.save("tags", serializer_class, instance, id_, data)
            if errors:
                self.add_error("tags", id_, errors)

    # Profile

    def import_profile(self):
        data = self.data.get("profile")
        if data is None:
            return
        instance = Profile.objects.first()
        serializer = ProfileSerializer(instance, data=data)
        if not serializer.is_valid():
            self.errors["profile"] = serializer.errors
            return
        serializer.save()
        self.count("profile", created=instance is None)


def _refs(values):
    """The ids of a list of nested records."""
    return [_ref(value) for value in values] if isinstance(values, list) else values
