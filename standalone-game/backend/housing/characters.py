"""Owner-scoped cosmetic character configurations; never welfare or reward data."""
import json,re
from pathlib import Path
from django.db import transaction
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError,NotFound,PermissionDenied
from rest_framework.response import Response
from .models import PlayerCharacter,PlayerGameProfile,HouseVisitor
from .service import check_rate,blocked_users,broadcast,user_group,group,room_key,person

RIG=Path(__file__).resolve().parents[2]/'src/game/actor-rig'
CONTRACT=json.loads((RIG/'contract.json').read_text())
PALETTE=json.loads((RIG/'palette.json').read_text())
ID=re.compile(r'^custom_[a-f0-9]{32}$')

def validate_appearance(value):
    if not isinstance(value,dict) or type(value.get('version')) is not int or value['version']!=1:raise ValidationError({'detail':'This character format is not supported.'})
    parts=value.get('parts');colors=value.get('colors');accessories=value.get('accessories')
    if not isinstance(parts,dict) or not isinstance(colors,dict) or not isinstance(accessories,dict):raise ValidationError({'detail':'The character configuration is incomplete.'})
    clean_parts={}
    for slot,options in CONTRACT['parts'].items():
        if not isinstance(parts.get(slot),str) or parts[slot] not in options:raise ValidationError({'detail':'Choose an available '+slot+' option.'})
        clean_parts[slot]=parts[slot]
    if type(parts.get('backpack')) is not bool or type(accessories.get('glasses')) is not bool:raise ValidationError({'detail':'Choose valid accessory options.'})
    clean_parts['backpack']=parts['backpack']
    clean_colors={}
    for key in PALETTE:
        color=colors.get(key)
        if not isinstance(color,str) or not re.fullmatch(r'#[0-9a-fA-F]{6}',color):raise ValidationError({'detail':'Use six-digit hex colors.'})
        clean_colors[key]=color.lower()
    clean_accessories={'glasses':accessories['glasses']}
    for slot,options in CONTRACT['accessories'].items():
        choice=accessories.get(slot,'none')
        if not isinstance(choice,str) or choice not in options:raise ValidationError({'detail':'Choose an available '+slot+' option.'})
        clean_accessories[slot]=choice
    face=value.get('face',{'leftEye':'#6b4b36','rightEye':'#6b4b36','nose':clean_colors['skinShadow'],'marking':clean_colors['hairShade']})
    if not isinstance(face,dict):raise ValidationError({'detail':'Choose valid face details.'})
    clean_face={}
    for key in ('leftEye','rightEye','nose','marking'):
        if not isinstance(face.get(key),str) or not re.fullmatch(r'#[0-9a-fA-F]{6}',face[key]):raise ValidationError({'detail':'Use six-digit face colors.'})
        clean_face[key]=face[key].lower()
    return {'version':1,'parts':clean_parts,'colors':clean_colors,'accessories':clean_accessories,'face':clean_face}

def serialize(character):
    return {'id':character.pk,'name':character.name,'appearance':character.appearance,'revision':character.revision,'updated':character.updated.isoformat(),'scope':'account'}

@api_view(['GET','POST'])
def characters(request):
    check_rate('characters:'+request.user.pk,100,60)
    if request.method=='GET':return Response({'items':[serialize(c) for c in PlayerCharacter.objects.filter(owner=request.user).order_by('-updated')],'limit':CONTRACT['limit']})
    body=request.data
    identity=body.get('id')
    if not isinstance(identity,str) or not ID.fullmatch(identity):raise ValidationError({'detail':'Choose a valid character.'})
    operation=body.get('operation')
    if operation not in ('save','delete','select'):raise ValidationError({'detail':'Choose a character operation.'})
    with transaction.atomic():
        player=PlayerGameProfile.objects.select_for_update().get(pk=request.user.pk)
        character=PlayerCharacter.objects.select_for_update().filter(pk=identity,owner=player).first()
        if operation=='save':
            name=body.get('name')
            if not isinstance(name,str) or not 1<=len(name.strip())<=64 or any(ord(c)<32 for c in name):raise ValidationError({'detail':'Give your character a name of 1–64 characters.'})
            appearance=validate_appearance(body.get('appearance'))
            if character:
                if type(body.get('revision')) is not int or character.revision!=body['revision']:return Response({'detail':'This character changed elsewhere. Reload your library before saving.','conflict':True},status=409)
                character.name=name.strip();character.appearance=appearance;character.revision+=1;character.save()
            else:
                if PlayerCharacter.objects.filter(pk=identity).exists():raise ValidationError({'detail':'Choose a new character ID.'})
                if PlayerCharacter.objects.filter(owner=player).count()>=CONTRACT['limit']:raise ValidationError({'detail':'Your character library is full. Remove a character before creating another.'})
                character=PlayerCharacter.objects.create(id=identity,owner=player,name=name.strip(),appearance=appearance)
        elif not character:raise NotFound('This character is no longer in your library.')
        if operation=='delete':
            if player.appearance==identity:raise ValidationError({'detail':'Choose another game character before deleting the one you are wearing.'})
            character.delete();return Response({'deleted':identity})
        if operation=='select':
            from .abilities import cancel
            cancel(player);player.appearance=identity;player.save(update_fields=['appearance','updated'])
        if player.appearance==identity:
            broadcast(user_group(player.pk),{'type':'identity-changed'})
            for visit in HouseVisitor.objects.filter(player=player):
                broadcast(group(room_key(visit.house_id,visit.zone)),{'type':'player.identity','person':person(player,player)})
        return Response({'character':serialize(character)})

@api_view(['GET'])
def character_detail(request,identity):
    if not ID.fullmatch(identity):raise NotFound('Character not found.')
    check_rate('character-read:'+request.user.pk,150,60)
    character=PlayerCharacter.objects.select_related('owner').filter(pk=identity).first()
    if not character:raise NotFound('Character not found.')
    if character.owner_id!=request.user.pk:
        if character.owner.appearance!=identity or not character.owner.visible or blocked_users(request.user.pk,character.owner_id):raise PermissionDenied('This character is private.')
    return Response({'character':serialize(character)})
