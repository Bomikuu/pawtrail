"""Native pixel exports and original procedural WAVs for the immersion expansion."""
from pathlib import Path
import json, math, random, struct, wave
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/immersion-v1'
OUTPUT = ROOT / 'public/assets/game'
packs = json.loads((SOURCE / 'generation-prompts.json').read_text())['packs']
colors = json.loads((ROOT / 'public/pawtrail-game/game-assets/animation-manifest.json').read_text())['palette']
palette = Image.new('P', (1, 1))
rgb = [tuple(bytes.fromhex(color.lstrip('#'))) for color in colors]
palette.putpalette([channel for color in (rgb + [rgb[0]]*(256-len(rgb))) for channel in color])
manifest = dict(version=1, generationMode='built-in image_gen', palette=colors,
    source='assets/immersion-v1/generation-prompts.json', assets=[], audio=[],
    limitations=['Native dimensions/alpha are authored by this exporter; playback and performance are not certified.'])

def destination(pack, name):
    if pack == 'portraits': return f'missions/portraits/{name}.png'
    if pack == 'missions': return f'missions/board/{name}.png'
    if pack == 'inventory': return f'inventory/items/{name}.png'
    if pack == 'soundboard': return f'soundboard/animations/{name}.png'
    if pack == 'weather':
        group = 'clouds' if name.startswith('cloud') else 'rain' if name.startswith(('rain','splash')) else 'puddles' if name.startswith(('puddle','ripple')) else 'effects'
        return f'weather/{group}/{name}.png'
    return f'environment/{"night" if pack == "night" else "interactive"}/{name}.png'

def export_cell(source, rect, size, fit=None):
    cell = source.crop(rect)
    bounds = cell.getchannel('A').getbbox()
    if not bounds: return Image.new('RGBA', (size, size))
    cell = cell.crop(bounds)
    scale = min((size-4)/cell.width, (size-4)/cell.height) if fit is None else fit
    cell = cell.resize((max(1,round(cell.width*scale)),max(1,round(cell.height*scale))),Image.Resampling.NEAREST)
    alpha = cell.getchannel('A')
    cell = cell.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA')
    cell.putalpha(alpha)
    result = Image.new('RGBA',(size,size));result.alpha_composite(cell,((size-cell.width)//2,(size-cell.height)//2))
    return result

for pack in packs:
    key,cols,rows,size = pack['key'],pack['cols'],pack['rows'],pack['size']
    source = Image.open(SOURCE/(key+'-source.png')).convert('RGBA')
    source.putalpha(source.getchannel('A').point(lambda value:255 if value>=128 else 0))
    for index,name in enumerate(pack['items']):
        frames = 4 if key == 'soundboard' else 1
        image = Image.new('RGBA',(size*frames,size));rects=[]
        for frame in range(frames):
            column,row = (frame,index) if frames==4 else (index%cols,index//cols)
            rect=[round(column*source.width/cols),round(row*source.height/rows),round((column+1)*source.width/cols),round((row+1)*source.height/rows)]
            cell = export_cell(source,rect,size);image.alpha_composite(cell,(frame*size,0));rects.append(rect)
        relative=destination(key,name);file=OUTPUT/relative;file.parent.mkdir(parents=True,exist_ok=True);image.save(file,optimize=True)
        manifest['assets'].append(dict(id=key+':'+name,file='/assets/game/'+relative,frameWidth=size,frameHeight=size,frames=frames,source=f'assets/immersion-v1/{key}-source.png',sourceRects=rects))
        if key=='soundboard':
            face=OUTPUT/f'soundboard/emotes/{name}.png';face.parent.mkdir(parents=True,exist_ok=True);image.crop((0,0,size,size)).save(face,optimize=True)
        if key=='inventory' and name in ['slot','selected-slot','backpack','pickup-sparkle']:
            copy=OUTPUT/f'inventory/ui/{name}.png';copy.parent.mkdir(parents=True,exist_ok=True);image.save(copy,optimize=True)

random.seed(7719)
rate=22050
def wav(relative,samples):
    file=OUTPUT/relative;file.parent.mkdir(parents=True,exist_ok=True)
    with wave.open(str(file),'wb') as out:
        out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate)
        out.writeframes(b''.join(struct.pack('<h',round(max(-1,min(1,v))*26000)) for v in samples))
    manifest['audio'].append(dict(file='/assets/game/'+relative,sampleRate=rate,channels=1,seconds=len(samples)/rate,rights='Original procedural synthesis for PawTrail; no third-party recordings.'))
names=packs[3]['items']
for index,name in enumerate(names):
    length=.48+index%3*.12;phase=0;samples=[]
    for i in range(int(rate*length)):
        t=i/rate;u=t/length;frequency=(220+index*23)*(1+.5*math.sin(math.pi*u)-.2*u)
        phase+=2*math.pi*frequency/rate
        envelope=math.sin(math.pi*u)**1.2
        formants=sum(math.sin(phase*h)*math.exp(-((h*frequency-(1050-400*u))/700)**2)/h for h in range(1,9))
        value=formants*envelope*.7
        if name=='angry':value=(random.random()*2-1)*envelope*.34
        if name in ['relaxed','loving']:value=(math.sin(phase*.15)*.5+math.sin(phase)*.12)*envelope*(.6+.4*math.sin(t*2*math.pi*26))
        if name in ['laughing','excited']:value*=.4+.6*abs(math.sin(t*math.pi*8))
        samples.append(value)
    wav(f'soundboard/audio/{name}.wav',samples)
rain=[];prior=0
for i in range(rate*4):
    prior=prior*.35+(random.random()*2-1)*.25;rain.append(prior)
wav('audio/weather/rain-loop.wav',rain)
for name,folder,freq in [('pickup','inventory',880),('board','missions',230),('rustle','inventory',135)]:
    samples=[]
    for i in range(int(rate*.25)):
        t=i/rate;env=math.exp(-t*18)
        samples.append((math.sin(2*math.pi*(freq+900*t)*t)*.3+(random.random()*2-1)*(.22 if name!='pickup' else .02))*env)
    wav(f'audio/{folder}/{name}.wav',samples)
(OUTPUT/'immersion-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Prepared immersion native art and original audio:',len(manifest['assets']),'sprite definitions,',len(manifest['audio']),'WAV files')
