# Reference-led dialogue and action menus

The missing `Home` Lucide import in `components/game/housing/app.tsx` caused the reported ReferenceError; the import is restored in canonical game source and its integrated copy.

`shared/interaction-card.tsx` composes the existing official shadcn Dialog/Button sources into the owner-provided interaction design. NPC conversations, Home pet care and furniture actions share a parchment panel, wood nameplate, portrait frame, speech inset, garden decoration and golden action presentation. Text remains live HTML with the established Saira Condensed / Instrument Sans roles. Existing Maya/Jo/Lina portraits and game tree artwork are reused.

`dialogue.tsx` owns conversation pagination and text reveal. Reduced motion reveals the complete paragraph; the primary control reveals text, continues, or dismisses. Original quest/shop/care choices still use their existing handlers. Dialogue is announced as a complete paragraph for screen readers. The shared Radix dialog preserves focus management and Escape dismissal. Home actions close before their existing approach-and-perform behavior.

Six original decorative assets were generated with image_gen. The master remains under `assets/dialogue-ui-v1/source.png`; only cropped, binary-alpha, nearest-neighbor native PNG exports and their provenance/dimensions manifest ship under `public/pawtrail-game/game-assets/dialogue-ui-v1/`. The garden and portrait have transparent surroundings. Runtime text, action icons and close controls are not baked into images.

No automated tests, checks, builds or browser verification were run, in accordance with the owner's instruction. Source was read and formatted; rendered fidelity remains unverified.
