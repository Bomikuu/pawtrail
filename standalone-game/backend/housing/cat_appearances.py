"""Private cosmetic cat library, independent from real animal identities/pets."""
import json,re
from pathlib import Path
from django.db import transaction
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError,NotFound
from rest_framework.response import Response
from .models import PlayerCatAppearance,PlayerGameProfile
from .service import check_rate

RIG=Path(__file__).resolve().parents[2]/'src/game/actor-rig'
CHOICES=json.loads((RIG/'cat-contract.json').read_text())
PALETTE=json.loads((RIG/'palette.json').read_text())
ID=re.compile(r'^cat_[a-f0-9]{32}$')
LIMIT=24

def validate_appearance(value):
    if not isinstance(value,dict) or type(value.get('version')) is not int or value['version']!=1:raise ValidationError({'detail':'This cat format is not supported.'})
    cat,colors=value.get('cat'),value.get('colors')
    if not isinstance(cat,dict) or not isinstance(colors,dict):raise ValidationError({'detail':'The cat configuration is incomplete.'})
    clean_cat={}
    for slot,options in CHOICES.items():
        choice=cat.get(slot,{'bodySize':'standard','faceMarking':'none'}.get(slot))
        if not isinstance(choice,str) or choice not in options:raise ValidationError({'detail':'Choose an available '+slot+' option.'})
        clean_cat[slot]=choice
    clean_colors={}
    for key in PALETTE:
        if not isinstance(colors.get(key),str) or not re.fullmatch(r'#[a-f0-9A-F]{6}',colors[key]):raise ValidationError({'detail':'Use six-digit hex colors.'})
        clean_colors[key]=colors[key].lower()
    eye=clean_colors['shirtLight'] if clean_cat['pattern']=='colorpoint' else clean_colors['gold']
    face=value.get('face',{'leftEye':eye,'rightEye':eye,'nose':clean_colors['skinShadow'],'marking':clean_colors['ink']})
    if not isinstance(face,dict):raise ValidationError({'detail':'Choose valid cat face details.'})
    clean_face={}
    for key in ('leftEye','rightEye','nose','marking'):
        if not isinstance(face.get(key),str) or not re.fullmatch(r'#[a-f0-9A-F]{6}',face[key]):raise ValidationError({'detail':'Use six-digit face colors.'})
        clean_face[key]=face[key].lower()
    return {'version':1,'cat':clean_cat,'colors':clean_colors,'face':clean_face}

def serialize(row):
    return {'id':row.pk,'name':row.name,'appearance':row.appearance,'thumbnail':row.thumbnail,'revision':row.revision,'updated':row.updated.isoformat(),'scope':'account'}

@api_view(['GET','POST'])
def cat_appearances(request):
    check_rate('cat-creator:'+str(request.user.pk),100,60)
    if request.method=='GET':return Response({'items':[serialize(row) for row in PlayerCatAppearance.objects.filter(owner=request.user).order_by('-updated')],'limit':LIMIT})
    body=request.data
    identity=body.get('id')
    if not isinstance(identity,str) or not ID.fullmatch(identity):raise ValidationError({'detail':'Choose a valid cat.'})
    operation=body.get('operation')
    if operation not in ('save','delete'):raise ValidationError({'detail':'Choose a cat library operation.'})
    with transaction.atomic():
        player=PlayerGameProfile.objects.select_for_update().get(pk=request.user.pk)
        row=PlayerCatAppearance.objects.select_for_update().filter(pk=identity,owner=player).first()
        if operation=='delete':
            if not row:raise NotFound('This cat is no longer in your library.')
            row.delete();return Response({'deleted':identity})
        name=body.get('name')
        if not isinstance(name,str) or not 1<=len(name.strip())<=64 or any(ord(c)<32 for c in name):raise ValidationError({'detail':'Give your cat a name of 1–64 characters.'})
        appearance=validate_appearance(body.get('appearance'))
        thumbnail=body.get('thumbnail','')
        if not isinstance(thumbnail,str) or len(thumbnail)>100000 or thumbnail and not re.fullmatch(r'data:image/png;base64,[A-Za-z0-9+/=]+',thumbnail):raise ValidationError({'detail':'Use a supported cat thumbnail.'})
        if row:
            if type(body.get('revision')) is not int or body['revision']!=row.revision:return Response({'detail':'This cat changed elsewhere. Refresh the library before saving.'},status=409)
            row.name=name.strip();row.appearance=appearance;row.thumbnail=thumbnail;row.revision+=1;row.save()
        else:
            if PlayerCatAppearance.objects.filter(pk=identity).exists():raise ValidationError({'detail':'Choose a new cat ID.'})
            if PlayerCatAppearance.objects.filter(owner=player).count()>=LIMIT:raise ValidationError({'detail':'Your cat library is full. Remove a cat before creating another.'})
            row=PlayerCatAppearance.objects.create(id=identity,owner=player,name=name.strip(),appearance=appearance,thumbnail=thumbnail)
        return Response({'cat':serialize(row)})
