from functools import reduce
from operator import and_

from django.db import models
from django.db.models import F, Q

from experience.languages import LANGUAGES


def translated_together(field):
    """Constraint: optional text `field` is empty in every language or in none.

    The field is stored as one column per language, e.g. grade_en and grade_fr.
    """
    columns = [f"{field}_{language}" for language in LANGUAGES]
    all_empty = reduce(and_, (Q(**{column: ""}) for column in columns))
    all_filled = reduce(and_, (~Q(**{column: ""}) for column in columns))
    return models.CheckConstraint(
        condition=all_empty | all_filled,
        name=f"%(app_label)s_%(class)s_{field}_translated",
        violation_error_message="Fill in every language, or leave them all empty.",
    )


class BaseEntry(models.Model):
    """Fields shared by every portfolio entry."""

    description_en = models.TextField(blank=True)
    description_fr = models.TextField(blank=True)
    display_order = models.PositiveIntegerField(
        default=0, help_text="Lower values are shown first."
    )
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class DateRangeEntry(BaseEntry):
    """Entries that span a period. A null end_date means 'ongoing'."""

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        abstract = True
        ordering = ["display_order", "-start_date"]
        constraints = [
            models.CheckConstraint(
                condition=Q(end_date__isnull=True) | Q(end_date__gte=F("start_date")),
                name="%(app_label)s_%(class)s_end_after_start",
                violation_error_message="The end date cannot be before the start date.",
            ),
            translated_together("description"),
        ]

    @property
    def is_current(self) -> bool:
        return self.end_date is None


class Education(DateRangeEntry):
    institution = models.CharField(max_length=255)
    degree_en = models.CharField(max_length=255)
    degree_fr = models.CharField(max_length=255)
    field_of_study_en = models.CharField(max_length=255, blank=True)
    field_of_study_fr = models.CharField(max_length=255, blank=True)
    grade_en = models.CharField(max_length=100, blank=True)
    grade_fr = models.CharField(max_length=100, blank=True)
    location_en = models.CharField(max_length=255, blank=True)
    location_fr = models.CharField(max_length=255, blank=True)

    class Meta(DateRangeEntry.Meta):
        verbose_name_plural = "education"
        constraints = [
            *DateRangeEntry.Meta.constraints,
            translated_together("field_of_study"),
            translated_together("grade"),
            translated_together("location"),
        ]

    def __str__(self):
        return f"{self.degree_en} — {self.institution}"


class ProfessionalExperience(DateRangeEntry):
    class EmploymentType(models.TextChoices):
        FULL_TIME = "full_time", "Full-time"
        PART_TIME = "part_time", "Part-time"
        CONTRACT = "contract", "Contract"
        FREELANCE = "freelance", "Freelance"
        INTERNSHIP = "internship", "Internship"
        APPRENTICESHIP = "apprenticeship", "Apprenticeship"

    company = models.CharField(max_length=255)
    position_en = models.CharField(max_length=255)
    position_fr = models.CharField(max_length=255)
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME,
    )
    company_url = models.URLField(blank=True)
    location_en = models.CharField(max_length=255, blank=True)
    location_fr = models.CharField(max_length=255, blank=True)

    class Meta(DateRangeEntry.Meta):
        verbose_name_plural = "professional experiences"
        constraints = [
            *DateRangeEntry.Meta.constraints,
            translated_together("location"),
        ]

    def __str__(self):
        return f"{self.position_en} @ {self.company}"


class Tag(models.Model):
    """Reusable label shared by projects and certifications."""

    class Kind(models.TextChoices):
        TOOL = "tool", "Tool"
        METHODOLOGY = "methodology", "Methodology"
        SKILL = "skill", "Skill"

    # Set by the proxy subclasses below.
    KIND = None

    name_en = models.CharField(max_length=100)
    name_fr = models.CharField(max_length=100)
    kind = models.CharField(max_length=20, choices=Kind.choices)

    class Meta:
        ordering = ["kind", "name_en"]
        # A name is unique within its kind, in each language.
        constraints = [
            models.UniqueConstraint(
                fields=[f"name_{language}", "kind"],
                name=f"unique_tag_name_{language}_per_kind",
            )
            for language in LANGUAGES
        ]

    def save(self, *args, **kwargs):
        if self.KIND:
            self.kind = self.KIND
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name_en


class TagKindManager(models.Manager):
    """Restricts a Tag proxy to its own kind."""

    def get_queryset(self):
        return super().get_queryset().filter(kind=self.model.KIND)


class Tool(Tag):
    KIND = Tag.Kind.TOOL
    objects = TagKindManager()

    class Meta:
        proxy = True


class Methodology(Tag):
    KIND = Tag.Kind.METHODOLOGY
    objects = TagKindManager()

    class Meta:
        proxy = True
        verbose_name_plural = "methodologies"


class Skill(Tag):
    KIND = Tag.Kind.SKILL
    objects = TagKindManager()

    class Meta:
        proxy = True


class Project(DateRangeEntry):
    experience = models.ForeignKey(
        ProfessionalExperience,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="projects",
        help_text="Leave empty for a side project.",
    )
    title_en = models.CharField(max_length=255)
    title_fr = models.CharField(max_length=255)
    tags = models.ManyToManyField(Tag, related_name="projects", blank=True)
    achievements = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            "Valorization elements, each in every language, e.g. "
            '[{"en": "Won an award", "fr": "A remporté un prix"}].'
        ),
    )

    @property
    def is_side_project(self) -> bool:
        return self.experience_id is None

    def __str__(self):
        if self.is_side_project:
            return f"{self.title_en} (side project)"
        return f"{self.title_en} ({self.experience.company})"


class Mission(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="missions"
    )
    description_en = models.TextField()
    description_fr = models.TextField()
    display_order = models.PositiveIntegerField(
        default=0, help_text="Lower values are shown first."
    )

    class Meta:
        ordering = ["display_order"]

    def __str__(self):
        return self.description_en[:50]


class CredentialEntry(BaseEntry):
    """Fields shared by certifications and specializations."""

    name_en = models.CharField(max_length=255)
    name_fr = models.CharField(max_length=255)
    issuer = models.CharField(max_length=255)
    issue_date = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)
    credential_id = models.CharField(max_length=255, blank=True)
    credential_url = models.URLField(blank=True)

    class Meta:
        abstract = True
        ordering = ["display_order", "-issue_date"]
        constraints = [
            models.CheckConstraint(
                condition=Q(expiration_date__isnull=True)
                | Q(expiration_date__gte=F("issue_date")),
                name="%(app_label)s_%(class)s_expiration_after_issue",
                violation_error_message=(
                    "The expiration date cannot be before the issue date."
                ),
            ),
            translated_together("description"),
        ]

    def __str__(self):
        return f"{self.name_en} ({self.issuer})"


class Certification(CredentialEntry):
    tags = models.ManyToManyField(Tag, related_name="certifications", blank=True)


class Specialization(CredentialEntry):
    """Earned after completing every certification of its path."""

    certifications = models.ManyToManyField(
        Certification,
        related_name="specializations",
        blank=True,
    )
