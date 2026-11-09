"""Export immutable authored expression bases and contextual native motion islands.

Usage: python3 scripts/prepare-portrait-collection.py SOURCE_JSON
Reference art remains pixel-exact. No face/eyelid shapes are redrawn here.
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageDraw, ImageFont
import json,sys,math

ROOT=Path.cwd()
CONFIG=Path(sys.argv[1]).resolve()
OUT=CONFIG.parent
DATA=json.loads(CONFIG.read_text())
EMOTIONS=['neutral','smile','happy','sad','angry','surprised']

def rgba(path):
    return Image.open(ROOT/path).convert('RGBA')

from portrait_image_layers import indexed, contextual_patch, delta, half_blink, shift

reports=[]
for style in DATA['styles']:
    w,h=style['nativeCell'];directory=OUT/'runtime'/style['id'];refs=directory/'reference';refs.mkdir(parents=True,exist_ok=True)
    tiles=[];names={};poses={};reference_bytes=0;contact=Image.new('RGB',(w*4*3,h*6*3+6*24),'#cdd0c2');draw=ImageDraw.Draw(contact)
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
    def add(name,art):
        names[name]=len(tiles);tiles.append(art);return len(tiles)-1
    for p,pose in enumerate(style['poses']):
        pose_id=pose['id'];states={};closed_source=rgba(pose['closed']);half_source=rgba(pose['half']);speech=[rgba(path) for path in pose['speech']]
        source_eyes=pose.get('sourceEyes',[shift(box,pose.get('eyeSourceShift',[0,0])) for box in pose['eyes']]);source_mouth=pose.get('sourceMouth',shift(pose['mouth'],pose.get('mouthSourceShift',[0,0])))
        closed_eyes=pose.get('closedSourceEyes',source_eyes)
        for e,emotion in enumerate(EMOTIONS):
            base=rgba(pose['reference'][emotion])
            if base.size!=(w,h):raise ValueError('Reference dimensions must match the native manifest.')
            filename=f'{pose_id}-{emotion}.png';file=refs/filename;indexed(base,style['palette']).save(file,optimize=True);reference_bytes+=file.stat().st_size
            base_id=add(f'{pose_id}/{emotion}/base',base)
            overrides=pose.get('featureByEmotion',{}).get(emotion,{})
            target_eyes=overrides.get('eyes',pose['eyes'] if emotion=='neutral' else source_eyes)
            target_mouth=overrides.get('mouth',pose['mouth'] if emotion=='neutral' else source_mouth)
            closed=base.copy();half=base.copy()
            if emotion!='happy':
                emotion_closed_eyes=overrides.get('closedSourceEyes',closed_eyes)
                emotion_half_eyes=overrides.get('halfSourceEyes',emotion_closed_eyes)
                for eye_index,(source_box,target_box) in enumerate(zip(emotion_closed_eyes,target_eyes)):
                    changed,mask=contextual_patch(base,closed_source,source_box,target_box,'eye',style['lipColors'])
                    if overrides.get('useAuthoredHalf'):
                        half_eye,half_mask=contextual_patch(base,half_source,emotion_half_eyes[eye_index],target_box,'eye',style['lipColors'])
                    else:
                        half_eye=half_blink(base,changed,target_box,mask);half_mask=mask
                    closed.paste(changed,(0,0),mask);half.paste(half_eye,(0,0),half_mask)
            blink=[add(f'{pose_id}/{emotion}/half',delta(base,half)),add(f'{pose_id}/{emotion}/closed',delta(base,closed))]
            talk=[add(f'{pose_id}/{emotion}/rest-mouth',Image.new('RGBA',(w,h)))]
            for n,source in enumerate(speech):
                speech_box=overrides.get('speechSourceBoxes',[source_mouth]*len(speech))[n]
                changed,_=contextual_patch(base,source,speech_box,target_mouth,'mouth',style['lipColors'],emotion in ['sad','angry','happy'],overrides.get('mouthCanExtend',False))
                talk.append(add(f'{pose_id}/{emotion}/speech-{n}',delta(base,changed)))
            states[emotion]={'base':base_id,'blink':blink,'talk':talk,'reference':f'reference/{filename}'}
            y=e*(h*3+24);art=base.resize((w*3,h*3),Image.Resampling.NEAREST);contact.paste(art,(p*w*3,y+24),art)
            if p==0:draw.text((6,y+3),emotion,font=font,fill='#202020')
        poses[pose_id]={'expressions':states}
    cols=8;rows=math.ceil(len(tiles)/cols);atlas=Image.new('RGBA',(cols*w,rows*h));frames=[]
    for n,tile in enumerate(tiles):
        x=n%cols*w;y=n//cols*h;atlas.alpha_composite(tile,(x,y));frames.append([x,y,w,h])
    indexed(atlas,style['palette']).save(directory/'portrait.png',optimize=True)
    visible=Image.new('L',(w,h))
    for tile in tiles:visible=ImageChops.lighter(visible,tile.getchannel('A'))
    bx1,by1,bx2,by2=visible.getbbox();bx1=max(0,bx1-1);by1=max(0,by1-1);bx2=min(w,bx2+1);by2=min(h,by2+1)
    display_bounds=[bx1,by1,bx2-bx1,by2-by1]
    manifest={'version':2,'kind':'authored-expression-portrait','style':style['name'],'nativeCell':[w,h],'contentBounds':display_bounds,'atlas':'portrait.png','frames':frames,'poses':poses,'frameNames':names,'filter':'nearest','blink':{'sequence':[0,1,0],'durationsMs':[85,105,85],'idleDelayMs':[2800,4600]},'talk':{'sequence':[0,1,2,1,0,1,2,0],'durationsMs':[120,130,120,100,180,120,130,220]},'breathing':{'periodMs':4800,'risePixels':1,'torsoStartY':round(h*.78),'anchorRows':4},'sourceFidelity':'Every resting expression base equals its authored reference PNG; contextual source pixels supply motion islands. No eye/mouth redraw or happy-mouth substitution.','budgetPerEntryBytes':250000}
    (directory/'portrait.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
    runtime_bytes=sum((directory/name).stat().st_size for name in ['portrait.png','portrait.json']);complete=runtime_bytes+reference_bytes
    if complete>=250000:raise ValueError(f'{style["id"]}: {complete} exceeds complete-entry budget.')
    contact.save(OUT/f'{style["id"]}-expressions.png',optimize=True)
    reports.append({'id':style['id'],'name':style['name'],'nativeCell':[w,h],'contentBounds':display_bounds,'runtimeBytes':runtime_bytes,'referenceBytes':reference_bytes,'completeBytes':complete,'poseCount':4,'expressionCount':6})
(OUT/'sizes.json').write_text(json.dumps({'budgetPerEntryBytes':250000,'entries':reports,'allEntriesBytes':sum(row['completeBytes'] for row in reports)},indent=2)+'\n')
print(json.dumps(reports,indent=2))
