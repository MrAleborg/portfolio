"""Tests for importing a resume file into the database.

``import_resume(data)`` takes the JSON that ``GET /api/v1/resume/`` returns and
upserts it, matching records by ``id``: a known id is overwritten, an unknown
id is created with that id, and records absent from the file are kept. It is
all or nothing: on any problem it raises ``ResumeImportError`` (errors keyed by
section, then index in the file, then field) and writes nothing.

Fields the resume does not show (``is_visible``, ``display_order``,
``TagCategory.position``, ``ScientificCommunication.description``) are kept on
update and take the model default on create.
"""

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from experience.models import (
    Certification,
    Commitment,
    Education,
    Hobby,
    Methodology,
    Mission,
    ProfessionalExperience,
    Project,
    ScientificCommunication,
    Skill,
    Specialization,
    Tag,
    TagCategory,
    Tool,
)
from experience.resume_import import ResumeImportError, import_resume
from owner.models import Profile

pytestmark = pytest.mark.django_db

RESUME_URL = "/api/v1/resume/"

LIST_SECTIONS = [
    "education",
    "certifications",
    "professional_experiences",
    "projects",
    "specializations",
    "skills",
    "tools",
    "methodologies",
    "tag_categories",
    "hobbies",
    "commitments",
    "scientific_communications",
]

MODELS = [
    Profile,
    Education,
    ProfessionalExperience,
    Project,
    Mission,
    Certification,
    Specialization,
    Tag,
    TagCategory,
    Hobby,
    Commitment,
    ScientificCommunication,
]

BLANK = {"en": "", "fr": ""}


# Records in the shape the resume gives them. Each builder returns a valid
# record; a test overrides the fields it is about.


def text(en, fr=None):
    return {"en": en, "fr": fr or en}


def resume(**sections):
    """A whole resume file: empty sections, with `sections` filled in."""
    data = {"profile": None, **{key: [] for key in LIST_SECTIONS}}
    data.update(sections)
    return data


def hobby(id, name="Climbing", **fields):
    return {
        "id": id,
        "name": text(name),
        "description": BLANK,
        **fields,
    }


def education(id, institution="University", **fields):
    return {
        "id": id,
        "institution": institution,
        "degree": text("MSc", "Master"),
        "field_of_study": BLANK,
        "grade": BLANK,
        "location": BLANK,
        "start_date": "2020-09-01",
        "end_date": None,
        "is_current": True,
        "description": BLANK,
        **fields,
    }


def experience(id, company="Acme", **fields):
    return {
        "id": id,
        "company": company,
        "position": text("Developer", "Développeur"),
        "employment_type": "full_time",
        "company_url": "",
        "location": BLANK,
        "start_date": "2020-01-01",
        "end_date": None,
        "is_current": True,
        "description": BLANK,
        "projects": [],
        **fields,
    }


def project(id, title="Portfolio", **fields):
    return {
        "id": id,
        "title": text(title),
        "start_date": "2024-01-01",
        "end_date": None,
        "is_current": True,
        "description": BLANK,
        "achievements": [],
        "experience": None,
        "missions": [],
        "tags": [],
        **fields,
    }


def certification(id, name="PCAP", **fields):
    return {
        "id": id,
        "name": text(name),
        "issuer": "Python Institute",
        "issue_date": "2024-01-01",
        "expiration_date": None,
        "credential_id": "",
        "credential_url": "",
        "description": BLANK,
        "tags": [],
        "specializations": [],
        **fields,
    }


def specialization(id, name="Python Path", certifications=(), **fields):
    return {
        "id": id,
        "name": text(name),
        "issuer": "Python Institute",
        "issue_date": "2024-01-01",
        "expiration_date": None,
        "credential_id": "",
        "credential_url": "",
        "description": BLANK,
        "certifications": [{"id": id_, "name": text("x")} for id_ in certifications],
        **fields,
    }


def commitment(id, organization="Red Cross", **fields):
    return {
        "id": id,
        "kind": "association",
        "organization": organization,
        "role": text("Volunteer", "Bénévole"),
        "location": BLANK,
        "url": "",
        "start_date": "2020-01-01",
        "end_date": None,
        "is_current": True,
        "description": BLANK,
        **fields,
    }


