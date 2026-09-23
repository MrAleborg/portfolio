from rest_framework.routers import DefaultRouter

from experience import views

app_name = "experience"

router = DefaultRouter()
router.register("education", views.EducationViewSet, basename="education")

urlpatterns = router.urls
