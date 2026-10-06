from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.db.models import Q

from experience.models import translated_together

# The portfolio has a single owner, so a single profile row, with this id.
PROFILE_ID = 1

# Links are opened from the public site: no javascript:, data:, ftp:... urls.
validate_contact_url = RegexValidator(
    r"^(https?://|mailto:)",
    message="Enter a URL starting with https://, http:// or mailto:.",
)


class Profile(models.Model):
    """Who the portfolio belongs to."""

    id = models.PositiveSmallIntegerField(primary_key=True, default=PROFILE_ID)
    full_name = models.CharField(max_length=255)
    headline_en = models.CharField(max_length=255)
    headline_fr = models.CharField(max_length=255)
    bio_en = models.TextField(blank=True)
    bio_fr = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(id=PROFILE_ID),
                name="%(app_label)s_%(class)s_single_row",
                violation_error_message="There is a single profile.",
            ),
            translated_together("bio"),
        ]

    def __str__(self):
        return self.full_name


class ContactLink(models.Model):
    """Where visitors can reach the owner."""

    class Kind(models.TextChoices):
        EMAIL = "email", "Email"
        LINKEDIN = "linkedin", "LinkedIn"
        GITHUB = "github", "GitHub"
        WEBSITE = "website", "Website"
        OTHER = "other", "Other"

    kind = models.CharField(max_length=20, choices=Kind.choices)
    url = models.CharField(max_length=500, validators=[validate_contact_url])
    display_order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "id"]

    def clean(self):
        # An email link is a mailto: address, and no other kind is.
        if self.kind and self.url:
            is_mailto = self.url.startswith("mailto:")
            if (self.kind == self.Kind.EMAIL) != is_mailto:
                raise ValidationError(
                    {"url": "Use a mailto: address for an email link, and only then."}
                )
