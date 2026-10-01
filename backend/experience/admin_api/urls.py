from rest_framework.routers import DefaultRouter

from experience.admin_api import views

app_name = "experience-admin"


router = DefaultRouter()
router.register("education", views.EducationViewSet, basename="education")
router.register(
    "professional-experiences",
    views.ProfessionalExperienceViewSet,
    basename="professionalexperience",
)
router.register("projects", views.ProjectViewSet, basename="project")
router.register("certifications", views.CertificationViewSet, basename="certification")
router.register(
    "specializations", views.SpecializationViewSet, basename="specialization"
)
router.register("skills", views.SkillViewSet, basename="skill")
router.register("tools", views.ToolViewSet, basename="tool")
router.register("methodologies", views.MethodologyViewSet, basename="methodology")
router.register("hobbies", views.HobbyViewSet, basename="hobby")
router.register("commitments", views.CommitmentViewSet, basename="commitment")
router.register(
    "scientific-communications",
    views.ScientificCommunicationViewSet,
    basename="scientific-communication",
)

urlpatterns = router.urls
