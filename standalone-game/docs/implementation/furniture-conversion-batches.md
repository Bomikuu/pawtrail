# Catalog furniture conversion batches

The owner initially requested broad catalog conversion, then narrowed this temporary phase to furniture with meaningful actor/pet interactions or state-changing actions. The active queue has **24 pending interactive 3D IDs, 20 interactive 2D IDs and 57 deferred sprites**, alongside nine authored models. Interaction-01 (Chair, Armchair and Dining Chair) is installed; see `furniture-interaction-01-2026-11-11.md`. Inspection, collision or a state change alone does not require 3D. Preserve the existing sprites and installed models.

Read `assets/furniture-studio/batches/interaction-plan.json` for actions/states and `conversion-queue.json` for ordered batches. The implementation plan is `docs/superpowers/plans/2026-11-10-interactive-furniture-queue.md`. Earlier representation recommendations remain recorded for provenance but do not activate deferred 3D work.

## Batch workflow

1. Read the existing catalog IDs and native artwork. Inspect component counts at integer nearest-neighbor zoom. Preserve the original front as canonical. Classify each ID as retained 2D, hybrid 3D or volumetric 3D first. Retained-2D tasks use separate sprite/state/contact review batches; the remaining steps apply to actual 3D/hybrid conversion.
2. Generate one coherent front/left/back/right/front-three-quarter/rear-three-quarter sheet per furniture shape. Preserve untouched tool masters, exact prompts and checksums in `assets/furniture-studio/references/<id>/`.
3. Inspect the proposal before presentation. Import transparent native references with a single uniform scale; raw tool halos must not become background pixels in native game art. `scripts/prepare-furniture-batch-references.py` performs that asset import.
4. Show the selected sheets/native reference previews and ask whether the batch is good enough. Use the owner's previously configured 60-second no-response default unless changed. Record explicit yes, revision requested and no-response default separately. No dependent geometry changes before the review resolves.
5. Build coherent structural models with source-painted faces, finished hidden surfaces, centered rotation, native frame, collision and actor contracts. Reuse a shape for genuine texture variants or identical-source aliases, while retaining inventory IDs. A 2D billboard or unrelated generic box is not a conversion.
6. Export four native facings and GLB authoring geometry, plus 45/135-degree comparison evidence. Export ambient frames only for genuinely animated furniture. Preserve existing prices, categories, zones, interactions, inventory IDs and supported animal contacts. Construction options remain authoring/server-owned metadata.
7. Install only the batch's catalog records/assets and scoped code in the standalone game and main app. Existing saved placements and balances are never replaced with fixtures. State exactly which views and runtime flows were reviewed.

No automated application tests/checks/builds, subagents or live browser verification are authorized by the standing workspace instructions. Isolated Firefox art production is part of requested model conversion. Unrequested authenticated game actions remain unexercised.

## First batch

- `table`: original honey-wood low table, deep solid apron, broad horizontal grain and four short feet. The original occupied front is 54×39; the generated front is shorter, so canonical front proportions take priority.
- `side-table`: square bevelled top, four straight legs and one low inset shelf. The original front is 25×28.
- `bookshelf`: three open book-filled rows, olive/russet/cream spines, shallow cabinet, plain timber rear and four short corner feet. The original front is 44×56.

Each reference manifest records the current source, sheet revision, native import and review state. This document and the queue describe staged work, not a claim that all catalog furniture is already converted.
