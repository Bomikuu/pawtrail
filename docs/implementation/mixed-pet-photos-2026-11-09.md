# Mixed pet photo states — 9 November 2026

The owner requested existing collection photographs on some local pets, with others left without a photo to compare both display states. No new images were generated or downloaded.

The existing licensed collection in the social worktree's `public/images/pets/portraits/` supplies these eight assignments. Images were inspected to keep cats and dogs distinct; collection filenames do not necessarily share the species or identity of a seeded pet.

| Local pet | Collection file |
| --- | --- |
| Smokey (cat) | shadow.webp |
| Coco (cat) | patches.webp |
| Cloud (cat) | bean.webp |
| Luna (cat) | luna.webp |
| Milo (dog) | milo.webp |
| Biscuit (dog) | bantay.webp |
| Oreo (dog) | cloud.webp |
| Chai (dog) | pip.webp |

Sunny, Mochi, Miso, Pepper, Ginger, Snow, Rusty, Poppy, Tala and Kopi retain a null database photo. They use the existing species/coat illustration fallback. Photo-bearing profiles use the normal real-media adapter across directory rows, map markers, quests, popups and public profiles.

`backend/social/management/commands/seed_community_photos.py` in the social worktree performs this scoped population. It requires debug mode and the exact existing listed fixture IDs, refuses missing/mismatched records, preserves existing photos, and does not create animal identities. The command uploads the selected local files through the existing media service, creates public derivatives, retains the complete source/author/license sidecar in internal asset provenance, and records stable fixture asset keys. Animal/profile versions advance with photo assignment. The existing baseline seed command preserves the assignments on later runs.

It was applied to the running local platform database using the API process's environment, with `--skip-checks`. The operation reported eight assignments and ten remaining null photos. These photographs are presentation media for fictional local profiles, not identification references or actual encounter evidence. No recognition enrollment, sightings, rewards, payments, accounts or geographic data were created or changed. Existing fixture flags and listed identity states remain.

Rerun from the social backend with its existing environment:

```sh
.venv/bin/python manage.py seed_community_photos --skip-checks
```

No browser verification, automated application tests/checks or builds were run. The database operation's result is the delivery receipt; refresh the map to load the changed records. The existing short-lived public statistics cache can refresh on its normal expiry.
