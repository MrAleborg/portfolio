from django.urls import path

from owner import views

app_name = "owner"

urlpatterns = [
    path("", views.ProfileView.as_view(), name="profile"),
    path("contact/", views.ContactMessageView.as_view(), name="contact"),
    path(
        "contact-links/",
        views.ContactLinkListView.as_view(),
        name="contact-link-list",
    ),
]