def communication(id, title="Static analysis", **fields):
    return {
        "id": id,
        "kind": "talk",
        "title": text(title),
        "authors": "A. Lovelace",
        "venue": "PyCon",
        "date": "2024-05-01",
        "url": "",
        **fields,
    }


def tag(id, name="Python"):
    """A tag as the skills, tools and methodologies sections list it."""
    return {"id": id, "name": text(name)}


def kinded_tag(id, name="Python", kind="skill"):
    """A tag as projects and certifications nest it."""
    return {**tag(id, name), "kind": kind}


def noted_tag(id, name="Python", note=BLANK):
    """A tag as the tag categories list it."""
    return {**tag(id, name), "note": note}


def category(id, name="Languages", tags=()):
    return {"id": id, "name": text(name), "tags": list(tags)}


def domain(id, name="Engineering", children=()):
    return {"id": id, "name": text(name), "children": list(children)}


def profile(full_name="Ada Lovelace"):
    return {
        "full_name": full_name,
        "headline": text("Analyst", "Analyste"),
        "bio": text("I write programs.", "J’écris des programmes."),
    }


def import_error(data):
    """The errors `import_resume` refuses `data` with."""
    with pytest.raises(ResumeImportError) as raised:
        import_resume(data)
    return raised.value.errors


def row_counts():
    return {model: model.objects.count() for model in MODELS}


@pytest.fixture
def portfolio():
    """One public entry of every kind, linked together, as the resume shows it."""
    Profile.objects.create(
        full_name="Ada Lovelace",
        headline_en="Analyst",
        headline_fr="Analyste",
        bio_en="I write programs.",
        bio_fr="J’écris des programmes.",
    )
    python = Skill.objects.create(
        name_en="Python",
        name_fr="Python",
        note_en="Daily driver",
        note_fr="Outil quotidien",
    )
    docker = Tool.objects.create(name_en="Docker", name_fr="Docker")
    tdd = Methodology.objects.create(name_en="TDD", name_fr="TDD")
    acme = ProfessionalExperience.objects.create(
        company="Acme",
        position_en="Developer",
        position_fr="Développeur",
        start_date="2020-01-01",
        end_date="2022-01-01",
    )
    portfolio_project = Project.objects.create(
        title_en="Portfolio",
        title_fr="Portfolio",
        start_date="2024-01-01",
        experience=acme,
        achievements=[{"en": "Won an award", "fr": "A remporté un prix"}],
    )
    portfolio_project.tags.add(python, tdd)
    Mission.objects.create(
        project=portfolio_project,
        description_en="Design",
        description_fr="Conception",
        display_order=0,
    )
    Mission.objects.create(
        project=portfolio_project,
        description_en="Build",
        description_fr="Réalisation",
        display_order=1,
    )
    Project.objects.create(
        title_en="Side",
        title_fr="Annexe",
        start_date="2023-01-01",
    ).tags.add(tdd)
    pcap = Certification.objects.create(
        name_en="PCAP",
        name_fr="PCAP",
        issuer="Python Institute",
        issue_date="2024-01-01",
    )
    pcap.tags.add(docker)
    Specialization.objects.create(
        name_en="Python Path",
        name_fr="Parcours Python",
        issuer="Python Institute",
        issue_date="2024-01-01",
    ).certifications.add(pcap)
    Education.objects.create(
        institution="University",
        degree_en="MSc",
        degree_fr="Master",
        start_date="2020-09-01",
    )
    Hobby.objects.create(name_en="Climbing", name_fr="Escalade")
    Commitment.objects.create(
        organization="Red Cross",
        role_en="Volunteer",
        role_fr="Bénévole",
        start_date="2020-01-01",
    )
    ScientificCommunication.objects.create(
        title_en="Static analysis",
        title_fr="Analyse statique",
        authors="A. Lovelace",
        kind="talk",
        venue="PyCon",
        date="2024-05-01",
    )
    engineering = TagCategory.objects.create(
        name_en="Engineering", name_fr="Ingénierie"
    )
    languages = TagCategory.objects.create(
        name_en="Languages", name_fr="Langages", parent=engineering
    )
    practices = TagCategory.objects.create(
        name_en="Practices", name_fr="Pratiques", parent=engineering
    )
    languages.tags.add(python)
    practices.tags.add(python, tdd)
    TagCategory.objects.create(name_en="Data", name_fr="Données")


