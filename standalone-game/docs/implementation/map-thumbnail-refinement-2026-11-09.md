# Map thumbnail refinement — 9 November 2026

The owner requested larger artwork inside circular thumbnails, restoration of the old individual animal illustrations, and the new category thumbnails in the map sidebar, missions and popups.

`DiscoveryAvatar` removes its extra inner padding and renders generated category artwork at 125% inside the existing clipped avatar. Real photos retain their original cover treatment. Province/category miniatures are enlarged consistently. The existing transparent files and their provenance remain unchanged; no images were regenerated or flattened.

`AnimalFace` again uses the existing species/coat-based cat and dog illustration helper, with an official shadcn Avatar handling photo loading/failure. Available animal photos still win. Individual markers, member portraits, animal sidebar/attention rows, route destinations and animal detail headers therefore use their former individual artwork. Generic Animals category summaries retain the newly generated category artwork.

`EntityFace` selects that individual treatment for animal identities and the new category fallback for other entity types. Sidebar rows and non-animal popup headers share this composition. Existing membership count badges and detail banners remain. Map mission rows use the Help illustration when no associated public photo is available; animal attention/adoption rows keep individual animal portraits. The quest-progress illustration and non-animal help alerts use the new care artwork. Help dialogs retain individual animal illustrations where an animal is known, and use the relevant category illustration/photo for requests without an animal.

Only nine map thumbnail components were mirrored into the social worktree, preserving its import aliases. No backend data, rewards, quest progress, routes, generated assets or unrelated game/profile files were changed. No agents, automated application checks/tests, builds or browser verification were run under the owner's standing instruction. Source review covered the individual-versus-category branches and photo/illustration fallback behavior.
