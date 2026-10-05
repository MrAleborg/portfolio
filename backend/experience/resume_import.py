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
    MAX_ID,
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
    return (
        isinstance(value, int) and not isinstance(value, bool) and 1 <= value <= MAX_ID
    )


class _TagCategoryInput(serializers.TagCategorySerializer):
    """Skips TagCategory.clean: it reads the tree as stored, mid-import.
    _Importer.check_tree checks the same rules on the imported tree."""

    def validate(self, attrs):
        return attrs


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
            instance = existing.get(id_)
            data = {
                name: value
                for name, value in record.items()
                if name not in DERIVED_FIELDS and name not in ignored
            }
            if convert:
                data = convert(data, instance)
            errors = self.save(section, serializer_class, instance, id_, data)
            if errors:
                self.add_error(section, index, errors)

    # Conversions from the resume shape to the admin API's

    @staticmethod
    def project_input(data, instance):
        data["experience"] = _ref(data.get("experience"))
        data["tags"] = _refs(data.get("tags", []))
        return data

    @staticmethod
    def certification_input(data, instance):
        data.pop("specializations", None)
        data["tags"] = _refs(data.get("tags", []))
        return data

    @staticmethod
    def specialization_input(data, instance):
        certifications = _refs(data.get("certifications", []))
        if instance is not None and isinstance(certifications, list):
            # The resume hides hidden certifications: keep the links to them.
            hidden = instance.certifications.filter(is_visible=False)
            certifications += [
                id_
                for id_ in hidden.values_list("pk", flat=True)
                if id_ not in certifications
            ]
        data["certifications"] = certifications
        return data

    # Tag categories and tags

    def category_nodes(self):
        """(domain index, id, parent id, name) of each well-formed category,
        domains first; each problem is reported under its domain's index."""
        section = "tag_categories"
        domains, children, seen = [], [], set()

        def check(index, node, where):
            id_ = node.get("id") if isinstance(node, dict) else None
            problem = None
            if not _is_id(id_):
                problem = "A valid id is required."
            elif id_ in seen:
                problem = f"Category {id_} is listed twice."
            if problem:
                errors = self.errors.setdefault(section, {}).setdefault(index, {})
                if where is None:
                    errors.setdefault("id", []).append(problem)
                else:
                    errors.setdefault("children", {})[where] = {"id": [problem]}
                return None
            seen.add(id_)
            return id_

        for index, domain in enumerate(self.section(section)):
            domain_id = check(index, domain, None)
            if domain_id is None:
                continue
            domains.append((index, domain_id, None, domain.get("name")))
            kids = domain.get("children", [])
            if not isinstance(kids, list):
                self.add_error(section, index, {"children": ["Expected a list."]})
                continue
            for position, child in enumerate(kids):
                child_id = check(index, child, position)
                if child_id is not None:
                    children.append(
                        (index, child_id, domain_id, child.get("name"), position)
                    )
        return domains, children

    def import_tag_categories(self):
        """Save the domains, then their categories. The depth rules are
        checked on the whole tree once the tags are saved (check_tree)."""
        section = "tag_categories"
        domains, children = self.category_nodes()
        existing = TagCategory.objects.in_bulk([node[1] for node in domains + children])
        for index, id_, parent_id, name in domains:
            data = {"name": name, "parent": parent_id}
            errors = self.save(section, _TagCategoryInput, existing.get(id_), id_, data)
            if errors:
                self.add_error(section, index, errors)
        for index, id_, parent_id, name, position in children:
            data = {"name": name, "parent": parent_id}
            errors = self.save(section, _TagCategoryInput, existing.get(id_), id_, data)
            if errors:
                # A category's errors are reported under its domain.
                domain_errors = self.errors.setdefault(section, {}).setdefault(
                    index, {}
                )
                domain_errors.setdefault("children", {})[position] = errors
        self.file_categories = {node[1] for node in domains + children}

    def check_tree(self):
        """The depth rules of TagCategory.clean, on the tree as imported."""
        rules = [
            (
                TagCategory.objects.filter(parent__parent__isnull=False),
                "The parent of a category must be a domain",
            ),
            (
                TagCategory.objects.filter(parent__isnull=True, tags__isnull=False),
                "A category with tags must stay under a domain",
            ),
        ]
        problems = []
        for queryset, rule in rules:
            ids = sorted(set(queryset.values_list("pk", flat=True)))
            if ids:
                problems.append(f"{rule}: categories {', '.join(map(str, ids))}.")
        if problems:
            self.errors.setdefault("tag_categories", {})["non_field_errors"] = problems

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

        def nested(record, key):
            values = record.get(key, []) if isinstance(record, dict) else []
            return values if isinstance(values, list) else []

        def given(tag, key):
            return {key: tag[key]} if isinstance(tag, dict) and key in tag else {}

        for section, kind in TAG_SECTIONS.items():
            for tag in self.section(section):
                add(section, tag, kind=kind)
        for section in ("projects", "certifications"):
            for record in self.section(section):
                for tag in nested(record, "tags"):
                    add(section, tag, **given(tag, "kind"))
        for domain in self.section("tag_categories"):
            for child in nested(domain, "children"):
                for tag in nested(child, "tags"):
                    if add(
                        "tag_categories",
                        tag,
                        **given(tag, "kind"),
                        **given(tag, "note"),
                    ):
                        tags[tag["id"]]["categories"].append(child.get("id"))
        return tags

    def import_tags(self):
        tags = self.collect_tags()
        existing = Tag.objects.prefetch_related("categories").in_bulk(list(tags))
        for id_, fields in tags.items():
            if id_ in self.errors.get("tags", {}):
                continue
            instance = existing.get(id_)
            kind = fields.get("kind", instance and instance.kind)
            serializer_class = TAG_SERIALIZERS.get(kind)
            if serializer_class is None:
                message = (
                    f'"{kind}" is not a valid kind.'
                    if kind
                    else "This tag is not in the database and the file gives no kind."
                )
                self.add_error("tags", id_, {"kind": [message]})
                continue
            categories = fields["categories"]
            if instance is not None:
                # Saved through the proxy of its kind, which sets the kind.
                instance.__class__ = serializer_class.Meta.model
                # Keep the links to the categories the file does not show.
                categories += [
                    category.pk
                    for category in instance.categories.all()
                    if category.pk not in self.file_categories
                ]
            data = {"name": fields["name"], "categories": categories}
            if "note" in fields:
                data["note"] = fields["note"]
            errors = self.save("tags", serializer_class, instance, id_, data)
            if errors:
                self.add_error("tags", id_, errors)
        self.check_tree()

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