def delete_everything():
    Project.objects.all().delete()
    ProfessionalExperience.objects.all().delete()
    Specialization.objects.all().delete()
    Certification.objects.all().delete()
    Education.objects.all().delete()
    Hobby.objects.all().delete()
    Commitment.objects.all().delete()
    ScientificCommunication.objects.all().delete()
    Tag.objects.all().delete()
    TagCategory.objects.all().delete()
    Profile.objects.all().delete()


# Round trip


def test_importing_an_exported_resume_into_an_empty_database_restores_it(
    api_client, portfolio
):
    exported = api_client.get(RESUME_URL).json()
    assert exported["profile"] is not None  # the fixture fills every section
    assert all(exported[key] for key in LIST_SECTIONS)
    delete_everything()

    import_resume(exported)

    assert api_client.get(RESUME_URL).json() == exported


# Report


def test_report_counts_created_records_per_section():
    data = resume(
        hobbies=[hobby(1), hobby(2, "Chess")],
        education=[education(1)],
        profile=profile(),
    )

    report = import_resume(data)

    assert report.sections["hobbies"] == (2, 0)
    assert report.sections["education"] == (1, 0)
    assert report.sections["profile"] == (1, 0)
    assert report.total_created == 4
    assert report.total_updated == 0


def test_report_counts_updated_records_per_section():
    data = resume(hobbies=[hobby(1), hobby(2, "Chess")], education=[education(1)])
    import_resume(data)

    report = import_resume(data)

    assert report.sections["hobbies"] == (0, 2)
    assert report.sections["education"] == (0, 1)
    assert report.total_created == 0
    assert report.total_updated == 3


# Upsert by id


def test_new_id_is_created_with_that_id_and_model_defaults():
    import_resume(resume(hobbies=[hobby(4242, "Chess")]))

    created = Hobby.objects.get(pk=4242)
    assert created.name_en == "Chess"
    assert created.is_visible is True
    assert created.display_order == 0


def test_existing_id_is_overwritten():
    Hobby.objects.create(id=7, name_en="Old", name_fr="Ancien")

    import_resume(resume(hobbies=[hobby(7, "Chess")]))

    assert Hobby.objects.count() == 1
    updated = Hobby.objects.get(pk=7)
    assert (updated.name_en, updated.name_fr) == ("Chess", "Chess")


def test_existing_id_keeps_the_fields_the_resume_does_not_show():
    Hobby.objects.create(
        id=7, name_en="Old", name_fr="Ancien", is_visible=False, display_order=5
    )

    import_resume(resume(hobbies=[hobby(7, "Chess")]))

    updated = Hobby.objects.get(pk=7)
    assert updated.is_visible is False
    assert updated.display_order == 5


def test_scientific_communication_keeps_its_description():
    ScientificCommunication.objects.create(
        id=3,
        title_en="Old",
        title_fr="Ancien",
        authors="A",
        kind="talk",
        venue="V",
        date="2020-01-01",
        description_en="Abstract",
        description_fr="Résumé",
    )

    import_resume(resume(scientific_communications=[communication(3, "New")]))

    updated = ScientificCommunication.objects.get(pk=3)
    assert updated.title_en == "New"
    assert (updated.description_en, updated.description_fr) == ("Abstract", "Résumé")


def test_tag_category_keeps_its_position():
    TagCategory.objects.create(id=1, name_en="Old", name_fr="Ancien", position=5)

    import_resume(resume(tag_categories=[domain(1, "New")]))

    updated = TagCategory.objects.get(pk=1)
    assert updated.name_en == "New"
    assert updated.position == 5


