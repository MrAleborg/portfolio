from django.urls import path

from owner import views

app_name = "owner"

urlpatterns = [
    path("", views.ProfileView.as_view(), name="profile"),
]
