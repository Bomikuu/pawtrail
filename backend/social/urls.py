from .achievements import views as achievements
from django.urls import path
from . import community_stats,medical,animals,adoption,community,discovery,events,fundraising,leaderboard,missions,moderation,people,organizations
from rewards import views as rewards
urlpatterns=[
    path('discovery/community-stats',community_stats.summary),
    path('social/animals/<str:key>/medical',medical.records),
    path('social/animals/<str:key>/medical/<uuid:record_id>',medical.records),
    path('me/achievements', achievements.overview),
    path('me/achievements/claim', achievements.claim),
    path('me/achievements/showcase', achievements.showcase),
    path('me/achievements/activity', achievements.record_activity),
    path('me/achievement-proofs', achievements.proofs),
    path('moderation/achievement-proofs', achievements.proofs, {'review_scope': True}),
    path('moderation/achievement-proofs/<str:key>/review', achievements.review_proof),
    path('social/animals',animals.animals),path('social/animals/reports',animals.animals),path('social/animals/<str:key>/activity',animals.activity),path('social/animals/<str:key>/saved',community.saved,{'kind':'animal'}),path('social/animals/<str:key>',animals.animals),
    path('missions',missions.missions),path('missions/<str:key>/accept',missions.accept),path('missions/<str:key>/close',missions.close),path('missions/<str:key>',missions.missions),path('mission-participations',missions.participations),path('mission-participations/<str:key>/evidence',missions.evidence),path('mission-participations/<str:key>/review',missions.review),
    path('adoption/preferences',adoption.preferences),path('adoption/candidates',adoption.candidates),path('adoption/interested',adoption.interested),path('adoption/interested/<str:key>',adoption.interested),path('adoption/drafts/<str:key>',adoption.draft),path('adoption/applications',adoption.applications),path('adoption/applications/<str:key>/<str:action>',adoption.application_action),path('adoption/applications/<str:key>',adoption.applications),
    path('me/pledges',fundraising.my_pledges),path('pledges/<str:key>/withdraw',fundraising.withdraw_pledge),
    path('fundraisers',fundraising.campaigns),path('fundraisers/drafts',fundraising.drafts),path('fundraisers/drafts/<str:key>',fundraising.drafts),path('fundraisers/<str:key>/pledges',fundraising.pledge),path('fundraisers/<str:key>/receipts',fundraising.record_receipt),path('fundraisers/<str:key>/updates',fundraising.updates),path('fundraisers/<str:key>/expenses',fundraising.expenses),path('fundraisers/<str:key>/close',fundraising.close),path('fundraisers/<str:key>/supporters',fundraising.supporters),path('fundraisers/<str:key>',fundraising.campaigns),path('me/fundraising',fundraising.dashboard),
    path('events',events.events),path('events/<str:key>/rsvp',events.rsvp),path('events/<str:key>',events.events),path('shelters',organizations.shelters),path('shelters/<str:key>/dashboard',organizations.shelter_dashboard),path('shelters/<str:key>/staff',organizations.shelter_staff),path('shelters/<str:key>',organizations.shelters),path('hordes',organizations.hordes),path('hordes/<str:key>/animals',organizations.horde_members),path('hordes/<str:key>',organizations.hordes),
    path('leaderboard',leaderboard.leaderboard),path('me/kibble',rewards.wallet),path('me/kibble/transactions',leaderboard.transactions),path('community/posts',community.posts),path('community/posts/<str:key>/reaction',community.reaction),path('community/posts/<str:key>/saved',community.saved,{'kind':'post'}),path('community/posts/<str:key>',community.posts),path('discussions/<str:kind>/<str:key>/comments',community.comments),
    path('me/profile',people.me),path('me/settings',people.me,{'section':'settings'}),path('me/summary',people.me,{'section':'summary'}),path('me/notifications',people.notifications),path('me/notifications/<str:action>',people.notifications),path('users/identities/batch',people.identities),path('users/<str:username>/preview',people.users,{'preview':True}),path('users/<str:username>',people.users),path('follows',people.follows),path('follows/<str:kind>/<str:key>',people.follows),
    path('areas',discovery.areas),path('discovery/areas',discovery.areas),path('discovery/nearby',discovery.nearby),path('search',discovery.search),path('social/sightings',discovery.sightings),path('reports',moderation.report),path('moderation',moderation.queue),path('moderation/<str:key>/review',moderation.review),
]
