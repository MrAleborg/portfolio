"""The admin page that imports a resume file (see experience.resume_import)."""

import json

from django import forms
from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied
from django.shortcuts import redirect
from django.template.response import TemplateResponse

from experience.resume_import import ResumeImportError, import_resume

MAX_FILE_SIZE = 5 * 1024 * 1024


class ResumeFileForm(forms.Form):
    file = forms.FileField(
        label="Resume file",
        help_text=(
            "JSON in the format of GET /api/v1/resume/, up to 5 MB. Records are "
            "matched by id: a known id is overwritten, a new id is created."
        ),
    )

    def clean_file(self):
        """The file's JSON."""
        file = self.cleaned_data["file"]
        if file.size > MAX_FILE_SIZE:
            raise forms.ValidationError("The file is larger than 5 MB.")
        try:
            return json.load(file)
        except ValueError as error:
            raise forms.ValidationError(f"The file is not valid JSON: {error}")


def error_lines(errors, path=""):
    """Flatten nested import errors to "projects[2].title.fr: message" lines."""
    if isinstance(errors, dict):
        lines = []
        for key, value in errors.items():
            if isinstance(key, int):
                child = f"{path}[{key}]"
            elif key == "non_field_errors":
                child = path
            else:
                child = f"{path}.{key}" if path else str(key)
            lines.extend(error_lines(value, child))
        return lines
    if isinstance(errors, list) and all(isinstance(item, str) for item in errors):
        return [f"{path}: {message}" if path else message for message in errors]
    if isinstance(errors, list):
        return [
            line
            for index, item in enumerate(errors)
            for line in error_lines(item, f"{path}[{index}]")
        ]
    return [f"{path}: {errors}" if path else str(errors)]


def report_message(report):
    sections = ", ".join(
        f"{section} {created}/{updated}"
        for section, (created, updated) in report.sections.items()
    )
    message = (
        f"Resume imported: {report.total_created} created, "
        f"{report.total_updated} updated."
    )
    if sections:
        message += f" Per section (created/updated): {sections}."
    return message


def import_resume_view(request):
    """Upload a resume file. Superusers only: an import rewrites everything."""
    if not request.user.is_superuser:
        raise PermissionDenied
    import_errors = []
    if request.method == "POST":
        form = ResumeFileForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                report = import_resume(form.cleaned_data["file"])
            except ResumeImportError as error:
                import_errors = error_lines(error.errors)
            else:
                messages.success(request, report_message(report))
                return redirect("admin:index")
    else:
        form = ResumeFileForm()
    context = {
        **admin.site.each_context(request),
        "title": "Import resume",
        "form": form,
        "import_errors": import_errors,
    }
    return TemplateResponse(request, "experience/admin/import_resume.html", context)
