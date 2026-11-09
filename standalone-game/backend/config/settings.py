import os
from pathlib import Path
import dj_database_url
BASE_DIR=Path(__file__).resolve().parent.parent
DEBUG=os.environ.get('PAWTRAIL_PRODUCTION')!='1'
DATA_DIR=Path(os.environ.get('PAWTRAIL_GAME_DATA_DIR',str(Path.home()/'.local/share/pawtrail-housing')))
DATA_DIR.mkdir(parents=True,exist_ok=True,mode=0o700)
def bridge_secret():
    value=os.environ.get('PAWTRAIL_GAME_SECRET')
    if value:return value
    if not DEBUG:raise RuntimeError('PAWTRAIL_GAME_SECRET is required in production')
    p=DATA_DIR/'bridge-secret'
    try:
        fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w') as f:f.write(__import__('secrets').token_hex(32))
    except FileExistsError:pass
    return p.read_text().strip()
SECRET_KEY=bridge_secret()
ALLOWED_HOSTS=os.environ.get('PAWTRAIL_GAME_HOSTS','127.0.0.1,localhost').split(',')
GAME_ORIGINS=os.environ.get('PAWTRAIL_GAME_ORIGINS','http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:5173').split(',')
INSTALLED_APPS=['daphne','django.contrib.contenttypes','rest_framework','channels','housing','community_map']
MIDDLEWARE=['django.middleware.security.SecurityMiddleware','housing.auth.OriginMiddleware']
ROOT_URLCONF='config.urls'
ASGI_APPLICATION='config.asgi.application'
DATABASES={'default':dj_database_url.parse(os.environ['DATABASE_URL'],conn_max_age=60) if os.environ.get('DATABASE_URL') else {'ENGINE':'django.db.backends.sqlite3','NAME':DATA_DIR/'homes.sqlite3','OPTIONS':{'timeout':30,'transaction_mode':'IMMEDIATE'}}}
MAP_USE_POSTGIS=os.environ.get('PAWTRAIL_MAP_POSTGIS')=='1'
if MAP_USE_POSTGIS:
    if DATABASES['default']['ENGINE']!='django.db.backends.postgresql':raise RuntimeError('Map PostGIS requires PostgreSQL DATABASE_URL')
    DATABASES['default']['ENGINE']='django.contrib.gis.db.backends.postgis'
    INSTALLED_APPS+=['django.contrib.gis','community_geo']
MEDIA_ROOT=DATA_DIR/'private-uploads'
FILE_UPLOAD_MAX_MEMORY_SIZE=2*1024*1024
DATA_UPLOAD_MAX_MEMORY_SIZE=12*1024*1024
if not DEBUG and (not os.environ.get('DATABASE_URL') or not os.environ.get('REDIS_URL')):raise RuntimeError('Production requires PostgreSQL DATABASE_URL and REDIS_URL')
CHANNEL_LAYERS={'default':{'BACKEND':'channels_redis.core.RedisChannelLayer','CONFIG':{'hosts':[os.environ['REDIS_URL']]}} if os.environ.get('REDIS_URL') else {'BACKEND':'channels.layers.InMemoryChannelLayer'}}
CACHES={'default':{'BACKEND':'django.core.cache.backends.redis.RedisCache','LOCATION':os.environ['REDIS_URL']} if os.environ.get('REDIS_URL') else {'BACKEND':'django.core.cache.backends.locmem.LocMemCache'}}
REST_FRAMEWORK={'DEFAULT_AUTHENTICATION_CLASSES':['housing.auth.GameAuthentication'],'DEFAULT_PERMISSION_CLASSES':['rest_framework.permissions.IsAuthenticated'],'UNAUTHENTICATED_USER':None,'DEFAULT_RENDERER_CLASSES':['rest_framework.renderers.JSONRenderer']}
TIME_ZONE='UTC'
USE_TZ=True
DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'
VISITOR_LIMIT=int(os.environ.get('PAWTRAIL_HOUSE_CAPACITY','8'))

# Valhalla endpoint for on-demand shortest walking routes.
# The public community service is a bounded local-development default only.
WALKING_ROUTING_URL=os.environ.get('PAWTRAIL_ROUTING_URL','https://valhalla1.openstreetmap.de/route' if DEBUG else '')
WALKING_ROUTING_CLIENT_ID=os.environ.get('PAWTRAIL_ROUTING_CLIENT_ID','pawtrail-local')
