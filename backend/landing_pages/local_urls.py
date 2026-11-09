from django.urls import path, include
urlpatterns=[path('api/v1/landing-pages/',include('landing_pages.urls'))]
