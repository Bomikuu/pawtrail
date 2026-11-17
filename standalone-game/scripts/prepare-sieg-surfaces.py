"""Fit Sieg's generated artwork to his model UVs; retain the source sheets."""
from PIL import Image, ImageDraw
from pathlib import Path
import json, random

root=Path(__file__).resolve().parents[1]
job=root/'assets/actor-appearances/sieg-stormwarden-v1'
out=root/'public/pawtrail-game/actor-studio/sieg/v1';out.mkdir(parents=True,exist_ok=True)
for name,state in [('face','rest'),('half','half'),('closed','closed')]:
    src=Image.open(job/f'native/front-pout-neutral-{state}.png').convert('RGBA')
    face=src.crop((33,47,64,76)).resize((64,88),Image.Resampling.NEAREST)
    image=Image.new('RGBA',(64,96),'#f0c5a2');image.alpha_composite(face,(0,4))
    # This is a fitted painted face, never a protruding geometric nose.
    image.save(out/f'{name}.png',optimize=True)
palettes={
 'hair':['#302d37','#191e2b','#53505b','#74646b'],
 'copper':['#ad5837','#6c372d','#d48956','#e5b175'],
 'shirt':['#ece1c7','#a99a85','#fff1d4','#d0c1a8'],
 'cape':['#253144','#171f30','#465166','#36455a'],
 'lining':['#376c70','#23494f','#72a3a0','#4a8583'],
 'trousers':['#35323b','#211f2c','#514953','#423c48'],
 'boots':['#352b2c','#211f2c','#64504b','#9a7852'],
 'blade':['#d3d3c1','#7f8189','#f6ebcb','#a3a2a6'],
}
for surface,colors in palettes.items():
    image=Image.new('RGBA',(64,96),colors[0]);d=ImageDraw.Draw(image)
    # Deliberate low-density seam/strand clusters, deterministic export.
    rng=random.Random('sieg-'+surface)
    for x in range(0,64,8):
        d.rectangle((x,0,x+1,95),fill=colors[1])
        d.rectangle((x+2,8+rng.randrange(9),x+3,61+rng.randrange(22)),fill=colors[2])
    for i in range(28):
        x,y=rng.randrange(2,60),rng.randrange(4,89)
        d.rectangle((x,y,x+rng.choice([1,2,3]),y+1),fill=colors[3])
    if surface in ['cape','lining']:
        d.rectangle((0,88,63,91),fill='#b99055' if surface=='cape' else '#72a3a0')
        for x in range(5,64,12):d.line([(x,79),(x+4,74),(x+6,81),(x+2,85)],fill='#4a8583',width=2)
    if surface=='blade':
        d.rectangle((0,0,4,95),fill=colors[2]);d.rectangle((57,0,63,95),fill=colors[1])
        d.rectangle((29,8,33,25),fill='#376c70')
    image.save(out/f'{surface}.png',optimize=True)
profile={
 'id':'sieg','name':'Sieg','title':'Stormwarden','style':'Refined cel','age':27,
 'origin':'Fictional coastal town of Bracken Quay','nationality':'Fictional Bracken Coast',
 'personality':['quietly protective','observant','dry humor','patient with frightened animals'],
 'biography':'A former harbor courier, Sieg keeps a storm shelter at Bracken Quay. He learned to read the weather before he learned to wield a blade. His rounds now include stranded travelers and the animals that shelter under the docks.',
 'tone':'Short, grounded sentences; gentle reassurance rather than heroic speeches.',
 'values':['kindness without spectacle','safety before pride','keeping promises'],
 'voice':{'status':'omitted-by-owner'},
 'authorship':'Fictional identity authored for PawTrail. Age, origin and biography are creative design choices, not claims inferred about a real person.',
 'designChanges':['Copper forelock and amber eyes','Short navy cape with teal lining','Single brass pauldron and ivory shirt','Charcoal tapered trousers and calf boots','Short broad saber with forked brass guard'],
 'runtimeScope':'Actor preview only; shares existing movement and action rig. No live roster or combat ability installation.',
}
(out/'profile.json').write_text(json.dumps(profile,indent=2)+'\n')
(job/'profile.json').write_text(json.dumps(profile,indent=2)+'\n')
(job/'model-texture-provenance.json').write_text(json.dumps({'face':'Own generated neutral rest/half/closed portrait crops fitted to curved face UVs','garments':'Native authored pixel surfaces matched to generated illustration palette and seams','silhouette':'Original articulated garment, layered hair, curved shoulder and cape geometry','voice':'omitted-by-owner'},indent=2)+'\n')
print('Exported Sieg’s 11 UV surfaces and authored character profile.')
