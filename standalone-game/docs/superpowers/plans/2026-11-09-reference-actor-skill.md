# Reference-guided actor skill and preview

The owner requested a reusable skill, an actual trial using it and a preview
page before migrating the other game characters. The chosen trial has red hair,
glasses and a green jacket. The earlier RPG sprite image is the style reference;
the selected colors/accessories are the owner's appearance brief.

1. Package pawtrail-actors under the user's skills directory with a concise
   reference workflow and current production commands.
2. Parameterize createRescuer/createCat materials while preserving their default
   behavior and shared pose functions. Cache painted hair per palette. Attach
   glasses to the existing human head joint.
3. Add an appearance catalogue and bounded authoring endpoint. Share the pixel
   finishing algorithm. A production CLI exports one/all appearances or selected
   actions, retaining untouched frames and versioning asset URLs by content.
4. Keep new appearances in a preview registry. Reuse ActorComparisonScene and
   its controls for an approved-base/new-skin view at /play?preview=actors. Show
   the reference and appearance brief alongside it; preserve the existing legacy
   comparison route and game roster.
5. Use the installed skill to generate Rowan's complete action set, inspect the
   exported reference/poses and install the scoped preview files in the running
   worktree. Include no new roster entry or changes to saved character selection.

Implementation uses installed shadcn controls and Tailwind, Saira Condensed and
Instrument Sans. The new page is a visual review surface, not an image-to-model
AI backend. Private reference uploads remain local to the page. Production art
rendering and source/art review are permitted; no agents, automated tests/checks,
builds or browser verification of the game will run under the standing rules.
