"""Measure and split the original couch painting into source-preserving 3D parts."""
from pathlib import Path
from PIL import Image, ImageDraw
import base64, hashlib, json
root = Path(__file__).resolve().parents[1]
path = root / 'public/assets/game/housing/furniture/sofa-housing-v1.png'
im = Image.open(path).convert('RGBA')
w, h = im.size
palette = ['#00000000']
indices = []
for pixel in im.get_flattened_data():
    value = '#%02x%02x%02x%02x' % pixel if pixel[3] else '#00000000'
    if value not in palette: palette.append(value)
    indices.append(palette.index(value))
# Pillow outlines are measured in source pixels, including their tilted corners.
polygons = {
 'pillowLeft': [(11,29),(15,27),(20,28),(22,27),(25,29),(26,32),(26,36),(24,39),(22,41),(15,42),(12,39),(11,35),(9,32)],
 'pillowRight': [(39,27),(43,28),(48,29),(51,29),(53,31),(52,34),(51,37),(51,41),(48,42),(42,40),(39,39),(37,36),(37,32)],
}
masks = {}
for key, polygon in polygons.items():
    mask = Image.new('1',(w,h));ImageDraw.Draw(mask).polygon(polygon,fill=1)
    masks[key] = mask
names = ['backLeft','backRight','seatLeft','seatRight','leftArm','rightArm','apron','feet','pillowLeft','pillowRight']
visible = {name: [0]*(w*h) for name in names}
for y in range(h):
    for x in range(w):
        index=y*w+x
        if not indices[index]: continue
        if masks['pillowLeft'].getpixel((x,y)): name='pillowLeft'
        elif masks['pillowRight'].getpixel((x,y)): name='pillowRight'
        elif y >= 55: name='feet'
        elif y>=27 and x<13: name='leftArm'
        elif y>=27 and x>=51: name='rightArm'
        elif y>=51: name='apron'
        elif y>=38: name='seatLeft' if x<32 else 'seatRight'
        else: name='backLeft' if x<32 else 'backRight'
        visible[name][index]=indices[index]
# Continue unseen upholstery behind the pillows/arms; retain every visible source pixel.
for key, start, end in [('backLeft',8,32),('backRight',32,56)]:
    original = visible[key][:]
    candidates=[(i%w,i//w,v) for i,v in enumerate(original) if v and (lambda c:c[1]>=c[0] and c[2]<c[1]*.85)(im.getpixel((i%w,i//w)))]
    for x in range(start,end):
        ys=[y for y in range(13,27) if original[y*w+x]]
        if not ys: continue
        for y in range(min(ys),39):
            i=y*w+x
            if indices[i] and not visible[key][i]:
                _,_,value=min(candidates,key=lambda p:(p[0]-x)**2+(p[1]-y)**2)
                visible[key][i]=value
source = {
 'source':'/assets/game/housing/furniture/sofa-housing-v1.png',
 'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
 'width':w,'height':h,'anchor':[32,55],'palette':palette,
 'materials':{'fabric':['#b1b771','#9da05c','#898a4a','#c6cd8a','#77763e','#504d2a','#656238']},
 'layers':{name:base64.b64encode(bytes(data)).decode() for name,data in {'source':indices,**visible}.items()},
 'landmarks':{'opaqueBounds':[3,13,58,47],'back':[8,13,48,26],'seat':[13,38,38,13],'arms':[[3,27,10,28],[51,27,10,28]],'pillows':polygons,'skirt':[12,51,40,4],'feet':[[8,55,5,5],[51,55,5,5]]},
 'normalizedLandmarks':{'backTop':13/64,'seatTop':38/64,'seatFront':48/64,'skirtTop':51/64,'floor':60/64},
 'render':{'projection':'orthographic','nativeFrame':[96,112],'nativeAnchor':[48,96],'cameraPosition':[0,34.5,90],'cameraTarget':[0,0,0],'frustum':[-48,48,96,-16,.1,300],'origin':'center floor pivot at source (32,55)','outputColorSpace':'srgb','toneMapping':'none','filter':'nearest','antialias':False,'referenceFacing':0,'referencePhase':0},
 'representation':'Separate closed curved source-painted cushions, angled pillows, rolled arms, seat, skirt and feet. Hidden upholstery is an authored continuation of visible fabric.',
}
(root/'src/game/furniture/references/couch.json').write_text(json.dumps(source,indent=2)+'\n')
print('Prepared couch source layers, measured outlines and camera settings.')