def test_records_absent_from_the_file_are_kept():
    Hobby.objects.create(id=1, name_en="Climbing", name_fr="Escalade")
    Education.objects.create(
        id=1,
        institution="School",
        degree_en="BSc",
        degree_fr="Licence",
        start_date="2015-09-01",
    )
    Tag.objects.create(id=1, name_en="Kept", name_fr="Gardé", kind="skill")

    import_resume(resume(hobbies=[hobby(2, "Chess")]))

    assert set(Hobby.objects.values_list("pk", flat=True)) == {1, 2}
    assert Education.objects.filter(pk=1).exists()
    assert Tag.objects.filter(pk=1).exists()


def test_empty_file_writes_nothing():
    Hobby.objects.create(id=1, name_en="Climbing", name_fr="Escalade")

    report = import_resume({})

    assert Hobby.objects.count() == 1
    assert report.total_created == 0
    assert report.total_updated == 0


def test_unknown_top_level_keys_are_ignored():
    import_resume({**resume(hobbies=[hobby(1)]), "version": 3, "notes": ["x"]})

    assert Hobby.objects.count() == 1


def test_derived_is_current_is_ignored():
    data = resume(education=[education(1, end_date=None, is_current=False)])

    import_resume(data)

    assert Education.objects.get(pk=1).is_current is True


# Profile


def test_profile_is_created_when_there_is_none():
    import_resume(resume(profile=profile("Ada Lovelace")))

    created = Profile.objects.get()
    assert created.full_name == "Ada Lovelace"
    assert created.headline_fr == "Analyste"


def test_profile_overwrites_the_existing_one():
    Profile.objects.create(
        full_name="Old", headline_en="x", headline_fr="x", bio_en="", bio_fr=""
    )

    import_resume(resume(profile=profile("Ada Lovelace")))

    assert Profile.objects.get().full_name == "Ada Lovelace"


def test_null_profile_leaves_the_profile_as_it_is():
    Profile.objects.create(
        full_name="Old", headline_en="x", headline_fr="x", bio_en="", bio_fr=""
    )

    import_resume(resume(profile=None))

    assert Profile.objects.get().full_name == "Old"


# Projects


def test_project_missions_are_replaced_in_the_order_given():
    existing = Project.objects.create(
        id=1, title_en="P", title_fr="P", start_date="2024-01-01"
    )
    Mission.objects.create(project=existing, description_en="Old", description_fr="Old")
    missions = [text("Second", "Deuxième"), text("First", "Premier")]

    import_resume(resume(projects=[project(1, missions=missions)]))

    stored = list(existing.missions.values_list("description_en", "description_fr"))
    assert stored == [("Second", "Deuxième"), ("First", "Premier")]


def test_project_achievements_are_replaced():
    Project.objects.create(
        id=1,
        title_en="P",
        title_fr="P",
        start_date="2024-01-01",
        achievements=[{"en": "Old", "fr": "Ancien"}],
    )
    achievements = [text("Won", "Gagné"), text("Shipped", "Livré")]

    import_resume(resume(projects=[project(1, achievements=achievements)]))

    assert Project.objects.get(pk=1).achievements == achievements


def test_project_tags_are_the_listed_ones():
    kept, dropped = (
        Skill.objects.create(id=1, name_en="Kept", name_fr="Gardé"),
        Skill.objects.create(id=2, name_en="Dropped", name_fr="Retiré"),
    )
    Project.objects.create(
        id=1, title_en="P", title_fr="P", start_date="2024-01-01"
    ).tags.add(kept, dropped)
    tags = [kinded_tag(1, "Kept", "skill"), kinded_tag(3, "New", "tool")]

    import_resume(resume(projects=[project(1, tags=tags)]))

    stored = set(Project.objects.get(pk=1).tags.values_list("pk", flat=True))
    assert stored == {1, 3}
    assert Tag.objects.filter(pk=2).exists()  # unlisted tags are not deleted


def test_project_experience_is_set_from_the_experience_object():
    data = resume(
        professional_experiences=[experience(5)],
        projects=[
            project(1, experience={"id": 5, "company": "Acme", "position": text("x")}),
            project(2, experience=None),
        ],
    )

    import_resume(data)

    assert Project.objects.get(pk=1).experience_id == 5
    assert Project.objects.get(pk=2).experience_id is None


