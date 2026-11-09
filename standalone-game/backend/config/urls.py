from django.urls import path,include
from housing import views
urlpatterns=[path('api/homes/exchange',views.exchange),path('api/homes/state',views.bootstrap),path('api/homes/people',views.people),path('api/homes/places',views.places),path('api/homes/community-counts',views.community_counts),path('api/homes/action',views.action)]
urlpatterns+=[path('api/v1/',include('community_map.urls'))]

urlpatterns+=[path('api/homes/companions',views.companions)]

from housing.characters import characters,character_detail
from housing.cat_appearances import cat_appearances
urlpatterns += [path('api/homes/cat-appearances',cat_appearances)]
urlpatterns += [path('api/homes/characters',characters),path('api/homes/characters/<str:identity>',character_detail)]
