from rest_framework.routers import DefaultRouter

from experience import views

app_name = "experience"

router = DefaultRouter()
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

urlpatterns = router.urls