def test_project_experience_can_be_cleared_to_make_a_side_project():
    acme = ProfessionalExperience.objects.create(
        id=5, company="Acme", position_en="x", position_fr="x", start_date="2020-01-01"
    )
    Project.objects.create(
        id=1, title_en="P", title_fr="P", start_date="2024-01-01", experience=acme
    )

    import_resume(resume(projects=[project(1, experience=None)]))

    assert Project.objects.get(pk=1).experience_id is None


def test_project_can_reference_an_experience_that_only_the_database_has():
    ProfessionalExperience.objects.create(
        id=5, company="Acme", position_en="x", position_fr="x", start_date="2020-01-01"
    )
    reference = {"id": 5, "company": "Acme", "position": text("x")}

    import_resume(resume(projects=[project(1, experience=reference)]))

    assert Project.objects.get(pk=1).experience_id == 5


def test_projects_nested_in_experiences_are_ignored():
    data = resume(
        professional_experiences=[experience(5, projects=[project(99, "Nested")])]
    )

    import_resume(data)

    assert ProfessionalExperience.objects.filter(pk=5).exists()
    assert not Project.objects.filter(pk=99).exists()


# Tags


def test_tags_get_their_kind_from_their_section_or_from_where_they_are_nested():
    data = resume(
        skills=[tag(1, "Python")],
        tools=[tag(2, "Docker")],
        methodologies=[tag(3, "TDD")],
        projects=[project(1, tags=[kinded_tag(4, "Go", "skill")])],
        certifications=[certification(1, tags=[kinded_tag(5, "Git", "tool")])],
    )

    import_resume(data)

    kinds = dict(Tag.objects.values_list("pk", "kind"))
    assert kinds == {1: "skill", 2: "tool", 3: "methodology", 4: "skill", 5: "tool"}


def test_the_same_tag_listed_in_several_places_is_imported_once():
    data = resume(
        skills=[tag(1, "Python")],
        projects=[project(1, tags=[kinded_tag(1, "Python", "skill")])],
        certifications=[certification(1, tags=[kinded_tag(1, "Python", "skill")])],
    )

    report = import_resume(data)

    assert Tag.objects.count() == 1
    assert report.sections["tags"] == (1, 0)


def test_existing_tag_can_be_renamed():
    Skill.objects.create(id=1, name_en="Py", name_fr="Py")

    import_resume(resume(skills=[tag(1, "Python")]))

    assert Tag.objects.get(pk=1).name_en == "Python"


def test_conflicting_tag_definitions_are_refused():
    data = resume(
        skills=[tag(1, "Python")],
        projects=[project(1, tags=[kinded_tag(1, "Ruby", "skill")])],
    )

    errors = import_error(data)

    assert "tags" in errors
    assert row_counts()[Tag] == 0


def test_a_tag_with_two_kinds_is_refused():
    data = resume(
        skills=[tag(1, "Python")],
        certifications=[certification(1, tags=[kinded_tag(1, "Python", "tool")])],
    )

    errors = import_error(data)

    assert "tags" in errors
    assert row_counts()[Tag] == 0


def test_a_new_tag_cannot_take_the_name_of_another_tag_of_its_kind():
    Skill.objects.create(id=1, name_en="Python", name_fr="Python")

    errors = import_error(resume(skills=[tag(2, "Python")]))

    assert "tags" in errors
    assert Tag.objects.count() == 1


# Tag categories


def test_domains_and_their_categories_are_created_as_a_tree():
    data = resume(
        tag_categories=[
            domain(1, "Engineering", [category(2, "Languages"), category(3, "Ops")]),
            domain(4, "Data"),
        ]
    )

    import_resume(data)

    parents = dict(TagCategory.objects.values_list("pk", "parent_id"))
    assert parents == {1: None, 2: 1, 3: 1, 4: None}


