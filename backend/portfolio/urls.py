from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/experience/", include("experience.urls")),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/profile/", include("owner.urls")),
    path("api/v1/admin/profile/", include("owner.admin_api.urls")),
    path("api/v1/admin/", include("experience.admin_api.urls")),
]
