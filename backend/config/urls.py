from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from accounts import views as accounts
from observations import views
from rewards import views as rewards
from identity import setup_views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/login", accounts.login), path("api/v1/auth/register", accounts.register),
    path("api/v1/auth/session", accounts.current_session), path("api/v1/auth/refresh", TokenRefreshView.as_view()),
    path("api/v1/auth/logout", accounts.logout),
    path("api/v1/kibble/wallet", rewards.wallet), path("api/v1/kibble/ledger", rewards.ledger),
    path("api/v1/identity/setup", setup_views.setup),
    path("api/v1/identity/calibrations", setup_views.import_calibration),
    path("api/v1/identity/policies/<int:policy_id>/activation", setup_views.activate_policy),
    path("api/v1/capture/status", views.status), path("api/v1/media", views.media_upload),
    path("api/v1/media/<uuid:asset_id>/<str:kind>", views.media_content),
    path("api/v1/media/<uuid:asset_id>", views.media_remove),
    path("api/v1/captures", views.captures), path("api/v1/captures/<uuid:capture_id>/observations", views.capture_observations),
    path("api/v1/observations", views.my_observations), path("api/v1/observations/<uuid:observation_id>", views.observation_detail),
    path("api/v1/observations/<uuid:observation_id>/selection", views.selection),
    path("api/v1/observations/<uuid:observation_id>/analysis", views.analysis),
    path("api/v1/observations/<uuid:observation_id>/submit", views.submit),
    path("api/v1/moderation/animal-identities", views.review_queue),
    path("api/v1/moderation/animal-identities/<uuid:observation_id>/decision", views.review),
    path("api/v1/animals", views.animals), path("api/v1/animals/<uuid:animal_id>", views.animal_detail),
    path("api/v1/animals/<uuid:animal_id>/references", views.references),
    path("api/v1/animals/<uuid:animal_id>/references/<uuid:reference_id>", views.references),
    path("api/v1/sightings", views.legacy_sighting),
    path("api/v1/community", views.public_community),
    path("api/v1/animal-profiles/<slug:slug>", views.public_animal_profile),
    path("api/v1/", include("social.urls")),
    path("api/v1/<path:resource>", views.unsupported_domain),
]

urlpatterns += [path("api/v1/landing-pages/", include("landing_pages.urls"))]
