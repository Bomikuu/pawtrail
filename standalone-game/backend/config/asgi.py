import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
from django.core.asgi import get_asgi_application
http=get_asgi_application()
from channels.routing import ProtocolTypeRouter,URLRouter
from django.urls import path
from housing.live import HomeConsumer
application=ProtocolTypeRouter({'http':http,'websocket':URLRouter([path('ws/homes',HomeConsumer.as_asgi())])})
