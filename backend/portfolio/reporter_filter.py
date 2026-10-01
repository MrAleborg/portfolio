from django.views.debug import SafeExceptionReporterFilter


class FrameCleansingReporterFilter(SafeExceptionReporterFilter):
    """Also hides sensitive values in the local variables of every frame.

    Django only hides the variables a view marks with @sensitive_variables, so
    libraries like Simple JWT show the plaintext password (in `attrs`, ...) in
    an error report. This hides the dict keys and variable names that look
    sensitive (password, token, key, ...), like Django does for settings.
    """

    def get_traceback_frame_variables(self, request, tb_frame):
        variables = super().get_traceback_frame_variables(request, tb_frame)
        return [(name, self.cleanse_setting(name, value)) for name, value in variables]
