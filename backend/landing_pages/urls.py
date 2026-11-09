from django.urls import path
from . import views
urlpatterns=[path('workspace',views.workspace),path('public/<slug:slug>',views.published),path('media/<uuid:media_id>',views.media),path('unpublish/<uuid:website_id>',views.unpublish),path('builder/<path:route>',views.builder)]
