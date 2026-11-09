from django.urls import path
from . import views, routing, area_views
urlpatterns=[
    path('map/communities/',area_views.communities),
    path('map/route/',routing.walking_route),
    path('map/entities/',views.entities),path('map/nearby/',views.entities),path('map/mine/',views.mine),
    path('incidents/',views.create_incident),path('incidents/<uuid:identifier>/evidence/',views.evidence),
    path('incidents/<uuid:identifier>/',views.incident_detail),path('help-requests/<uuid:identifier>/offers/',views.offer),
    path('incidents/evidence/<uuid:identifier>/',views.evidence_file),path('incidents/<uuid:identifier>/corrections/',views.correction),
    path('help-requests/',views.create_help),path('map/moderation/',views.queue),path('map/moderation/<str:kind>/<uuid:identifier>/',views.review),
    path('reputation/events/',views.record_contribution),
]
