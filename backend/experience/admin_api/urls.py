from rest_framework.permissions import IsAdminUser
from rest_framework.routers import APIRootView, DefaultRouter

from experience.admin_api import views

app_name = "experience-admin"


class AdminAPIRootView(APIRootView):
    permission_classes = [IsAdminUser]


class AdminRouter(DefaultRouter):
    APIRootView = AdminAPIRootView


router = AdminRouter()
router.register("education", views.EducationViewSet, basename="education")
router.register(
    "professional-experiences",
    views.ProfessionalExperienceViewSet,
    basename="professionalexperience",
)
router.register("skills", views.SkillViewSet, basename="skill")
router.register("tools", views.ToolViewSet, basename="tool")
router.register("methodologies", views.MethodologyViewSet, basename="methodology")

urlpatterns = router.urls
