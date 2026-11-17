"""Prepare authored Amber material maps; run with uv --with pillow python.

Generated albedo is preserved at native resolution. Normal/roughness/metal maps
derive from its material features, not a noise-only placeholder. Geometry AO is
baked separately by Blender into a unique UV set.
"""
from pathlib import Path
import json
import math
from PIL import Image, ImageChops, ImageFilter, ImageOps, ImageEnhance

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/actor-appearances/amber-anime-v3/textures'
OUT.mkdir(parents=True, exist_ok=True)
source = Image.open(OUT / 'generated-materials.png').convert('RGB')
w, h = source.size
# The generated strand tile is too orange for Amber's dark-brown identity.
hair_box = (round(w / 3), round(h / 2), round(w * 2 / 3), h)
hair = ImageEnhance.Color(source.crop(hair_box)).enhance(.72)
source.paste(ImageEnhance.Brightness(hair).enhance(.64), hair_box)
source.save(OUT / 'amber-albedo.png', optimize=True)
gray = ImageOps.grayscale(source).filter(ImageFilter.GaussianBlur(.6))
dx = ImageChops.subtract(ImageChops.offset(gray, -1, 0), ImageChops.offset(gray, 1, 0), scale=1, offset=128)
dy = ImageChops.subtract(ImageChops.offset(gray, 0, -1), ImageChops.offset(gray, 0, 1), scale=1, offset=128)
normal = Image.merge('RGB', (dx, ImageOps.invert(dy), Image.new('L', source.size, 253)))
normal.save(OUT / 'amber-normal.png', optimize=True)
rough, metal = Image.new('L', source.size), Image.new('L', source.size)
# Top row red woven cloth, embroidered ivory and pouch leather; bottom row
# boot leather, hair and brass. Gold embroidery remains metallic thread only.
for row, col, base, metallic in [(0, 0, 215, 0), (0, 1, 225, 0), (0, 2, 180, 0), (1, 0, 172, 0), (1, 1, 190, 0), (1, 2, 145, 220)]:
    box = (round(w * col / 3), round(h * row / 2), round(w * (col + 1) / 3), round(h * (row + 1) / 2))
    tile = gray.crop(box).point(lambda value: max(50, min(245, base + (value - 128) * .12)))
    rough.paste(tile, box)
    metal.paste(metallic, box)
rough.save(OUT / 'amber-roughness.png', optimize=True)
metal.save(OUT / 'amber-metallic.png', optimize=True)
Image.merge('RGB', (Image.new('L', source.size, 255), rough, metal)).save(OUT / 'amber-metal-roughness.png', optimize=True)

# One continuous head UV: facial features blend into surrounding skin rather
# than sitting on a separate opaque patch with a visible chin seam.
atlas = Image.open(ROOT / 'assets/actor-appearances/amber-parts-detail-v2/face-atlas.png').convert('RGB')
cell = atlas.width // 3
face = atlas.crop((0, 0, cell, atlas.height))
skin = face.getpixel((cell // 2, 30))
head = Image.new('RGB', (1024, 1024), skin)
feature = face.resize((370, 815), Image.Resampling.LANCZOS)
mask = Image.new('L', feature.size)
pix = mask.load()
for y in range(feature.height):
    for x in range(feature.width):
        nx, ny = abs(x / (feature.width - 1) * 2 - 1), y / (feature.height - 1)
        edge = max(0, min(1, (1 - nx) / .15, ny / .12, (1 - ny) / .15))
        pix[x, y] = round(255 * edge * edge * (3 - 2 * edge))
head.paste(feature, (327, 150), mask)
head.save(OUT / 'amber-head-albedo.png', optimize=True)
Image.new('RGB', (1024, 1024), (128, 128, 255)).save(OUT / 'amber-head-normal.png', optimize=True)
Image.new('RGB', (1024, 1024), (255, 205, 0)).save(OUT / 'amber-head-metal-roughness.png', optimize=True)
(OUT / 'material-provenance.json').write_text(json.dumps({
    'albedoNativeSize': [w, h], 'upscaled': False,
    'baseColor': 'Generated Amber-specific woven cloth, embroidery, leather, hair strands and aged brass surface atlas.',
    'normal': 'Small material relief from albedo feature gradients; large folds and seams are geometry.',
    'roughness': 'Authored response by material with bounded feature variation.',
    'metallic': 'Brass tile only; cloth, skin, hair and leather remain dielectric.',
    'ambientOcclusion': 'Separate Blender geometry bake using BakeUV, not color-derived shadow.',
    'headSize': [1024, 1024], 'skinSRGB': list(skin),
}, indent=2) + '\n')
print('Prepared native material maps', source.size, 'and 1024px continuous face UV')
