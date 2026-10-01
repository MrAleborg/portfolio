from rest_framework.permissions import AllowAny
from rest_framework.routers import APIRootView, DefaultRouter

from experience import views

app_name = "experience"


class PublicAPIRootView(APIRootView):
    permission_classes = [AllowAny]


class PublicRouter(DefaultRouter):
    APIRootView = PublicAPIRootView


router = PublicRouter()
router.register("education", views.EducationViewSet, basename="education")
router.register("certifications", views.CertificationViewSet, basename="certification")
router.register(
    "professional-experiences",
    views.ProfessionalExperienceViewSet,
    basename="professionalexperience",
)
router.register("projects", views.ProjectViewSet, basename="project")
router.register(
    "specializations", views.SpecializationViewSet, basename="specialization"
)
router.register("skills", views.SkillViewSet, basename="skill")
router.register("tools", views.ToolViewSet, basename="tool")
router.register("methodologies", views.MethodologyViewSet, basename="methodology")
router.register("hobbies", views.HobbyViewSet, basename="hobby")
router.register("commitments", views.CommitmentViewSet, basename="commitment")

urlpatterns = router.urls
