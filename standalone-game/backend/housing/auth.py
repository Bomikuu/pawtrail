import base64,hashlib,hmac,json,time
from django.core.cache import cache
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.http import HttpResponse

def decode_ticket(token):
    try:
        if token.startswith('session.'):
            data=cache.get(token)
            if not data or data['exp']<=time.time():raise ValueError()
            return data
        payload,signature=token.split('.')
        actual=base64.urlsafe_b64decode(signature+'='*(-len(signature)%4))
        expected=hmac.new(settings.SECRET_KEY.encode(),payload.encode(),hashlib.sha256).digest()
        if not hmac.compare_digest(actual,expected):raise ValueError()
        data=json.loads(base64.urlsafe_b64decode(payload+'='*(-len(payload)%4)))
        if data['aud']!='pawtrail-housing' or not time.time()<data['exp']<=time.time()+180 or not isinstance(data['id'],str) or len(data['id'])>160:raise ValueError()
        return data
    except Exception:raise AuthenticationFailed('Your game session expired. Reconnect through PawTrail.')
class GameAuthentication(BaseAuthentication):
    def authenticate_header(self,request):return 'Bearer'
    def authenticate(self,request):
        value=request.headers.get('Authorization','')
        if not value.startswith('Bearer '):return None
        from .service import provision
        data=decode_ticket(value[7:])
        if value[7:].startswith('session.'):
            from .models import PlayerGameProfile
            player=PlayerGameProfile.objects.filter(pk=data['id']).first()
            if not player:raise AuthenticationFailed('Reconnect your game session.')
            return player,data
        return provision(data),data
class OriginMiddleware:
    def __init__(self,get_response):self.get_response=get_response
    def __call__(self,request):
        origin=request.headers.get('Origin')
        if origin and origin not in settings.GAME_ORIGINS:return HttpResponse(status=403)
        response=HttpResponse(status=204) if request.method=='OPTIONS' else self.get_response(request)
        if origin in settings.GAME_ORIGINS:
            response['Access-Control-Allow-Origin']=origin
            response['Vary']='Origin'
            response['Access-Control-Allow-Headers']='Authorization, Content-Type, Idempotency-Key'
            response['Access-Control-Allow-Methods']='GET, POST, OPTIONS'
        response['Cache-Control']='no-store'
        return response
