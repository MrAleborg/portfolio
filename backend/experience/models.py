from django.db import models


class BaseEntry(models.Model):
    """Fields shared by every portfolio entry."""

    description = models.TextField(blank=True)
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

    @property
    def is_current(self) -> bool:
        return self.end_date is None


class Education(DateRangeEntry):
    institution = models.CharField(max_length=255)
    degree = models.CharField(max_length=255)
    field_of_study = models.CharField(max_length=255, blank=True)
    grade = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=255, blank=True)

    class Meta(DateRangeEntry.Meta):
        verbose_name_plural = "education"

    def __str__(self):
        return f"{self.degree} — {self.institution}"


class ProfessionalExperience(DateRangeEntry):
    class EmploymentType(models.TextChoices):
        FULL_TIME = "full_time", "Full-time"
        PART_TIME = "part_time", "Part-time"
        CONTRACT = "contract", "Contract"
        FREELANCE = "freelance", "Freelance"
        INTERNSHIP = "internship", "Internship"
        APPRENTICESHIP = "apprenticeship", "Apprenticeship"

    company = models.CharField(max_length=255)
    position = models.CharField(max_length=255)
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME,
    )
    company_url = models.URLField(blank=True)
    location = models.CharField(max_length=255, blank=True)

    class Meta(DateRangeEntry.Meta):
        verbose_name_plural = "professional experiences"

    def __str__(self):
        return f"{self.position} @ {self.company}"


class Tag(models.Model):
    """Reusable label shared by projects and certifications."""

    class Kind(models.TextChoices):
        TOOL = "tool", "Tool"
        METHODOLOGY = "methodology", "Methodology"
        SKILL = "skill", "Skill"

    # Set by the proxy subclasses below.
    KIND = None

    name = models.CharField(max_length=100)
    kind = models.CharField(max_length=20, choices=Kind.choices)

    class Meta:
        ordering = ["kind", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "kind"], name="unique_tag_per_kind"
            ),
        ]

    def save(self, *args, **kwargs):
        if self.KIND:
            self.kind = self.KIND
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


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
    title = models.CharField(max_length=255)
    tags = models.ManyToManyField(Tag, related_name="projects", blank=True)
    achievements = models.JSONField(
        default=list,
        blank=True,
        help_text='Valorization elements, e.g. ["Won the 2024 innovation award"].',
    )

    @property
    def is_side_project(self) -> bool:
        return self.experience_id is None

    def __str__(self):
        if self.is_side_project:
            return f"{self.title} (side project)"
        return f"{self.title} ({self.experience.company})"


class Mission(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="missions"
    )
    description = models.TextField()
    display_order = models.PositiveIntegerField(
        default=0, help_text="Lower values are shown first."
    )

    class Meta:
        ordering = ["display_order"]

    def __str__(self):
        return self.description[:50]


class CredentialEntry(BaseEntry):
    """Fields shared by certifications and specializations."""

    name = models.CharField(max_length=255)
    issuer = models.CharField(max_length=255)
    issue_date = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)
    credential_id = models.CharField(max_length=255, blank=True)
    credential_url = models.URLField(blank=True)

    class Meta:
        abstract = True
        ordering = ["display_order", "-issue_date"]

    def __str__(self):
        return f"{self.name} ({self.issuer})"


class Certification(CredentialEntry):
    tags = models.ManyToManyField(Tag, related_name="certifications", blank=True)


class Specialization(CredentialEntry):
    """Earned after completing every certification of its path."""

    certifications = models.ManyToManyField(
        Certification,
        related_name="specializations",
        blank=True,
    )
