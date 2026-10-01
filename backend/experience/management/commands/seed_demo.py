from datetime import date

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from experience.management.demo import has_content
from experience.models import (
    Certification,
    Education,
    Hobby,
    Methodology,
    Mission,
    ProfessionalExperience,
    Project,
    Skill,
    Specialization,
    Tool,
)
from owner.models import Profile


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

        self.create_profile()
        tags = self.create_tags()
        self.create_education()
        self.create_experiences(tags)
        self.create_credentials(tags)
        self.create_hobbies()

        self.stdout.write(self.style.SUCCESS("Demo content created."))

    def create_profile(self):
        Profile.objects.create(
            full_name="Demo Owner",
            headline_en="Software engineer",
            headline_fr="Ingénieur logiciel",
            bio_en="Fictional owner of the demo portfolio.",
            bio_fr="Propriétaire fictif du portfolio de démonstration.",
        )

    def create_tags(self):
        return {
            "python": Skill.objects.create(name_en="Python", name_fr="Python"),
            "api": Skill.objects.create(
                name_en="API design", name_fr="Conception d'API"
            ),
            "django": Tool.objects.create(name_en="Django", name_fr="Django"),
            "react": Tool.objects.create(name_en="React", name_fr="React"),
            "docker": Tool.objects.create(name_en="Docker", name_fr="Docker"),
            "scrum": Methodology.objects.create(name_en="Scrum", name_fr="Scrum"),
            "tdd": Methodology.objects.create(name_en="TDD", name_fr="TDD"),
        }

    def create_education(self):
        Education.objects.create(
            institution="Demo University",
            degree_en="Master's degree",
            degree_fr="Master",
            field_of_study_en="Computer Science",
            field_of_study_fr="Informatique",
            grade_en="With honours",
            grade_fr="Mention très bien",
            location_en="Rennes",
            location_fr="Rennes",
            start_date=date(2015, 9, 1),
            end_date=date(2017, 6, 30),
            description_en="Software engineering track.",
            description_fr="Parcours génie logiciel.",
        )
        Education.objects.create(
            institution="Demo Institute of Technology",
            degree_en="Bachelor's degree",
            degree_fr="Licence",
            field_of_study_en="Computer Science",
            field_of_study_fr="Informatique",
            location_en="Nantes",
            location_fr="Nantes",
            start_date=date(2012, 9, 1),
            end_date=date(2015, 6, 30),
        )

    def create_experiences(self, tags):
        current = ProfessionalExperience.objects.create(
            company="Acme Corp",
            position_en="Backend developer",
            position_fr="Développeur backend",
            employment_type=ProfessionalExperience.EmploymentType.FULL_TIME,
            company_url="https://acme.example",
            location_en="Paris",
            location_fr="Paris",
            start_date=date(2021, 1, 4),
            description_en="Current job (end_date is null).",
            description_fr="Poste actuel (end_date est null).",
        )
        self.create_project(
            current,
            title_en="Billing platform",
            title_fr="Plateforme de facturation",
            start_date=date(2021, 2, 1),
            end_date=date(2022, 6, 30),
            achievements=[
                {
                    "en": "Cut invoice generation time by half",
                    "fr": "Temps de génération des factures divisé par deux",
                }
            ],
            missions=[
                {"en": "Design the REST API", "fr": "Concevoir l'API REST"},
                {"en": "Write the test suite", "fr": "Écrire la suite de tests"},
            ],
            tags=[tags["python"], tags["django"], tags["tdd"]],
        )
        self.create_project(
            current,
            title_en="Customer dashboard",
            title_fr="Tableau de bord client",
            start_date=date(2022, 9, 1),
            missions=[
                {"en": "Build the React frontend", "fr": "Développer le frontend React"}
            ],
            tags=[tags["react"], tags["scrum"]],
            display_order=1,
        )
        self.create_project(
            current,
            title_en="Hidden project",
            title_fr="Projet masqué",
            start_date=date(2023, 1, 1),
            description_en="is_visible=False: must never appear in the API.",
            description_fr="is_visible=False : ne doit jamais apparaître dans l'API.",
            is_visible=False,
        )

        past = ProfessionalExperience.objects.create(
            company="Globex",
            position_en="Junior developer",
            position_fr="Développeur junior",
            employment_type=ProfessionalExperience.EmploymentType.APPRENTICESHIP,
            location_en="Nantes",
            location_fr="Nantes",
            start_date=date(2017, 9, 1),
            end_date=date(2020, 12, 31),
        )
        self.create_project(
            past,
            title_en="Internal tools",
            title_fr="Outils internes",
            start_date=date(2018, 1, 1),
            end_date=date(2020, 6, 30),
            missions=[
                {"en": "Automate deployments", "fr": "Automatiser les déploiements"}
            ],
            tags=[tags["docker"], tags["python"]],
        )

        hidden = ProfessionalExperience.objects.create(
            company="Hidden Inc",
            position_en="Consultant",
            position_fr="Consultant",
            employment_type=ProfessionalExperience.EmploymentType.FREELANCE,
            start_date=date(2016, 1, 1),
            end_date=date(2016, 12, 31),
            description_en="is_visible=False: hidden with its projects.",
            description_fr="is_visible=False : masquée avec ses projets.",
            is_visible=False,
        )
        self.create_project(
            hidden,
            title_en="Project of a hidden experience",
            title_fr="Projet d'une expérience masquée",
            start_date=date(2016, 2, 1),
            end_date=date(2016, 11, 30),
            description_en="Visible itself, but hidden because its experience is.",
            description_fr="Visible lui-même, mais masqué car son expérience l'est.",
            tags=[tags["django"]],
        )

        self.create_project(
            None,
            title_en="Portfolio",
            title_fr="Portfolio",
            start_date=date(2026, 1, 1),
            description_en="Side project (no experience).",
            description_fr="Projet personnel (sans expérience).",
            missions=[{"en": "Build this site", "fr": "Développer ce site"}],
            tags=[tags["django"], tags["react"], tags["tdd"]],
        )

    def create_project(self, experience, *, missions=(), tags=(), **fields):
        """missions: texts in every language, as {"en": ..., "fr": ...}."""
        project = Project.objects.create(experience=experience, **fields)
        for order, texts in enumerate(missions):
            Mission.objects.create(
                project=project,
                description_en=texts["en"],
                description_fr=texts["fr"],
                display_order=order,
            )
        project.tags.set(tags)
        return project

    def create_credentials(self, tags):
        psm = Certification.objects.create(
            name_en="Professional Scrum Master I",
            name_fr="Professional Scrum Master I",
            issuer="Scrum.org",
            issue_date=date(2023, 5, 12),
            credential_id="DEMO-PSM-1",
            credential_url="https://example.com/credentials/psm-1",
        )
        psm.tags.set([tags["scrum"]])
        pspo = Certification.objects.create(
            name_en="Professional Scrum Product Owner I",
            name_fr="Professional Scrum Product Owner I",
            issuer="Scrum.org",
            issue_date=date(2024, 2, 3),
        )
        pspo.tags.set([tags["scrum"]])
        python = Certification.objects.create(
            name_en="Python Developer",
            name_fr="Développeur Python",
            issuer="Demo Academy",
            issue_date=date(2022, 4, 20),
            expiration_date=date(2025, 4, 20),
        )
        python.tags.set([tags["python"]])
        hidden = Certification.objects.create(
            name_en="Hidden certification",
            name_fr="Certification masquée",
            issuer="Demo Academy",
            issue_date=date(2021, 1, 1),
            description_en="is_visible=False: left out of lists and specializations.",
            description_fr="is_visible=False : absente des listes et des spécialisations.",
            is_visible=False,
        )
        hidden.tags.set([tags["scrum"]])

        agile = Specialization.objects.create(
            name_en="Agile path",
            name_fr="Parcours agile",
            issuer="Scrum.org",
            issue_date=date(2024, 3, 1),
        )
        agile.certifications.set([psm, pspo, hidden])

    def create_hobbies(self):
        Hobby.objects.create(
            name_en="Climbing",
            name_fr="Escalade",
            description_en="Bouldering on weekends.",
            description_fr="De l'escalade de bloc le week-end.",
        )
        Hobby.objects.create(name_en="Chess", name_fr="Échecs")
        Hobby.objects.create(
            name_en="Hidden hobby",
            name_fr="Loisir masqué",
            description_en="is_visible=False: must never appear in the API.",
            description_fr="is_visible=False : ne doit jamais apparaître dans l'API.",
            is_visible=False,
        )