def test_tag_membership_is_what_the_categories_list():
    TagCategory.objects.create(id=1, name_en="D", name_fr="D")
    TagCategory.objects.create(id=2, name_en="C", name_fr="C", parent_id=1)
    python = Skill.objects.create(id=1, name_en="Python", name_fr="Python")
    python.categories.add(2)
    data = resume(
        skills=[tag(1)],
        tag_categories=[
            domain(1, "D", [category(2, "C"), category(3, "C2", [noted_tag(1)])])
        ],
    )

    import_resume(data)

    assert set(python.categories.values_list("pk", flat=True)) == {3}


def test_a_tag_may_belong_to_several_categories():
    data = resume(
        skills=[tag(1)],
        tag_categories=[
            domain(
                1,
                "D",
                [category(2, "A", [noted_tag(1)]), category(3, "B", [noted_tag(1)])],
            )
        ],
    )

    import_resume(data)

    stored = set(Tag.objects.get(pk=1).categories.values_list("pk", flat=True))
    assert stored == {2, 3}


def test_a_tag_in_the_file_but_in_no_category_is_cleared_from_its_categories():
    TagCategory.objects.create(id=1, name_en="D", name_fr="D")
    TagCategory.objects.create(id=2, name_en="C", name_fr="C", parent_id=1)
    Skill.objects.create(id=1, name_en="Python", name_fr="Python").categories.add(2)

    import_resume(resume(skills=[tag(1)], tag_categories=[domain(1, "D")]))

    assert Tag.objects.get(pk=1).categories.count() == 0


def test_a_tag_not_in_the_file_keeps_its_categories():
    TagCategory.objects.create(id=1, name_en="D", name_fr="D")
    TagCategory.objects.create(id=2, name_en="C", name_fr="C", parent_id=1)
    Skill.objects.create(id=1, name_en="Python", name_fr="Python").categories.add(2)

    import_resume(resume(hobbies=[hobby(1)]))

    assert Tag.objects.get(pk=1).categories.count() == 1


def test_tag_note_comes_from_the_categories():
    Skill.objects.create(id=1, name_en="Python", name_fr="Python")
    note = text("Daily driver", "Outil quotidien")
    data = resume(
        skills=[tag(1)],
        tag_categories=[domain(1, "D", [category(2, "C", [noted_tag(1, note=note)])])],
    )

    import_resume(data)

    stored = Tag.objects.get(pk=1)
    assert (stored.note_en, stored.note_fr) == ("Daily driver", "Outil quotidien")


def test_a_tag_only_listed_in_the_categories_must_already_exist():
    data = resume(
        tag_categories=[domain(1, "D", [category(2, "C", [noted_tag(9, "Ghost")])])]
    )

    errors = import_error(data)

    assert "tag_categories" in errors
    assert row_counts()[TagCategory] == 0


def test_an_existing_tag_can_be_categorized_without_being_defined_in_the_file():
    Skill.objects.create(id=9, name_en="Python", name_fr="Python")
    data = resume(
        tag_categories=[domain(1, "D", [category(2, "C", [noted_tag(9, "Python")])])]
    )

    import_resume(data)

    assert set(Tag.objects.get(pk=9).categories.values_list("pk", flat=True)) == {2}


# Certifications and specializations


def test_certification_tags_are_the_listed_ones():
    Tool.objects.create(id=1, name_en="Docker", name_fr="Docker")
    Tool.objects.create(id=2, name_en="Git", name_fr="Git")
    Certification.objects.create(
        id=1, name_en="C", name_fr="C", issuer="I", issue_date="2024-01-01"
    ).tags.add(1)
    tags = [kinded_tag(2, "Git", "tool")]

    import_resume(resume(certifications=[certification(1, tags=tags)]))

    stored = set(Certification.objects.get(pk=1).tags.values_list("pk", flat=True))
    assert stored == {2}


def test_specialization_certifications_are_the_listed_ones():
    first = Certification.objects.create(
        id=1, name_en="A", name_fr="A", issuer="I", issue_date="2024-01-01"
    )
    Certification.objects.create(
        id=2, name_en="B", name_fr="B", issuer="I", issue_date="2024-01-01"
    )
    Specialization.objects.create(
        id=1, name_en="S", name_fr="S", issuer="I", issue_date="2024-01-01"
    ).certifications.add(first)
    data = resume(
        certifications=[certification(1, "A"), certification(2, "B")],
        specializations=[specialization(1, "S", certifications=[2])],
    )

    import_resume(data)

    stored = Specialization.objects.get(pk=1).certifications.values_list(
        "pk", flat=True
    )
    assert set(stored) == {2}


