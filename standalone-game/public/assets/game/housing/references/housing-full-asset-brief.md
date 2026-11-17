# PawTrail — Pixel-Art Asset Generation

## Objective

Generate a complete collection of original, reusable 2D pixel-art assets for PawTrail's multiplayer housing and social interaction system.

PawTrail is a cozy animal rescue and social RPG inspired by classic pixel-art farming and life-simulation games.

Every player has their own customizable house where their cats and other pets can roam freely.

Friends can visit houses, interact with pets, chat, perform emotes, help with animal care, and participate in activities.

Players can decorate their homes by dragging and placing furniture.

We need a consistent set of production-ready assets to support these mechanics.

**Important: Generate the assets only. Do not implement gameplay, create React components, or build the game interface yet.**

---

# 1. Visual Art Direction

Establish one consistent visual identity across all generated assets.

### Style

- Cozy, charming 16-bit-inspired pixel art.
- Classic top-down 3/4 RPG perspective.
- Similar visual warmth and environmental richness to Stardew Valley.
- Original designs, not copied game assets.
- Warm pastel colors with natural wood tones.
- Soft, inviting atmosphere.
- Detailed but readable pixel artwork.
- Consistent lighting from the upper-left.
- Clean and intentional pixel clusters.
- No blurry or smudged pixels.
- No smooth vector-style edges.
- No 3D rendering.
- No painterly textures.
- No unnecessary gradients.
- No isometric perspective.

### Technical Specifications

| Asset Type | Dimensions |
|---|---|
| Ground tiles | 32×32 pixels |
| Wall tiles | 32×32 pixels |
| Player sprites | 32×48 pixels per frame |
| Small cats | 32×32 or 48×48 pixels per frame |
| Dogs | 48×48 or 64×48 pixels per frame |
| Small furniture | 32×32 or 64×64 pixels |
| Large furniture | Multiples of 32 pixels |
| UI icons | 32×32 or 48×48 pixels |

All assets should align to the same world scale.

Generate at higher resolution when necessary, then carefully prepare the output for its intended sprite dimensions.

Use pixel-perfect nearest-neighbor scaling.

Do not assume that simply resizing a generated illustration produces pixel-perfect artwork.

---

# 2. Asset Pack A — House Interior Tileset

Generate a complete modular interior tileset for customizable player houses.

Include:

### Flooring

- Light wooden flooring
- Dark wooden flooring
- Oak flooring
- Cozy bedroom carpet
- White ceramic tiles
- Kitchen floor tiles
- Stone flooring
- Decorative patterned tiles
- Wooden plank variations

### Walls

- Cream-colored walls
- Light green walls
- Warm beige walls
- Pastel blue walls
- Wooden wall panels
- Wallpaper patterns
- Wall corners
- Interior wall edges
- Window sections
- Door frames

### Architectural Objects

- Wooden doors
- Interior doorways
- Windows
- Curtains
- Staircases
- Wall shelves
- Room dividers
- Floor transitions

### Requirements

Create seamless, modular assets.

Walls and floor sections must connect correctly.

Include:

- Straight pieces
- Inner corners
- Outer corners
- Edge transitions
- Doorway variations

Do not generate a preassembled house.

The tiles must support different room sizes and layouts.

Save to:

`public/assets/game/housing/tilesets/`

---

# 3. Asset Pack B — Furniture Collection

Generate individual, movable furniture sprites.

Every furniture item should be suitable for drag-and-drop house decoration.

### Living Room

- Two-seat sofa
- Three-seat sofa
- Armchair
- Coffee table
- Television
- TV cabinet
- Bookshelf
- Side table
- Floor lamp
- Decorative rug
- Wall clock
- Indoor plants

### Bedroom

- Single bed
- Double bed
- Bedside table
- Wardrobe
- Desk
- Chair
- Mirror
- Dresser
- Decorative pillows

### Kitchen

