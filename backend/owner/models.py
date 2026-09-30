from django.db import models
from django.db.models import Q

from experience.models import translated_together

# The portfolio has a single owner, so a single profile row, with this id.
PROFILE_ID = 1


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