def test_the_specializations_listed_by_a_certification_are_ignored():
    first = Certification.objects.create(
        id=1, name_en="A", name_fr="A", issuer="I", issue_date="2024-01-01"
    )
    Specialization.objects.create(
        id=1, name_en="S", name_fr="S", issuer="I", issue_date="2024-01-01"
    ).certifications.add(first)
    data = resume(
        certifications=[
            certification(1, "A", specializations=[{"id": 1, "name": text("S")}])
        ],
        specializations=[specialization(1, "S", certifications=[])],
    )

    import_resume(data)

    assert first.specializations.count() == 0


def test_specialization_can_list_a_certification_created_by_the_same_file():
    data = resume(
        certifications=[certification(1)],
        specializations=[specialization(1, certifications=[1])],
    )

    import_resume(data)

    stored = Specialization.objects.get(pk=1).certifications.values_list(
        "pk", flat=True
    )
    assert list(stored) == [1]


# Refused files


def test_unknown_experience_is_refused_and_nothing_is_written():
    reference = {"id": 404, "company": "Ghost", "position": text("x")}
    data = resume(
        hobbies=[hobby(1)],
        projects=[project(1, experience=reference)],
    )

    errors = import_error(data)

    assert "experience" in errors["projects"][0]
    assert row_counts()[Hobby] == 0
    assert row_counts()[Project] == 0


def test_unknown_certification_is_refused_and_nothing_is_written():
    data = resume(
        hobbies=[hobby(1)],
        specializations=[specialization(1, certifications=[404])],
    )

    errors = import_error(data)

    assert "certifications" in errors["specializations"][0]
    assert row_counts()[Hobby] == 0
    assert row_counts()[Specialization] == 0


INVALID_RECORDS = [
    pytest.param(
        {"tag_categories": [{**domain(1), "name": {"en": "No French"}}]},
        ("tag_categories", 0, "name"),
        id="tag-category-saved-first",
    ),
    pytest.param(
        {"projects": [project(1), {**project(2), "title": {"en": "No French"}}]},
        ("projects", 1, "title"),
        id="project-in-the-middle",
    ),
    pytest.param(
        {"hobbies": [hobby(1), hobby(2), {**hobby(3), "name": text("x" * 300)}]},
        ("hobbies", 2, "name"),
        id="third-hobby",
    ),
    pytest.param(
        {"education": [education(1, end_date="2019-01-01")]},
        ("education", 0, "end_date"),
        id="end-before-start",
    ),
    pytest.param(
        {"profile": {**profile(), "full_name": ""}},
        ("profile", None, "full_name"),
        id="profile-saved-last",
    ),
]


@pytest.mark.parametrize(("sections", "location"), INVALID_RECORDS)
def test_an_invalid_record_anywhere_refuses_the_whole_file(sections, location):
    Hobby.objects.create(id=50, name_en="Before", name_fr="Avant")
    before = row_counts()
    data = resume(**{"hobbies": [hobby(50, "After")], **sections})

    errors = import_error(data)

    section, index, field = location
    section_errors = errors[section]
    assert field in (section_errors if index is None else section_errors[index])
    assert row_counts() == before
    assert Hobby.objects.get(pk=50).name_en == "Before"


def test_errors_of_several_records_are_reported_together():
    data = resume(
        hobbies=[{**hobby(1), "name": {"en": "No French"}}],
        projects=[{**project(1), "title": {"en": "No French"}}],
    )

    errors = import_error(data)

    assert "name" in errors["hobbies"][0]
    assert "title" in errors["projects"][0]


def test_a_missing_required_field_is_reported_on_that_field():
    broken = hobby(1)
    del broken["name"]

    errors = import_error(resume(hobbies=[broken]))

    assert "name" in errors["hobbies"][0]


@pytest.mark.parametrize("data", [[], "resume", None, 12])
def test_data_that_is_not_an_object_is_refused(data):
    errors = import_error(data)

    assert "non_field_errors" in errors