- Kitchen counter
- Dining table
- Dining chairs
- Refrigerator
- Stove
- Sink
- Cupboards
- Kitchen shelves
- Food storage containers

### Decorations

- Small indoor plants
- Large indoor plants
- Flower pots
- Paintings
- Picture frames
- Decorative lights
- Candles
- Wall shelves
- Storage boxes
- Books
- Small rugs

### Furniture Requirements

Each furniture item should:

- Have a transparent background.
- Be separated from other items.
- Use consistent perspective.
- Follow the game's established pixel scale.
- Have a logical collision footprint.
- Include an appropriate placement anchor.
- Be suitable for placement on a 32×32 tile grid.

Where relevant, create multiple color variations.

Do not generate all furniture as one merged scene.

Save to:

`public/assets/game/housing/furniture/`

---

# 4. Asset Pack C — Cat Furniture and Pet Accessories

This is one of the most important collections.

Generate cozy, interactive pet furniture.

### Cat Furniture

- Small cat bed
- Round fluffy cat bed
- Wooden cat house
- Cat tree
- Tall cat climbing tower
- Scratching post
- Cat tunnel
- Window perch
- Hanging cat hammock
- Cat basket
- Cardboard box
- Cat carrier

### Feeding Accessories

- Food bowl
- Water bowl
- Automatic feeder
- Food storage container
- Pet food bag
- Treat container
- Water fountain

### Toys

- Yarn ball
- Feather wand
- Toy mouse
- Small rubber ball
- Fish-shaped plush toy
- Interactive toy
- Toy basket

### Pet Care Objects

- Litter box
- Grooming brush
- Small towel
- Pet blanket
- Cleaning supplies
- First-aid kit

### Interactive States

Generate additional frames or variants where applicable:

Food bowl:
- Empty
- Half-filled
- Full

Water bowl:
- Empty
- Full

Cat bed:
- Empty
- Occupied state should be supported through separate animal sprites

Cat tree:
- Normal
- Interaction animation where appropriate

Toy:
- Idle
- Being moved
- Being played with

Save to:

`public/assets/game/housing/pet-furniture/`

---

# 5. Asset Pack D — Cat Sprites and Animations

Generate multiple cats with consistent pixel-art styling.

### Cat Variations

1. Orange tabby
2. Black cat
3. White cat
4. Gray tabby
5. Calico cat
6. Tuxedo cat
7. Siamese cat
8. Brown tabby
9. Cream-colored cat
10. Gray-and-white cat

Each cat should have a recognizable appearance.

### Required Animations

Create the following animations for each cat.

**Idle**
- Standing
- Sitting
- Blinking
- Tail movement

**Movement**
- Walking down
- Walking up
- Walking left
- Walking right

**Resting**
- Sitting
- Lying down
- Sleeping
- Stretching

**Interactions**
- Eating
- Drinking
- Being petted
- Happy reaction
- Playing with toy
- Grooming
- Approaching player

**Furniture Interactions**
- Jumping onto a sofa
- Sitting on a sofa
- Sleeping on a bed
- Scratching a scratching post
- Playing on a cat tree

### Animation Requirements

Use consistent frame dimensions.

Keep each cat's appearance identical across all animation frames.

Do not change the character's markings, colors, ears, tail shape, or proportions between frames.

Use a fixed animation grid.

Each frame should be centered and properly aligned.

Maintain a consistent foot position for walking animations.

Provide seamless looping animations.

Generate one cat variant at a time to maximize consistency.

Save to:

`public/assets/game/animals/cats/`

---

# 6. Asset Pack E — Player Character Sprites

Generate customizable human player characters.

Use the same proportions and pixel-art style as the existing PawTrail characters.

### Character Variations

Generate:

- Different hairstyles
- Different hair colors
- Different skin tones
- Casual clothing
- Jackets
- Shirts
- Pants
- Shorts
- Shoes
- Backpacks
- Hats

Use a consistent character template that supports future customization.

### Movement Animations

