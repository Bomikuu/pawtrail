"""Shared native portrait compositing; preserve authored RGB context and anchors."""
from PIL import Image, ImageChops, ImageFilter, ImageDraw

def shift(box,offset):
    return [box[0]+offset[0],box[1]+offset[1],box[2]+offset[0],box[3]+offset[1]]

def indexed(art,palette):
    # Inputs are already authored in this palette. Preserve every opaque pixel.
    lookup={tuple(int(c[p:p+2],16) for p in (1,3,5)):i+1 for i,c in enumerate(palette)}
    raw=art.tobytes();pixels=bytearray(art.width*art.height)
    for p in range(len(pixels)):
        r,g,b,a=raw[p*4:p*4+4]
        if a:
            color=(r,g,b)
            if color not in lookup:raise ValueError(f'Unapproved color {color}; do not silently recolor reference art.')
            pixels[p]=lookup[color]
    image=Image.frombytes('P',art.size,bytes(pixels))
    colors=[0,0,0]+[int(c[p:p+2],16) for c in palette for p in (1,3,5)]
    image.putpalette(colors+[0]*(768-len(colors)));image.info['transparency']=0
    return image

def bounds_mask(image,box,kind,lip_colors,eye_inset=3):
    """An island follows authored ink, rather than filling a guessed rectangle."""
    mask=Image.new('L',image.size);px=image.load();m=mask.load();lip=set(lip_colors)
    x1,y1,x2,y2=box
    for y in range(max(0,y1),min(image.height,y2)):
        for x in range(max(0,x1),min(image.width,x2)):
            r,g,b,a=px[x,y]
            if not a:continue
            dark=r<130 and g<115
            white=r>145 and g>140 and max(r,g,b)-min(r,g,b)<65
            pink=f'#{r:02x}{g:02x}{b:02x}' in lip
            if kind=='eye':
                # Keep eyebrow/bang pixels outside the moving eyelid island.
                inside=y>=y1+eye_inset and x>=x1+1 and x<x2-1
                if inside and (dark or white):m[x,y]=255
            elif pink or dark or white:
                m[x,y]=255
    if kind=='mouth':
        # Reject disconnected chin/hair components; include adjacent lip pieces.
        candidates={(x,y) for y in range(max(0,y1),min(image.height,y2)) for x in range(max(0,x1),min(image.width,x2)) if m[x,y]}
        groups=[]
        while candidates:
            start=candidates.pop();group={start};stack=[start]
            while stack:
                x,y=stack.pop()
                for dx,dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)):
                    q=(x+dx,y+dy)
                    if q in candidates:candidates.remove(q);group.add(q);stack.append(q)
            if any('#%02x%02x%02x'%px[q][:3] in lip for q in group):groups.append(group)
        mask=Image.new('L',image.size)
        if groups:
            cx=(x1+x2)/2;cy=y1+(y2-y1)*.48
            selected=min(groups,key=lambda group:min((x-cx)**2+(y-cy)**2 for x,y in group))
            for x,y in selected:mask.putpixel((x,y),255)
    return mask.filter(ImageFilter.MaxFilter(3))

def registered(source,source_box,target_box,size):
    # Translation only: never stretch an eye, nose or mouth to fit a crop.
    dx=target_box[0]-source_box[0];dy=target_box[1]-source_box[1]
    frame=Image.new('RGBA',size);frame.alpha_composite(source,(dx,dy))
    return frame

def contextual_patch(base,source,source_box,target_box,kind,colors,preserve_corners=False,allow_silhouette=False,eye_inset=3):
    aligned=registered(source,source_box,target_box,base.size)
    old=bounds_mask(base,target_box,kind,colors,eye_inset)
    new=bounds_mask(aligned,target_box,kind,colors,eye_inset)
    mask=ImageChops.lighter(old,new)
    clip=Image.new('L',base.size)
    x1,y1,x2,y2=target_box
    if kind=='eye':y1+=eye_inset
    ImageDraw.Draw(clip).rectangle((x1,y1,x2-1,y2-1),fill=255)
    mask=ImageChops.multiply(mask,clip)
    if not allow_silhouette:mask=ImageChops.multiply(mask,base.getchannel('A'))
    mask=ImageChops.multiply(mask,aligned.getchannel('A'))
    if preserve_corners:
        box=old.getbbox()
        if box:
            # Keep the selected expression's lip corners, especially sad/angry.
            d=ImageDraw.Draw(mask);middle=(box[1]+box[3]-1)//2
            d.point((box[0],middle),fill=0);d.point((box[2]-1,middle),fill=0)
    result=base.copy();result.paste(aligned,(0,0),mask)
    return result,mask

def delta(base,frame):
    mask=ImageChops.difference(base,frame).convert('RGB').convert('L').point(lambda n:255 if n else 0)
    result=frame.copy();result.putalpha(ImageChops.multiply(mask,frame.getchannel('A')))
    return result

def half_blink(base,closed,box,mask):
    result=base.copy();m=mask.getbbox()
    if not m:return result
    # Native shutter: retain the lower iris. Skin/lashes come from authored art.
    x1,y1,x2,y2=m;cut=y1+max(1,(y2-y1)//2)
    for y in range(y1,cut):
        for x in range(x1,x2):
            if mask.getpixel((x,y)):
                sy=min(y2-1,y+max(1,(y2-y1)//4))
                result.putpixel((x,y),closed.getpixel((x,sy)))
    return result