def test_a_section_that_is_not_a_list_is_refused_and_nothing_is_written():
    data = resume(hobbies=[hobby(1)], projects={"id": 1})

    errors = import_error(data)

    assert "projects" in errors
    assert Hobby.objects.count() == 0


# Query count


def count_queries(data):
    with CaptureQueriesContext(connection) as queries:
        import_resume(data)
    return len(queries)


def many_hobbies(count, first_id=1):
    return resume(
        hobbies=[
            hobby(id_, f"Hobby {id_}") for id_ in range(first_id, first_id + count)
        ]
    )


def many_projects(count, first_id=1):
    """Projects with two missions and two tags each."""
    tags = [kinded_tag(1, "Python", "skill"), kinded_tag(2, "Docker", "tool")]
    missions = [text("Design"), text("Build")]
    return resume(
        projects=[
            project(id_, f"Project {id_}", tags=tags, missions=missions)
            for id_ in range(first_id, first_id + count)
        ]
    )


def extra_queries_per_ten_records(build, existing):
    """Queries that importing 30 records costs more than importing 10.

    With `existing`, both runs overwrite records that are already stored;
    otherwise both create new ones.
    """
    if existing:
        import_resume(build(30))
    small = count_queries(build(10))
    large = count_queries(build(30, first_id=1 if existing else 1000))
    return (large - small) / 2


@pytest.mark.parametrize("existing", [False, True], ids=["create", "update"])
def test_a_hobby_costs_one_query(existing):
    """Existing ids are looked up once per model, not once per record."""
    extra = extra_queries_per_ten_records(many_hobbies, existing)

    assert extra <= 10


@pytest.mark.parametrize("existing", [False, True], ids=["create", "update"])
def test_a_project_with_missions_and_tags_costs_a_bounded_number_of_queries(existing):
    extra = extra_queries_per_ten_records(many_projects, existing)

    assert extra <= 10 * 10


# Malformed records


@pytest.mark.parametrize(
    ("record", "field"),
    [
        pytest.param("Climbing", "non_field_errors", id="not-an-object"),
        pytest.param({**hobby(1), "id": "1"}, "id", id="id-not-an-integer"),
        pytest.param({**hobby(1), "id": 0}, "id", id="id-not-positive"),
        pytest.param({**hobby(1), "id": True}, "id", id="id-a-boolean"),
    ],
)
def test_a_malformed_record_is_refused(record, field):
    errors = import_error(resume(hobbies=[record]))

    assert field in errors["hobbies"][0]
    assert Hobby.objects.count() == 0


def test_an_id_listed_twice_in_a_section_is_refused():
    errors = import_error(resume(hobbies=[hobby(1), hobby(1, "Chess")]))

    assert "id" in errors["hobbies"][1]
    assert Hobby.objects.count() == 0


def test_domain_children_that_are_not_a_list_are_refused():
    errors = import_error(resume(tag_categories=[{**domain(1), "children": {}}]))

    assert "children" in errors["tag_categories"][0]


def test_an_invalid_category_is_reported_under_its_domain():
    data = resume(
        tag_categories=[
            domain(
                1,
                "D",
                [
                    category(2, "Fine"),
                    {**category(3), "name": {"en": "No French"}},
                    {**category(4), "id": None},
                ],
            )
        ]
    )

    errors = import_error(data)

    children = errors["tag_categories"][0]["children"]
    assert set(children) == {1, 2}
    assert "name" in children[1]
    assert "id" in children[2]
    assert TagCategory.objects.count() == 0


def test_a_nested_tag_without_a_valid_id_is_refused():
    data = resume(projects=[project(1, tags=[{"name": text("Python")}])])

    errors = import_error(data)

    assert "tags" in errors["projects"]
    assert Project.objects.count() == 0


def test_a_nested_tag_with_an_unknown_kind_is_refused():
    data = resume(projects=[project(1, tags=[kinded_tag(1, "Python", "language")])])

    errors = import_error(data)

    assert "kind" in errors["tags"][1]
    assert Tag.objects.count() == 0
