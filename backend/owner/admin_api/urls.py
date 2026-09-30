from django.urls import path

from owner.admin_api import views

app_name = "owner-admin"

urlpatterns = [
    path("", views.ProfileView.as_view(), name="profile"),
]
