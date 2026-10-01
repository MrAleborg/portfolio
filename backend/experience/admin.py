from django.contrib import admin

from experience.models import (
    Certification,
    Commitment,
    Education,
    Hobby,
    Mission,
    ProfessionalExperience,
    Project,
    ScientificCommunication,
    Specialization,
    Tag,
    TagCategory,
)


class MissionInline(admin.TabularInline):
    model = Mission
    extra = 1


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    inlines = [MissionInline]
    # Project.__str__ shows the experience.
    list_select_related = ["experience"]


admin.site.register(Education)
admin.site.register(ProfessionalExperience)
admin.site.register(Certification)
admin.site.register(Specialization)
admin.site.register(Hobby)
admin.site.register(Commitment)
admin.site.register(ScientificCommunication)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_filter = ["kind"]
    filter_horizontal = ["categories"]


@admin.register(TagCategory)
class TagCategoryAdmin(admin.ModelAdmin):
    list_display = ["name_en", "parent", "position"]
    # The parent column shows the parent's name.
    list_select_related = ["parent"]
