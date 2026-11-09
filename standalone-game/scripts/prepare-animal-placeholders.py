"""Authorized derivative color variants of the owner's existing pet illustrations."""
from pathlib import Path
from PIL import Image
import colorsys,json
root=Path('public/pawtrail-game/discovery')
variants={'black':(.08,.16,.25),'white':(.08,.07,.91),'gray':(.10,.09,.61),'brown':(.065,.55,.54),'cream':(.11,.25,.94)}
for species in ['cat','dog']:
 source=Image.open(root/(species+'-placeholder-v1.webp')).convert('RGBA')
 for color,(h,s,v) in variants.items():
  im=source.copy(); px=im.load()
  for y in range(im.height):
   for x in range(im.width):
    r,g,b,a=px[x,y]
    hue,sat,val=colorsys.rgb_to_hsv(r/255,g/255,b/255)
    if a and .035<hue<.17 and sat>.32 and val>.40:
     nr,ng,nb=colorsys.hsv_to_rgb(h,s,max(.12,min(.98,v+(val-.72)*.22)))
     px[x,y]=(round(nr*255),round(ng*255),round(nb*255),a)
  im.save(root/(species+'-'+color+'-placeholder-v2.webp'),'WEBP',lossless=True,method=6)
(root/'placeholder-provenance.json').write_text(json.dumps({'purpose':'Illustrations for unavailable photos, never identity evidence','source':['cat-placeholder-v1.webp','dog-placeholder-v1.webp'],'variants':list(variants),'method':'Authorized color-region recoloring; facial features and alpha retained'},indent=2))
