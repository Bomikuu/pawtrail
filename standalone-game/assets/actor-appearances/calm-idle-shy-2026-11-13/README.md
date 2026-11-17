# Calm idle and Amber Shy expression

The owner rejected the fast motion-refresh loops, while retaining their current
face artwork and expressions. This revision changes idle pacing and adds Shy to
Amber Refined cel. It does not change voices, body models, painted skins, combat
animation timing or the separate social worktree.

- Front neutral portrait: the current two restrained breathing drawings, using
  the original 4.2-second breath timing. The rapid 12-frame head-motion sequence
  is removed. The other held angles retain a small four-drawing range of their
  current facial movement on a 4.8-second cycle.
- Existing emotions and complete blink/speech drawings are retained. Shy adds
  six generated complete drawings per angle: rest, inhale, half blink, closed
  blink, small speech and open speech. It uses a slow 4.2-second breath, with
  normal independent blink/speech timing. The UI offers Shy only for the style
  containing those drawings, in both the portrait studio and actor inspector.
- The complete selected portrait style is 256,444 bytes, with 124 complete
  native 96 × 120 frames and seven expressions across three angles. Unused
  fast-idle frames are excluded from the served atlas; previous packs and their
  sources remain archived.
- Amber's full-body illustration keeps all 12 existing drawings, including legs
  and boots, on a 4.8-second cycle. Vaelrith keeps all 16 illustration drawings
  on a 5.15-second cycle. Their atlas/poster files are copied unchanged. The
  boss's six existing portrait drawings also remain unchanged, now using a
  4.2-second breathing performance defined in its asset manifest.

`inputs.json` records the immutable input publications. `prompts.json` contains
the exact built-in ImageGen prompts and references for Shy; no fallback API was
used. `sources/shy-first-margin-repair.png` is the initial sheet with insufficient
ribbon clearance, retained as provenance. `sources/shy-states.png` is the
corrected transparent sheet used for export. Only the missing Shy art was
generated. Existing complete-frame extraction and registration helpers were
reused through `scripts/refine-actor-idle.py`.

Inspected the generated art and native exported Shy contacts in all three angles,
plus the retained front breathing drawings. The final source has complete
ribbon tips, and each Shy state is a whole portrait rather than a facial patch.
The authoring GIFs show only the corresponding exported idle sequences; they
are not evidence of browser/runtime verification. At export time, live review
was pending under the project instructions. The owner subsequently requested a
focused Codex in-app browser review. That requested scope **passed**: the changed
actor/boss idle performances and Shy rest, blink, speech, breathing and return
transitions in all three angles. See `live-review/REVIEW.md` and its real browser
captures. Other unchanged emotions/styles, mobile fit, OS reduced-motion behavior,
combat and voice listening were not approved by that focused pass. No automated
suite, typecheck or production build ran.

Updated portrait, illustration and project monster authoring guidance: additional
frames should smooth resting motion, while natural breathing stays restrained
and commonly takes about 4–6 seconds. Preserve liked facial art during pacing
repairs; idle artwork timing stays separate from combat timing.

Review Amber at `/play?preview=actors&skin=amber-outrider&art=portrait`: open the
portrait's expand control, then select **Shy**. Vaelrith's artwork and portrait
tabs remain at `/play?preview=monsters&monsterView=3d`.
