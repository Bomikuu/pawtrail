"""Keep ordinary browsing and session reads out of mutation rate budgets."""
from rest_framework.permissions import SAFE_METHODS
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class BrowseAnonThrottle(AnonRateThrottle):
    scope = 'anon_read'

    def get_cache_key(self, request, view):
        return super().get_cache_key(request, view) if request.method in SAFE_METHODS else None


class BrowseUserThrottle(UserRateThrottle):
    scope = 'user_read'

    def get_cache_key(self, request, view):
        if request.method not in SAFE_METHODS or not request.user.is_authenticated:
            return None
        return super().get_cache_key(request, view)


class MutationAnonThrottle(AnonRateThrottle):
    def get_cache_key(self, request, view):
        return super().get_cache_key(request, view) if request.method not in SAFE_METHODS else None


class MutationUserThrottle(UserRateThrottle):
    def get_cache_key(self, request, view):
        return super().get_cache_key(request, view) if request.method not in SAFE_METHODS else None
