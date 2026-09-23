from django.contrib import admin

from experience.models import (
    Certification,
    Education,
    Mission,
    ProfessionalExperience,
    Project,
    Specialization,
    Tag,
)


class MissionInline(admin.TabularInline):
    model = Mission
    extra = 1


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    inlines = [MissionInline]


admin.site.register(Education)
admin.site.register(ProfessionalExperience)
admin.site.register(Certification)
admin.site.register(Specialization)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_filter = ["kind"]
