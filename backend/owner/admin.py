from django.contrib import admin

from owner.models import ContactLink, Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    """The single profile: added once, then only edited."""

    def has_add_permission(self, request):
        return not Profile.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ContactLink)
class ContactLinkAdmin(admin.ModelAdmin):
    list_display = ("kind", "url", "display_order", "is_visible")
