from django.apps import AppConfig
class LandingPagesConfig(AppConfig):
    name = 'landing_pages'
    def ready(self):
        from website_builder.validation import FONTS
        FONTS.update({'Saira Condensed', 'Instrument Sans'})