- Walking down
- Walking up
- Walking left
- Walking right
- Idle down
- Idle up
- Idle left
- Idle right

### Social Animations

- Waving
- Laughing
- Dancing
- Clapping
- Cheering
- Sitting
- Sleeping
- Giving a gift
- Holding an item

### Animal Interaction Animations

- Petting
- Feeding
- Playing
- Refilling water
- Cleaning
- Carrying supplies

### Decoration Animations

- Picking up furniture
- Moving objects
- Placing objects
- Inspecting furniture

Maintain consistent character dimensions and animation alignment.

Use separate spritesheets for different character appearances or modular customization layers.

Save to:

`public/assets/game/characters/`

---

# 7. Asset Pack F — Emotes and Social Effects

Generate pixel-art emotes that appear above player characters.

### Emotes

- Happy face
- Laughing face
- Heart
- Waving hand
- Sad face
- Surprised face
- Confused face
- Angry face
- Sleepy face
- Thumbs up
- Celebration
- Paw print

### Special Effects

- Floating hearts
- Sparkles
- Question marks
- Exclamation marks
- Small stars
- Friendship effect
- Pet affection effect
- Kibble reward effect
- Quest completion effect

### Animation Requirements

Create simple 4–6 frame animation sequences.

Emotes should remain readable when displayed above small player sprites.

Use transparent backgrounds.

Save to:

`public/assets/game/effects/emotes/`

---

# 8. Asset Pack G — House Exterior

Generate modular exterior house assets.

### House Variations

- Small starter house
- Cozy wooden cottage
- Pastel-colored house
- Garden house
- Larger upgraded house

### Exterior Objects

- Front doors
- Windows
- Roof sections
- Chimneys
- Mailboxes
- House signs
- Flowerpots
- Garden fences
- Outdoor benches
- Small pathways
- Garden lamps
- Outdoor feeding stations

### Requirements

Maintain the same perspective and visual style as the interior assets.

Create reusable modular building components where practical.

Save to:

`public/assets/game/housing/exteriors/`

---

# 9. Asset Pack H — UI Icons

Generate a consistent pixel-art icon collection.

Icons should be recognizable at small sizes.

### Navigation

- Home
- Friends
- Chat
- Inventory
- Decoration
- Quests
- Settings
- Map

### Animal Actions

- Pet
- Feed
- Play
- Help
- Give water
- View profile
- Follow pet
- Take photo

### Social Actions

- Visit
- Invite
- Add friend
- Send message
- Wave
- Gift
- Guestbook

### Decoration Actions

- Move
- Rotate
- Place
- Store
- Delete
- Undo
- Redo

### UI Requirements

- Transparent backgrounds
- Consistent icon dimensions
- Consistent pixel density
- Readable silhouettes
- Cohesive color palette
- No text labels baked into the artwork

Save to:

`public/assets/game/ui/icons/`

---

# 10. Asset Pack I — Sound Effects

Prepare an asset list for the following sound effects.

### Environment

- Indoor room ambience
- Outdoor neighborhood ambience
- Birds chirping
- Wind
- Rain
- Night crickets

### Player

- Wooden floor footsteps
- Grass footsteps
- Door opening
- Door closing
- Item pickup
- Furniture placement
- Furniture rotation

### Animals

- Cat meow
- Cat purr
- Cat eating
- Cat drinking
- Dog bark
- Dog panting
- Animal happy reaction

### Social

- Friend joining
- Friend leaving
- Chat notification
- Invitation received
- Emote activation
- Gift received

### Rewards

- Kibble earned
- Quest completed
- Achievement unlocked
- Furniture purchased

Use short, pleasant sounds suitable for repeated playback.

Prefer original or properly licensed audio.

Do not treat textual descriptions of sound effects as generated audio files.

If an audio-generation tool is unavailable, create a sound manifest and leave the audio files pending.

Save audio to:

`public/assets/game/audio/`

---

# 11. Asset Organization

Use the following directory structure:

