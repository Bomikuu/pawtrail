"""Finish the isolated 3D-to-pixel approval exports; never changes live assets."""

from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/animation-approval-v1/exports"
PREVIEWS = OUTPUT.parent / "previews"
PREVIEWS.mkdir(exist_ok=True)
META = json.loads((OUTPUT / "render.json").read_text())
INK = (42, 28, 23)
LIT_INK = (58, 38, 29)
PAPER = (248, 239, 217)
MUTED = (115, 92, 69)
SELECTED_DIRECTIONS = ["down", "down_right", "right", "up"]
LABELS = ["Front", "Three-quarter", "Side", "Back"]


from pixel_actor_art import PixelFinish

production = PixelFinish(META['palette'])
COLORS = production.colors
finish = production.finish


frames = {}
for actor, size in [("rescuer", (32, 48)), ("orange-tabby", (32, 32))]:
    action_configs = META["actions"][actor]
    columns = 32
    layout = []
    cursor = 0
    for direction in META["directions"]:
        for action, config in action_configs.items():
            count = config.get("frames", 8)
            if cursor % columns + count > columns:
                cursor += columns - cursor % columns
            layout.append((direction, action, config, cursor, count))
            cursor += count
    rows = (cursor + columns - 1) // columns
    sheet = Image.new("RGBA", (size[0] * columns, size[1] * rows))
    animations = {}
    for direction, action, config, start, count in layout:
        folder = OUTPUT / actor / "sprites" / action / direction
        folder.mkdir(parents=True, exist_ok=True)
        for frame in range(count):
            sprite = finish(OUTPUT / actor / "frames" / action / direction / f"{frame}.png")
            sprite.save(folder / f"{frame}.png")
            index = start + frame
            sheet.alpha_composite(sprite, ((index % columns) * size[0], (index // columns) * size[1]))
            frames[actor, action, direction, frame] = sprite
        animations[f"{action}-{direction}"] = {
            "start": start, "end": start + count - 1,
            "frameRate": config["fps"], "repeat": config["repeat"],
        }
    sheet.save(OUTPUT / actor / "spritesheet.png", optimize=True)
    manifest = {
        "status": "first-pair-actions-pilot",
        "frameWidth": size[0], "frameHeight": size[1],
        "columns": columns, "rows": rows, "spacing": 0, "margin": 0,
        "filter": "nearest",
        "groundPixel": {"x": 16, "y": 44 if actor == "rescuer" else 28},
        "anchor": {"x": .5, "y": (44 if actor == "rescuer" else 28) / size[1]},
        "palette": ["#%02x%02x%02x" % color for color in COLORS],
        "animations": animations,
        "source": "source-rig.glb",
        "notes": "Fixed orthographic camera and cell alignment; no per-frame recentering.",
    }
    (OUTPUT / actor / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


def font(size):
    paths = [ROOT / "public/fonts/instrument-sans-latin-400-normal.woff2",
             Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")]
    for path in paths:
        if path.exists():
            try:
                return ImageFont.truetype(str(path), size)
            except OSError:
                pass
    return ImageFont.load_default()


heading_font, label_font = font(20), font(13)


def make_preview(action):
    rendered = []
    ticks = 24 if action == "walk" else 8
    for tick in range(ticks):
        canvas = Image.new("RGB", (656, 440), PAPER)
        draw = ImageDraw.Draw(canvas)
        draw.text((24, 15), f"PawTrail / {action.title()} approval", fill=INK, font=heading_font)
        draw.text((24, 45), "Rigged 3D source → native pixel sprites · 4× nearest-neighbor", fill=MUTED, font=label_font)
        for column, direction in enumerate(SELECTED_DIRECTIONS):
            center = 94 + column * 156
            draw.text((center, 75), LABELS[column], fill=MUTED, font=label_font, anchor="mt")
            for actor, top in [("rescuer", 102), ("orange-tabby", 299)]:
                config = META["actions"][actor][action]
                elapsed = tick / 30 if action == "walk" else tick / 4
                frame = int(round(elapsed * config["fps"], 6)) % config.get("frames", 8)
                sprite = frames[actor, action, direction, frame]
                enlarged = sprite.resize((sprite.width * 4, sprite.height * 4), Image.Resampling.NEAREST)
                canvas.paste(enlarged, (center - 64, top), enlarged)
        rendered.append(canvas)
    # One palette for every GIF frame prevents palette flashes while animating.
    swatches = [PAPER, MUTED, INK, *COLORS]
    paletted = Image.new("P", (1, 1))
    flat = [channel for color in swatches for channel in color]
    paletted.putpalette(flat + [0] * (768 - len(flat)))
    gif_frames = [im.quantize(palette=paletted, dither=Image.Dither.NONE) for im in rendered]
    gif_frames[0].save(PREVIEWS / f"{action}-preview.gif", save_all=True,
                       append_images=gif_frames[1:], duration=250 if action == "idle" else [30, 30, 40] * 8,
                       loop=0, disposal=2, optimize=False)
    rendered[0].save(PREVIEWS / f"{action}-preview.png")


make_preview("idle")
make_preview("walk")

# A complete directional contact sheet remains separate from runtime sprites.
contact = Image.new("RGB", (1024, 392), PAPER)
draw = ImageDraw.Draw(contact)
for column, direction in enumerate(META["directions"]):
    x = column * 128
    draw.text((x + 64, 12), direction.replace("_", " "), anchor="mt", fill=MUTED, font=label_font)
    for actor, top in [("rescuer", 44), ("orange-tabby", 242)]:
        sprite = frames[actor, "idle", direction, 0].resize(
            (128, 192 if actor == "rescuer" else 128), Image.Resampling.NEAREST)
        contact.paste(sprite, (x, top), sprite)
contact.save(PREVIEWS / "all-directions.png")

strip = Image.new("RGB", (1536, 352), PAPER)
for frame in range(12):
    for actor, top in [("rescuer", 0), ("orange-tabby", 208)]:
        count = META["actions"][actor]["walk"].get("frames", 8)
        sprite = frames[actor, "walk", "down_right", int(frame * count / 12)]
        enlarged = sprite.resize((sprite.width * 4, sprite.height * 4), Image.Resampling.NEAREST)
        strip.paste(enlarged, (frame * 128, top), enlarged)
strip.save(PREVIEWS / "walk-frames.png")

action_previews = []
for tick in range(40):
    canvas = Image.new("RGB", (656, 440), PAPER)
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 15), "PawTrail / Care & rest animations", fill=INK, font=heading_font)
    draw.text((24, 45), "Same source rigs, palette and native pixel scale · 4× preview", fill=MUTED, font=label_font)
    for column, (human, cat, label) in enumerate([
        ("feed", "eat", "Feed / eat"), ("pet", "pet", "Pet"),
        ("sit", "sit", "Sit"), ("sleep", "sleep", "Sleep"),
    ]):
        center = 94 + column * 156
        draw.text((center, 75), label, fill=MUTED, font=label_font, anchor="mt")
        for actor, action, top in [("rescuer", human, 102), ("orange-tabby", cat, 299)]:
            config = META["actions"][actor][action]
            frame = int(round(tick / 10 * config["fps"], 6)) % config.get("frames", 8)
            sprite = frames[actor, action, "down_right", frame]
            enlarged = sprite.resize((sprite.width * 4, sprite.height * 4), Image.Resampling.NEAREST)
            canvas.paste(enlarged, (center - 64, top), enlarged)
    action_previews.append(canvas)
action_previews[0].save(PREVIEWS / "actions-preview.gif", save_all=True,
                       append_images=action_previews[1:], duration=100, loop=0, disposal=2)
action_previews[3].save(PREVIEWS / "actions-preview.png")

cat_top = ((len(META["actions"]["rescuer"]) + 7) // 8) * 240
all_actions = Image.new("RGB", (1024, cat_top + ((len(META["actions"]["orange-tabby"]) + 7) // 8) * 180), PAPER)
draw = ImageDraw.Draw(all_actions)
for actor, top, cell_height in [("rescuer", 0, 240), ("orange-tabby", cat_top, 180)]:
    for index, action in enumerate(META["actions"][actor]):
        x, y = (index % 8) * 128, top + (index // 8) * cell_height
        draw.text((x + 64, y + 5), action, anchor="mt", fill=MUTED, font=label_font)
        sprite = frames[actor, action, "down_right", 3]
        enlarged = sprite.resize((sprite.width * 4, sprite.height * 4), Image.Resampling.NEAREST)
        all_actions.paste(enlarged, (x, y + 25), enlarged)
all_actions.save(PREVIEWS / "action-poses.png")

# Before/after front walk, using the preserved v2 runtime pack as the baseline.
previous_root = ROOT / "public/pawtrail-game/game-assets/baked-actors-v2/rescuer"
previous_manifest = json.loads((previous_root / "manifest.json").read_text())
previous_sheet = Image.open(previous_root / "spritesheet.png").convert("RGBA")
previous_walk = previous_manifest["animations"]["walk-down"]
comparison = []
for tick in range(24):
    elapsed = tick / 30
    canvas = Image.new("RGB", (352, 270), PAPER)
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 12), "Front walk / gait & edge detail", fill=INK, font=label_font)
    draw.text((96, 43), "Previous", anchor="mt", fill=MUTED, font=label_font)
    draw.text((256, 43), "Refined", anchor="mt", fill=MUTED, font=label_font)
    old_index = previous_walk["start"] + int(elapsed * previous_walk["frameRate"]) % 8
    ox = old_index % previous_manifest["columns"] * 32
    oy = old_index // previous_manifest["columns"] * 48
    old = previous_sheet.crop((ox, oy, ox + 32, oy + 48))
    new = frames["rescuer", "walk", "down", int(round(elapsed * 15, 6)) % 12]
    for sprite, x in [(old, 32), (new, 192)]:
        enlarged = sprite.resize((128, 192), Image.Resampling.NEAREST)
        canvas.paste(enlarged, (x, 67), enlarged)
    comparison.append(canvas)
comparison[0].save(PREVIEWS / "front-walk-comparison.gif", save_all=True,
                   append_images=comparison[1:], duration=[30, 30, 40] * 8,
                   loop=0, disposal=2)

hair_before_root = ROOT / "public/pawtrail-game/game-assets/baked-actors-v3/rescuer"
hair_before_manifest = json.loads((hair_before_root / "manifest.json").read_text())
hair_before_sheet = Image.open(hair_before_root / "spritesheet.png").convert("RGBA")
hair_detail = Image.new("RGB", (656, 450), PAPER)
draw = ImageDraw.Draw(hair_detail)
draw.text((24, 14), "Hair texture & bold edges", fill=INK, font=heading_font)
for column, direction in enumerate(["down", "down_right", "up"]):
    left = 32 + column * 208
    draw.text((left+80, 48), direction.replace("_", " "), anchor="mt", fill=MUTED, font=label_font)
    before_index = hair_before_manifest["animations"]["idle-"+direction]["start"]
    ox = before_index % hair_before_manifest["columns"] * 32
    oy = before_index // hair_before_manifest["columns"] * 48
    previous = hair_before_sheet.crop((ox, oy, ox+32, oy+48))
    current = frames["rescuer", "idle", direction, 0]
    for sprite, top, label in [(previous, 82, "Previous"), (current, 272, "Textured")]:
        detail = sprite.crop((6, 6, 26, 25)).resize((160,152), Image.Resampling.NEAREST)
        hair_detail.paste(detail, (left, top), detail)
        draw.text((left+80, top-18), label, anchor="mt", fill=MUTED, font=label_font)
hair_detail.save(PREVIEWS / "hair-texture-comparison.png")
print(f"Finished {len(frames)} native frames, two sheets and animated previews in {PREVIEWS}")

# The vehicle is a separate native-pixel layer, so the rider keeps its original
# cell size, collision body and ground anchor. Wheels are baked in all headings.
car_output = OUTPUT / 'emote-car'
if (car_output / 'render.json').exists():
    car_meta = json.loads((car_output / 'render.json').read_text())
    cw, ch, count = car_meta['frameWidth'], car_meta['frameHeight'], car_meta['frames']
    car_sheet = Image.new('RGBA', (cw * count, ch * len(META['directions'])))
    animations = {}
    for row, direction in enumerate(META['directions']):
        folder = car_output / 'sprites' / direction
        folder.mkdir(parents=True, exist_ok=True)
        for frame in range(count):
            sprite = finish(car_output / 'frames' / direction / f'{frame}.png')
            sprite.save(folder / f'{frame}.png')
            car_sheet.alpha_composite(sprite, (frame*cw, row*ch))
        animations[direction] = {'start': row*count, 'end': (row+1)*count-1}
    car_sheet.save(car_output / 'spritesheet.png', optimize=True)
    car_manifest = dict(frameWidth=cw, frameHeight=ch, columns=count, rows=8,
                        spacing=0, margin=0, filter='nearest', frameRate=car_meta['fps'],
                        groundPixel=car_meta['groundPixel'], attachmentOffsetY=12,
                        animations=animations)
    (car_output / 'manifest.json').write_text(json.dumps(car_manifest, indent=2)+'\n')
    print('Finished 96 car frames with directional, spinning-wheel animation.')
