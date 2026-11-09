from types import SimpleNamespace
from django.core.cache import cache
from django.test import RequestFactory, SimpleTestCase, override_settings
from .throttles import BrowseAnonThrottle, BrowseUserThrottle, MutationAnonThrottle, MutationUserThrottle


@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
                                     'LOCATION': 'pawtrail-throttle-policy-tests'}})
class BrowsingThrottleTests(SimpleTestCase):
    def setUp(self):
        cache.clear()
        self.factory = RequestFactory()

    def assert_independent_budgets(self, read_class, write_class, authenticated):
        class LimitedRead(read_class):
            rate = '2/minute'

        class LimitedWrite(write_class):
            rate = '1/minute'

        user = SimpleNamespace(is_authenticated=authenticated, pk='policy-test-user')
        read, write = self.factory.get('/'), self.factory.post('/')
        read.user = write.user = user
        self.assertTrue(LimitedRead().allow_request(read, None))
        self.assertTrue(LimitedRead().allow_request(read, None))
        self.assertFalse(LimitedRead().allow_request(read, None))
        # Reading and session polling must not spend the mutation budget.
        self.assertTrue(LimitedWrite().allow_request(read, None))
        self.assertTrue(LimitedWrite().allow_request(write, None))
        self.assertFalse(LimitedWrite().allow_request(write, None))
        # A write also leaves the exhausted read bucket unchanged.
        self.assertTrue(LimitedRead().allow_request(write, None))
        self.assertFalse(LimitedRead().allow_request(read, None))

    def test_anonymous_read_and_write_limits_are_independent(self):
        self.assert_independent_budgets(BrowseAnonThrottle, MutationAnonThrottle, False)

    def test_member_read_and_write_limits_are_independent(self):
        self.assert_independent_budgets(BrowseUserThrottle, MutationUserThrottle, True)
