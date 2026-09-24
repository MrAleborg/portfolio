from datetime import date

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from experience.management.demo import has_content
from experience.models import (
    Certification,
    Education,
    Methodology,
    Mission,
    ProfessionalExperience,
    Project,
    Skill,
    Specialization,
    Tool,
)


class Command(BaseCommand):
    help = (
        "Fill an empty database with fictional demo content, including hidden "
        "entries, to try the API by hand."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        if has_content():
            raise CommandError(
                "The database already has content. "
                "Use reset_demo to replace it with the demo content."
            )

        tags = self.create_tags()
        self.create_education()
        self.create_experiences(tags)
        self.create_credentials(tags)

        self.stdout.write(self.style.SUCCESS("Demo content created."))

    def create_tags(self):
        return {
            "python": Skill.objects.create(name="Python"),
            "api": Skill.objects.create(name="API design"),
            "django": Tool.objects.create(name="Django"),
            "react": Tool.objects.create(name="React"),
            "docker": Tool.objects.create(name="Docker"),
            "scrum": Methodology.objects.create(name="Scrum"),
            "tdd": Methodology.objects.create(name="TDD"),
        }

    def create_education(self):
        Education.objects.create(
            institution="Demo University",
            degree="Master",
            field_of_study="Computer Science",
            grade="With honours",
            location="Rennes",
            start_date=date(2015, 9, 1),
            end_date=date(2017, 6, 30),
            description="Software engineering track.",
        )
        Education.objects.create(
            institution="Demo Institute of Technology",
            degree="Bachelor",
            field_of_study="Computer Science",
            location="Nantes",
            start_date=date(2012, 9, 1),
            end_date=date(2015, 6, 30),
        )

    def create_experiences(self, tags):
        current = ProfessionalExperience.objects.create(
            company="Acme Corp",
            position="Backend developer",
            employment_type=ProfessionalExperience.EmploymentType.FULL_TIME,
            company_url="https://acme.example",
            location="Paris",
            start_date=date(2021, 1, 4),
            description="Current job (end_date is null).",
        )
        self.create_project(
            current,
            title="Billing platform",
            start_date=date(2021, 2, 1),
            end_date=date(2022, 6, 30),
            achievements=["Cut invoice generation time by half"],
            missions=["Design the REST API", "Write the test suite"],
            tags=[tags["python"], tags["django"], tags["tdd"]],
        )
        self.create_project(
            current,
            title="Customer dashboard",
            start_date=date(2022, 9, 1),
            missions=["Build the React frontend"],
            tags=[tags["react"], tags["scrum"]],
            display_order=1,
        )
        self.create_project(
            current,
            title="Hidden project",
            start_date=date(2023, 1, 1),
            description="is_visible=False: must never appear in the API.",
            is_visible=False,
        )

        past = ProfessionalExperience.objects.create(
            company="Globex",
            position="Junior developer",
            employment_type=ProfessionalExperience.EmploymentType.APPRENTICESHIP,
            location="Nantes",
            start_date=date(2017, 9, 1),
            end_date=date(2020, 12, 31),
        )
        self.create_project(
            past,
            title="Internal tools",
            start_date=date(2018, 1, 1),
            end_date=date(2020, 6, 30),
            missions=["Automate deployments"],
            tags=[tags["docker"], tags["python"]],
        )

        hidden = ProfessionalExperience.objects.create(
            company="Hidden Inc",
            position="Consultant",
            employment_type=ProfessionalExperience.EmploymentType.FREELANCE,
            start_date=date(2016, 1, 1),
            end_date=date(2016, 12, 31),
            description="is_visible=False: hidden with its projects.",
            is_visible=False,
        )
        self.create_project(
            hidden,
            title="Project of a hidden experience",
            start_date=date(2016, 2, 1),
            end_date=date(2016, 11, 30),
            description="Visible itself, but hidden because its experience is.",
            tags=[tags["django"]],
        )

        self.create_project(
            None,
            title="Portfolio",
            start_date=date(2026, 1, 1),
            description="Side project (no experience).",
            missions=["Build this site"],
            tags=[tags["django"], tags["react"], tags["tdd"]],
        )

    def create_project(self, experience, *, missions=(), tags=(), **fields):
        project = Project.objects.create(experience=experience, **fields)
        for order, description in enumerate(missions):
            Mission.objects.create(
                project=project, description=description, display_order=order
            )
        project.tags.set(tags)
        return project

    def create_credentials(self, tags):
        psm = Certification.objects.create(
            name="Professional Scrum Master I",
            issuer="Scrum.org",
            issue_date=date(2023, 5, 12),
            credential_id="DEMO-PSM-1",
            credential_url="https://example.com/credentials/psm-1",
        )
        psm.tags.set([tags["scrum"]])
        pspo = Certification.objects.create(
            name="Professional Scrum Product Owner I",
            issuer="Scrum.org",
            issue_date=date(2024, 2, 3),
        )
        pspo.tags.set([tags["scrum"]])
        python = Certification.objects.create(
            name="Python Developer",
            issuer="Demo Academy",
            issue_date=date(2022, 4, 20),
            expiration_date=date(2025, 4, 20),
        )
        python.tags.set([tags["python"]])
        hidden = Certification.objects.create(
            name="Hidden certification",
            issuer="Demo Academy",
            issue_date=date(2021, 1, 1),
            description="is_visible=False: left out of lists and specializations.",
            is_visible=False,
        )
        hidden.tags.set([tags["scrum"]])

        agile = Specialization.objects.create(
            name="Agile path",
            issuer="Scrum.org",
            issue_date=date(2024, 3, 1),
        )
        agile.certifications.set([psm, pspo, hidden])