```text
public/
└── assets/
    └── game/
        ├── housing/
        │   ├── tilesets/
        │   ├── exteriors/
        │   ├── furniture/
        │   ├── pet-furniture/
        │   └── ui/
        │
        ├── animals/
        │   ├── cats/
        │   └── dogs/
        │
        ├── characters/
        │   ├── base/
        │   ├── outfits/
        │   └── animations/
        │
        ├── effects/
        │   ├── emotes/
        │   └── particles/
        │
        ├── ui/
        │   └── icons/
        │
        └── audio/
            ├── music/
            ├── ambience/
            ├── animals/
            ├── interactions/
            └── social/
```

---

# 12. Asset Generation Workflow

Do not attempt to generate all assets in one image.

Generate one category at a time.

### Step 1 — Create a Style Reference

Generate a small reference sheet containing:

- One interior floor
- One wall
- One sofa
- One cat bed
- One orange cat
- One player character

Use this as the visual reference for all subsequent asset generations.

### Step 2 — Generate Environment Assets

Generate:

- Interior tiles
- Walls
- Doors
- Windows
- Flooring

Verify the consistency of the perspective and tile dimensions.

### Step 3 — Generate Furniture

Generate furniture in small batches.

Use the established style reference.

### Step 4 — Generate Pet Assets

Generate one complete cat design first.

Use that cat as a reference for its animation frames.

Then generate additional cat variations.

### Step 5 — Generate Player Assets

Generate the base character before producing customization variants.

### Step 6 — Generate UI and Emotes

Generate icons and effects based on the established palette.

### Step 7 — Generate House Exteriors

Generate the house designs and modular exterior objects.

### Step 8 — Validate and Export

For every generated asset:

- Check transparency.
- Check sprite dimensions.
- Check visual consistency.
- Check pixel sharpness.
- Check alignment.
- Check animation frame continuity.
- Check tile seamlessness.
- Check item separation.
- Check file organization.

Do not mark an asset as production-ready when these checks fail.

---

# 13. Asset Manifest

Create a structured manifest that tracks generated assets.

Example:

```json
{
  "id": "cat_orange_tabby",
  "category": "animal",
  "type": "cat",
  "file": "/assets/game/animals/cats/orange-tabby.png",
  "frameWidth": 48,
  "frameHeight": 48,
  "animations": {
    "idle": {
      "start": 0,
      "end": 3,
      "frameRate": 4
    },
    "walk_down": {
      "start": 4,
      "end": 7,
      "frameRate": 8
    }
  }
}
```

The actual manifest must match the generated image layout.

Do not invent frame indexes for files that have not been generated and inspected.

---

# 14. Important Constraints

Do not generate:

- Full gameplay screenshots
- Complete UI mockups
- Large images containing an entire decorated house
- Isometric assets
- Unusable illustrations
- Inconsistent character proportions
- Blurry pixel art
- Characters with changing appearances between frames
- Assets with baked-in backgrounds when transparency is required

Prioritize asset consistency, reusability, and production readiness over the total number of generated assets.

Generate smaller, high-quality batches rather than large collections with inconsistent art.

---

# 15. First Generation Batch

Start by generating only the following:

1. One modular house interior tileset.
2. One sofa.
3. One wooden table.
4. One cat bed.
5. One scratching post.
6. One feeding bowl.
7. One orange tabby cat in an idle pose.
8. One human player character in an idle pose.

Use this first batch to establish the final PawTrail housing art style.

Save the resulting assets in their corresponding directories.

Create a reference sheet showing all eight asset groups together for visual consistency review.

Do not proceed to generating the entire catalog until the style reference is consistent.

## Final Objective

Create a cohesive, reusable library of pixel-art assets suitable for a cozy multiplayer animal social RPG.

The assets must support customizable houses, animal interactions, furniture placement, player movement, multiplayer visits, and social interactions.

The result should look like one professionally designed game rather than a collection of unrelated AI-generated images.