"""Serializer fields of text translated in every language of LANGUAGES."""

from rest_framework import serializers

from experience.languages import LANGUAGES


class LocalizedText(serializers.Field):
    """A text in every language, as a single object: {"en": "...", "fr": "..."}.

    Every language must be filled in. With allow_blank, the text may instead
    be empty in every language. Errors are reported per language.
    """

    default_error_messages = {
        "not_an_object": "Expected an object with one text per language: {languages}.",
        "unknown_language": "Unknown language.",
        "partly_blank": "Fill in every language, or leave them all empty.",
    }

    def __init__(self, allow_blank=False, max_length=None, **kwargs):
        self.allow_blank = allow_blank
        self.max_length = max_length
        super().__init__(**kwargs)

    def to_representation(self, texts):
        return {language: texts[language] for language in LANGUAGES}

    def to_internal_value(self, data):
        if not isinstance(data, dict):
            self.fail("not_an_object", languages=", ".join(LANGUAGES))
        errors = {
            language: [self.error_messages["required"]]
            for language in LANGUAGES
            if language not in data
        }
        errors.update(
            (language, [self.error_messages["unknown_language"]])
            for language in data
            if language not in LANGUAGES
        )
        if errors:
            raise serializers.ValidationError(errors)
        text_field = serializers.CharField(
            allow_blank=self.allow_blank, max_length=self.max_length
        )
        texts = {}
        for language in LANGUAGES:
            try:
                texts[language] = text_field.run_validation(data[language])
            except serializers.ValidationError as error:
                errors[language] = error.detail
        if any(texts.values()):
            errors.update(
                (language, [self.error_messages["partly_blank"]])
                for language, text in texts.items()
                if not text
            )
        if errors:
            raise serializers.ValidationError(errors)
        return texts


class LocalizedField(LocalizedText):
    """A LocalizedText stored as one column per language, e.g. title_en and
    title_fr.

    The columns are named after the field, so source is the whole instance.
    On a model serializer, max_length is that of the first language's column.
    """

    def __init__(self, **kwargs):
        super().__init__(source="*", **kwargs)

    def bind(self, field_name, parent):
        super().bind(field_name, parent)
        model = getattr(getattr(parent, "Meta", None), "model", None)
        if model is not None:
            column = model._meta.get_field(f"{field_name}_{LANGUAGES[0]}")
            self.max_length = column.max_length

    def to_representation(self, instance):
        return {
            language: getattr(instance, f"{self.field_name}_{language}")
            for language in LANGUAGES
        }

    def to_internal_value(self, data):
        texts = super().to_internal_value(data)
        return {
            f"{self.field_name}_{language}": text for language, text in texts.items()
        }
