from django.urls import path
from rest_framework.routers import SimpleRouter

from owner.admin_api import views

app_name = "owner-admin"

router = SimpleRouter()
router.register("contact-links", views.ContactLinkViewSet, basename="contact-link")

urlpatterns = [
    path("", views.ProfileView.as_view(), name="profile"),
    *router.urls,
]
