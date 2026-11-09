"""Author fixed-grid UV skins from PawTrail's existing native design language.
These are dedicated painted surfaces, never resized/cropped animation frames.
Regenerate asset exports with: python3 scripts/author-actor-uv-skins.py
"""
from PIL import Image, ImageDraw
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/pawtrail-game/game-assets/actor-uv-v2';OUT.mkdir(parents=True,exist_ok=True)
PARTS=['head','blink','halfBlink','torso','arm','leg','hair','foot','tail','ear','bag','hat']
FACES=['right','left','top','bottom','front','back']
PLAYERS={
 'rescuer':dict(hair='#654032',skin='#e3a66c',outfit='#8e5641',shirt='#4f7475',pants='#d79750',shoes='#654032',style='shorts'),
 'jacket-rescuer':dict(hair='#362b26',skin='#b77c54',outfit='#3c5553',shirt='#e4d7bc',pants='#514439',shoes='#4b332b',style='jacket'),
 'braided-rescuer':dict(hair='#674731',skin='#dda46b',outfit='#c18a47',shirt='#dfb86c',pants='#646343',shoes='#6b4935',hat='#eadabe',style='hat'),
 'glasses-rescuer':dict(hair='#624035',skin='#dfaa7f',outfit='#73804c',shirt='#eddfc4',pants='#a36a47',shoes='#674134',style='glasses'),
 'blonde-rescuer':dict(hair='#d6b16c',skin='#e5b083',outfit='#73804c',shirt='#eddfc4',pants='#a36a47',shoes='#674134',style='glasses'),
 'violet-rescuer':dict(hair='#9469af',skin='#dfaa7f',outfit='#73804c',shirt='#eddfc4',pants='#a36a47',shoes='#674134',style='glasses'),
 'red-rescuer':dict(hair='#ad5c3b',skin='#dfaa7f',outfit='#73804c',shirt='#eddfc4',pants='#a36a47',shoes='#674134',style='glasses'),
 'male-blonde-scout':dict(hair='#d7af68',skin='#dfad81',outfit='#638c9b',shirt='#eddfc4',pants='#ac8b63',shoes='#624535',style='jacket'),
 'male-violet-volunteer':dict(hair='#67467f',skin='#b57958',outfit='#cb9b4c',shirt='#d6aa61',pants='#38465a',shoes='#e1d2b5',style='hoodie'),
 'male-red-gardener':dict(hair='#a45136',skin='#de9e75',outfit='#617044',shirt='#a96346',pants='#617044',shoes='#dbb788',style='overalls'),
}
CATS={
 'orange-tabby':dict(coat='#dc9345',mark='#9d5c30',cream='#f5dfbb',eye='#63452f',pattern='tabby'),
 'black-cat':dict(coat='#3b3332',mark='#211d21',cream='#52423b',eye='#b39b55',pattern='solid'),
 'white-cat':dict(coat='#f2e6cf',mark='#d1bfa7',cream='#fff1da',eye='#756f65',pattern='solid'),
 'gray-tabby':dict(coat='#88817c',mark='#555254',cream='#e4d5bd',eye='#6d6251',pattern='tabby'),
 'calico':dict(coat='#eee0c6',mark='#4b3830',cream='#fff0d5',eye='#62523b',patch='#cd843f',pattern='calico'),
 'tuxedo':dict(coat='#383438',mark='#26232b',cream='#f2e4cc',eye='#ad9c69',pattern='tuxedo'),
 'siamese':dict(coat='#d9c7a4',mark='#6a5346',cream='#eee0c2',eye='#748b97',pattern='points'),
 'brown-tabby':dict(coat='#a67546',mark='#68462f',cream='#ecd6b5',eye='#75613e',pattern='tabby'),
 'cream-cat':dict(coat='#e8c89c',mark='#bd946a',cream='#f6e5c8',eye='#8e7052',pattern='tabby'),
 'gray-white':dict(coat='#8f8782',mark='#665d5a',cream='#f6e6cd',eye='#6b7773',pattern='bicolor'),
}
ROLE={'hair':1,'outfit':2,'coat':3}
def shade(hex,amount):
 rgb=tuple(int(hex[i:i+2],16) for i in (1,3,5));return '#'+''.join(f'{max(0,min(255,round(c*amount))):02x}' for c in rgb)
