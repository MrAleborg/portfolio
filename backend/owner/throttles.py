from rest_framework.throttling import ScopedRateThrottle


class CountValidRequestsThrottle(ScopedRateThrottle):
    """A scoped throttle that refuses over the limit but counts only on record().

    The view calls allow_request() first, then record() once the request has
    proved valid, so mistyped forms do not use up a visitor's allowance.
    """

    def throttle_success(self):
        return True

    def record(self):
        super().throttle_success()