def make(identity,c,kind):
 atlas=Image.new('RGBA',(256,128),(0,0,0,0));mask=Image.new('RGB',atlas.size,(0,0,0));swatches={}
 for part_index,part in enumerate(PARTS):
  for face_index,face in enumerate(FACES):
   tile=Image.new('RGBA',(16,16));m=Image.new('RGB',(16,16));d=ImageDraw.Draw(tile);md=ImageDraw.Draw(m)
   def color(role,level=1):return shade(c.get(role,role),level) if role in c else role
   def rect(box,role,level=1):
    fill=color(role,level);d.rectangle(box,fill=fill);md.rectangle(box,fill=(ROLE.get(role,0),)*3)
   def line(points,role,level=1,width=1):
    d.line(points,fill=color(role,level),width=width);md.line(points,fill=(ROLE.get(role,0),)*3,width=width)
   def dot(x,y,role,level=1):rect((x,y,x,y),role,level)
   ink='#432e29';soft='#bd8660';isfront=face=='front';isside=face in ('right','left')
   base=('skin' if kind=='player' else 'coat')
   rect((0,0,15,15),base)
   if part in ('head','blink','halfBlink'):
    closed=part=='blink';half=part=='halfBlink'
    if kind=='cat':
     pattern=c['pattern']
     if pattern=='points':rect((1,3,14,14),'mark')
     if pattern in ('bicolor','tuxedo'):
      if isfront:
       rect((5,7,10,15),'cream');rect((7,4,8,8),'cream')
      elif isside:rect((0 if face=='right' else 10,11,5 if face=='right' else 15,15),'cream')
     if pattern=='calico':
      if isfront:rect((0,0,6,8),'patch');rect((10,0,15,7),'mark')
      elif face=='right':rect((1,1,10,10),'patch')
      elif face=='left':rect((5,0,15,10),'mark')
      elif face=='top':rect((0,0,6,12),'patch');rect((10,2,15,13),'mark')
     if pattern=='tabby':
      if isfront:
       line([(4,1),(5,4),(7,2),(8,5),(10,2),(11,4)],'mark');line([(0,6),(2,7)],'mark');line([(13,7),(15,6)],'mark')
      elif face=='top':
       for x in (3,7,11):line([(x,1),(x+1,5),(x,9)],'mark')
      elif isside:
       for y in (2,5):line([(3,y),(6,y+1),(9,y)],'mark')
    if isfront:
     if kind=='player':
      # Clear facial features belong to skin, not to a painted hair silhouette.
      for x in (4,10):
       line([(x,5),(x+2,5)],'hair',.8)
       if closed:line([(x,8),(x+2,8)],ink)
       else:
        rect((x,7 if not half else 8,x+2,9),ink)
        if not half:dot(x,7,'#f7e6ca')
      rect((2,10,3,10),'#d69777');rect((12,10,13,10),'#d69777');dot(8,10,'skin',.82)
      line([(6,12),(7,13),(9,13),(10,12)],'#925a45')
      if c.get('style')=='glasses' or identity=='male-violet-volunteer':
       for x in (2,9):
        line([(x+1,5),(x+4,5),(x+5,6),(x+5,9),(x+4,10),(x+1,10),(x,9),(x,6),(x+1,5)],ink)
       line([(7,7),(8,7)],ink)
     else:
      for x in (3,10):
       if closed:line([(x,8),(x+2,8)],'eye')
       else:
        rect((x,7 if not half else 8,x+2,9),'eye');dot(x+1,8,ink)
        if not half:dot(x,7,'cream')
      rect((4,10,11,13),'cream');rect((7,10,8,11),'#b57d69');line([(7,12),(6,13)],ink);line([(8,12),(9,13)],ink)
      for y in (11,13):line([(0,y),(3,y)],'mark',.9);line([(12,y),(15,y)],'mark',.9)
    elif isside:
     # Features on profile faces sit toward the front, with continuous coat/skin edges.
     x=3 if face=='right' else 11
     if closed:line([(x-1,8),(x+1,8)],ink)
     else:rect((x,7 if not half else 8,x+1,9),ink)
     if kind=='player':rect((8,8,10,10),'skin',.84)
     if kind=='cat':line([(x-2,12),(x+2,12)],'cream')
   elif part=='hair':
    rect((0,0,15,15),'hair' if kind=='player' else 'coat')
    role='hair' if kind=='player' else 'coat'
    for x in (2,6,11):line([(x,1),(x-1,5),(x,9),(x-1,14)],role,.84)
    line([(5,2),(9,2),(11,4)],role,1.16);line([(4,3),(7,3)],role,1.1)
   elif part=='torso':
    if kind=='player':
     rect((0,0,15,15),'outfit');rect((1,13,14,15),'outfit',.8)
     if isfront:
      style=c['style']
      if style=='overalls':
       rect((0,0,15,5),'shirt');rect((3,1,4,8),'outfit');rect((11,1,12,8),'outfit');rect((4,5,11,14),'outfit');rect((6,7,9,10),'outfit',.84)
      elif style=='hoodie':
       line([(5,1),(5,5)],'shirt',1.15);line([(10,1),(10,5)],'shirt',1.15);rect((4,9,11,12),'outfit',.86);dot(7,7,'shirt',1.16);dot(9,7,'shirt',1.16)
      else:
       rect((5,0,10,14),'shirt');line([(4,2),(3,7),(4,12)],'outfit',1.18);line([(11,2),(12,7),(11,12)],'outfit',.8);rect((1,8,3,10),'outfit',.82);rect((12,8,14,10),'outfit',.82)
      rect((5,0,10,1),'skin')
     elif face=='back':line([(2,4),(2,13)],'outfit',.85);line([(13,4),(13,13)],'outfit',.85)
    else:
     rect((0,0,15,15),'coat')
     pattern=c['pattern']
     if pattern=='tabby':
      if face=='top':
       line([(7,0),(7,15)],'mark');line([(8,0),(8,15)],'mark')
      for x in (3,8,13):line([(x,0),(x-1,4),(x,7)],'mark',.95)
     if pattern=='calico':rect((0,0,6,8),'patch');rect((10,4,15,13),'mark')
     if pattern in ('bicolor','tuxedo') and face in ('front','bottom'):rect((2,2,13,15),'cream')
     if pattern=='points' and face in ('front','back'):rect((3,7,12,15),'coat',.87)
   elif part=='arm':
    if kind=='player':rect((0,0,15,7),'shirt' if c['style']=='overalls' else 'outfit');rect((0,7,15,8),'outfit',.8);rect((0,9,15,15),'skin');line([(3,14),(12,14)],'skin',.85)
    else:rect((0,0,15,15),'coat')
   elif part=='leg':
    if kind=='player':
     rect((0,0,15,15),'pants');rect((0,13,15,15),'pants',.8)
     if c['style']=='shorts' or c['style']=='glasses':rect((0,8,15,15),'skin');rect((0,6,15,7),'pants',.8)
     else:line([(4,2),(4,13)],'pants',.84)
    else:rect((0,0,15,15),'mark' if c['pattern']=='points' else 'coat');rect((0,12,15,15),'cream' if c['pattern'] in ('bicolor','tuxedo','calico','tabby') else 'coat')
   elif part=='foot':
    role='shoes' if kind=='player' else ('mark' if c['pattern']=='points' else 'cream' if c['pattern'] in ('calico','tabby','bicolor','tuxedo') else 'coat')
    rect((0,0,15,15),role);rect((0,13,15,15),role,.78);line([(5,3),(10,3)],role,1.15)
   elif part=='tail':
    rect((0,0,15,15),'coat' if kind=='cat' else 'hair')
    if kind=='cat' and c['pattern'] in ('tabby','points','calico'):
     for y in (3,8,13):rect((0,y,15,y+1),'mark')
   elif part=='ear':
    rect((0,0,15,15),'coat' if kind=='cat' else 'skin')
    if kind=='cat' and face=='front':d.polygon([(4,12),(8,3),(12,12)],fill='#c28d80');md.polygon([(4,12),(8,3),(12,12)],fill=(0,0,0))
   elif part=='bag':
    role='shirt' if kind=='player' and identity=='rescuer' else 'outfit' if kind=='player' else 'coat'
    rect((0,0,15,15),role,.83);rect((2,2,13,6),role);rect((4,9,11,13),role,.74);line([(4,9),(11,9)],'#b99b67')
   elif part=='hat':
    rect((0,0,15,15),'hat' if kind=='player' and 'hat' in c else 'hair' if kind=='player' else 'coat');rect((0,11,15,13),'#8e6547')
   index=part_index*6+face_index;x=index%16*16;y=index//16*16;atlas.paste(tile,(x,y));mask.paste(m,(x,y))
 atlas.save(OUT/(identity+'.png'),optimize=True);mask.save(OUT/(identity+'-roles.png'),optimize=True)
 return {'file':identity+'.png','mask':identity+'-roles.png','kind':kind,'palette':c,'reference':('/pawtrail-game/game-assets/rescuer.png' if identity=='rescuer' else '/assets/game/characters/animations/'+identity+'/complete-v2.png') if kind=='player' else '/assets/game/animals/cats/housing-v2/'+identity+'/'+identity+'-housing-v2.png'}
entries={}
for key,value in PLAYERS.items():entries[key]=make(key,value,'player')
for key,value in CATS.items():entries[key]=make(key,value,'cat')
manifest={'version':2,'width':256,'height':128,'tile':16,'parts':{p:i*6 for i,p in enumerate(PARTS)},'faces':FACES,'aliases':{'orange_tabby':'orange-tabby','black_cat':'black-cat','white_cat':'white-cat','gray-cat':'gray-tabby'},'roles':ROLE,'entries':entries,'authoring':'Dedicated painted UV surfaces; no sprite-frame crops. Original PawTrail native character/coat designs are the references.'}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(ROOT/'src/game/models3d/uv-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Authored 10 character and 10 cat UV atlases, role masks and manifest.')
