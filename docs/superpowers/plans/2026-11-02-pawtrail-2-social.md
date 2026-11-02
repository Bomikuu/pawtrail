# PawTrail Social and Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PawTrail a useful pet community: public animal stories, photo posts, comments, follows, moderation, user identities, and a complete personal workspace.

**Architecture:** Consume F1–F7. Public records render on the server; interactive actions call the same typed services through the BFF. Activity and helper summaries derive from authorized domain records, not separate counters that can drift.

**Tech Stack:** Next.js, Shadcn, TanStack Query, RHF/Zod, Motion, Vitest, Testing Library, axe-core.

**Spec:** [Architecture specification](../specs/2026-11-02-pawtrail-design.md), §§4–9; [master plan](2026-11-02-pawtrail-implementation.md).

## Global Constraints

No semicolons, no raw controls outside `src/components/ui`, and `npm run check:ui` after UI edits. Public pet/user text is server-rendered. PHP centavos, en-PH, Asia/Manila; mock pages are noindex and clearly sample-labeled. No builds or visual/manual verification without explicit request. Applicant details, exact private locations, and anonymous identities never enter public responses.

## Review Focus

S1 verifies public projection/metadata; S2 tests optimistic rollback, cursor duplicates and double submissions; S3 tests removed/pending visibility and permissions; S4 tests follow filters and notification ownership; S5 tests discoverability and account-data separation.

### Task S1: Public animal profiles, saving, and shared SEO primitives

**Files:** Create `src/app/(public)/pets/[slug]/{page.tsx,loading.tsx,error.tsx,opengraph-image.tsx}`, `src/features/animals/{profile-header,gallery,traits,activity-timeline,help-panel,helper-wall,profile-actions}.tsx`, `src/lib/seo/{origin,metadata,json-ld}.ts`, `tests/unit/animals/{profile,privacy,actions}.test.tsx`, `tests/unit/seo/animal.test.ts`. Modify animal API implementations.

**Interfaces:** Implement `animals.get`, `animals.setSaved`; produce `getPublicAnimal(slug: string): Promise<AnimalProfile>`, `animalMetadata(animal: AnimalProfile): Metadata`, `animalJsonLd(animal: AnimalProfile): JsonLdDocument`, `safeJsonLd(value: JsonLdDocument): string`. Public/profile types come from F2; private fields never enter these helpers.

- [x] Write tests named `renders_public_story_without_map_or_session`, `rejects_private_fields_in_all_public_outputs`, and `rolls_back_failed_save`. Include these assertions:

```ts
expect(html).toContain('Mochi')
expect(html).not.toContain(privateSighting.exactLatitude.toString())
expect(JSON.stringify(animalJsonLd(animal))).not.toContain('applicant')
expect(animalMetadata(animal).alternates?.canonical).toBe(`${siteOrigin}/pets/mochi-the-void`)
expect(savedAfterRejectedRequest).toBe(false)
```

- [x] Run `npm run test:unit -- tests/unit/animals tests/unit/seo/animal.test.ts`; expect missing profile/projection helpers to fail.
- [x] Implement server fetching/notFound/metadata, identity/gallery/description/appearance/condition/personality/behavior/characteristics/badges, verified provenance, activity timeline, help links, helper anonymity, discussion target, sticky sighting/help/share/save/adopt controls, and time-filtered historical sighting list. D2 adds the live behavior-map island; retain the list when it cannot load. Use appropriate WebPage/Thing/BreadcrumbList only, escape JSON-LD, reserve image dimensions, and set mock noindex. Call `router.refresh`/query invalidation after mutations rather than leaving server text stale.
- [x] Run those tests, typecheck, UI check; expect pass.
- [x] Commit `feat: publish server-rendered animal profiles`.

### Task S2: Feed, photo composer, post details, reactions and saved posts

**Files:** Create `src/app/(public)/community/{page.tsx,loading.tsx,error.tsx}`, `src/app/(public)/community/[id]/page.tsx`, `src/app/(public)/community/create/page.tsx`, `src/features/community/{feed,post-card,post-composer,post-actions,linked-entity-picker}.tsx`, `src/features/community/{queries,mutations,service}.ts`, `tests/unit/community/{feed,composer,mutations,pagination}.test.tsx`.

**Interfaces:** Implement `community.list/get/create/update/remove/setReaction/setSaved`. `PostFilters = ListQuery & { tab?: 'for_you' | 'following' | 'nearby', animalId?: Id, authorId?: Id, saved?: boolean, areaId?: Id }`. `PostInput` contains text (1–2,000 characters), up to 6 public-eligible media IDs, a brief content type, and associated animal/Horde/fundraiser/mission references. Referenced records must exist and be visible.

- [x] Write tests `creates_pending_photo_post_and_survives_refresh`, `deduplicates_cursor_items`, `retries_create_without_duplicate`, and `rolls_back_failed_reaction`. Pin:

```ts
expect(created.moderationState).toBe('pending')
expect(await reopened.community.get(created.id)).toMatchObject({ id: created.id })
expect(otherActorFeed.items.map(p => p.id)).not.toContain(created.id)
expect(new Set(pagedIds).size).toBe(pagedIds.length)
expect(retried.id).toBe(created.id)
expect(reactionCountAfterFailure).toBe(initialCount)
```

- [x] Run `npm run test:unit -- tests/unit/community`; expect missing feed/mutations to fail.
- [x] Implement SSR initial posts plus scoped hydration, For you/Following/Nearby tabs, honest chronological “For you,” location opt-in, pagination, reusable cards for all seven brief content types, upload previews, linked-entity picker, edit/delete ownership, share fallback, single user reaction, and saved posts. Unpublished records appear only to their author/reviewer. Preserve draft text on failures, disable duplicate submit, reconcile optimistic IDs with server IDs, and restore counts after failures. No optimistic “published” state before moderation.
- [x] Run these tests, typecheck, UI check; expect pass.
- [x] Commit `feat: add PawTrail social feed and publishing flow`.

### Task S3: Discussions, reporting and moderator review

**Files:** Create `src/features/community/{discussion,comment-form,report-dialog}.tsx`, `src/features/moderation/{service,schemas,types}.ts`, `src/features/moderation/{review-queue,review-panel}.tsx`, `src/app/(dashboard)/dashboard/moderation/page.tsx`, `tests/unit/community/discussion.test.tsx`, `tests/unit/moderation/{visibility,permissions,review}.test.ts`. Modify public animal/post reads and moderation handlers.

**Interfaces:** Implement `community.comments/comment` for `ResourceRef`, `moderation.report/queue/review`. `CommentInput = { text: string }` (1–1,000 characters). `ReportInput = { target: ResourceRef, reason: ReportReason, details?: string }`. Review decisions contain item ID, expected version, decision publish/reject/remove/verify/revoke_verification, evidence IDs when verifying, and an audit reason. Verification actions are separate from publication actions, restricted to authorized moderators for animal/shelter/campaign subjects, and never available to the creator. Queue items identify publication versus verification review explicitly. Only moderators or explicitly scoped reviewers may review.

- [x] Test `rejects_anonymous_comment`, `does_not_reveal_removed_record_by_id`, `applies_review_to_every_public_projection`, and `prevents_stale_review_overwrite`:

```ts
await expect(anonymous.community.comment(ref, { text: 'Update' })).rejects.toMatchObject({ status: 401 })
await expect(outsider.community.get(removed.id)).rejects.toMatchObject({ status: 404 })
expect(feedAfterRemoval.items.map(p => p.id)).not.toContain(removed.id)
await expect(ordinaryMember.moderation.queue({})).rejects.toMatchObject({ status: 403 })
await expect(staleReview()).rejects.toMatchObject({ code: 'CONFLICT' })
```

- [x] Run `npm run test:unit -- tests/unit/community/discussion.test.tsx tests/unit/moderation`; expect missing moderation/discussion failures.
- [x] Implement paginated comments, photo updates through the existing composer, report reasons/confirmation, pending/rejected/removed states, review permissions, version conflicts, immutable audit records, and reporter confidentiality. Decisions invalidate public detail/feed/search/profile queries and notify the author. Sensitive images use a warning before display. Report count alone must not fabricate verification or automatically delete content.
- [x] Re-run these tests, typecheck, UI check; expect pass.
- [x] Commit `feat: add discussions and accountable content review`.

### Task S4: Public users, following and activity notifications

**Files:** Create `src/app/(public)/users/[username]/page.tsx`, `src/features/users/{public-profile,follow-button}.tsx`, `src/features/users/service.ts`, `src/features/notifications/service.ts`, `src/features/notifications/{notification-list,notification-menu}.tsx`, `src/app/(dashboard)/dashboard/notifications/page.tsx`, `tests/unit/users/{profile,follows}.test.tsx`, `tests/unit/notifications/ownership.test.ts`.

**Interfaces:** Implement `users.get`, `follows.set/list`, `notifications.list/markRead/unreadCount`. Follow targets are only animals/users, unique per follower/target. Notifications contain ID, owner, type, safe message, destination ResourceRef, created/read timestamps; never embed confidential application answers in the message. Domain services call server-only `notify(input: NotificationInput): Promise<void>`.

- [ ] Write `following_feed_uses_followed_targets`, `repeat_follow_is_idempotent`, and `unread_count_is_owner_scoped`:

```ts
expect(following.items.every(p => p.authorId === followedUser.id || p.animalIds.includes(followedPet.id))).toBe(true)
expect(await followCountAfterTwoIdenticalRequests()).toBe(1)
await expect(otherActor.notifications.markRead([notification.id])).rejects.toMatchObject({ status: 403 })
expect(await owner.notifications.unreadCount()).toBe(0)
```

- [ ] Run `npm run test:unit -- tests/unit/users tests/unit/notifications`; expect missing follow/profile/notification behavior.
- [ ] Implement profile photo/name/bio/voluntary location/level/badges/contribution summaries/animals helped/stories, follow/unfollow actions, Following feed integration, notification read/unread/deep links, and per-user query invalidation. Activity is in-app only; no external emails or messages are sent. Counts derive from the same contributions used by missions/fundraising/adoption, with honest empty states until those packages land.
- [ ] Run tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: connect PawPal profiles follows and notifications`.

### Task S5: Private dashboard, animal management and privacy settings

**Files:** Create `src/app/(dashboard)/dashboard/page.tsx`, dashboard pages under `profile/`, `animals/`, `animals/[id]/edit/`, `sightings/`, `adoptions/`, `saved/`, `settings/`; `src/features/dashboard/{summary,my-animals,my-sightings,saved-items}.tsx`, `src/features/users/{profile-form,privacy-form}.tsx`, `src/features/animals/animal-editor.tsx`, `tests/unit/dashboard/{ownership,summary,saved}.test.tsx`, `tests/unit/users/privacy.test.ts`.

**Interfaces:** Implement `users.update/settings/updateSettings/summary`, `animals.update`; `DashboardSummary` contains authorized counts and sections for animals, sightings, missions, adoption interests/applications, campaigns, Kibble, saved items, notifications. `PrivacySettings` contains publicProfile, showLocation, showContributions; no setting can make adoption answers public. Animal edits use a server-checked owned/managed relationship, not a submitted owner ID.

- [ ] Test `hides_profile_and_private_activity_when_requested`, `rejects_cross_owner_animal_edit`, and `dashboard_totals_match_records`:

```ts
await expect(publicApi.users.get(hidden.username)).rejects.toMatchObject({ status: 404 })
expect(publicProfile.location).toBeUndefined()
await expect(otherActor.animals.update(pet.id, change)).rejects.toMatchObject({ status: 403 })
expect(summary.savedAnimals).toBe(savedAnimals.items.length)
expect(JSON.stringify(publicProfile)).not.toContain(privateApplication.motivation)
```

- [ ] Run `npm run test:unit -- tests/unit/dashboard tests/unit/users/privacy.test.ts`; expect missing dashboard/privacy behavior.
- [ ] Implement profile editing/upload, privacy forms with confirmation, managed animal editing, saved post/animal lists, sightings, adoption links, account overview, and scoped error/empty states. Views for missions/fundraisers/Kibble use their owning package's services when available; final release has no fake totals or dead destinations. Profile privacy propagates to public user route, search, metadata/sitemap (I2), and contribution projections without erasing financial audit history.
- [ ] Run tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: complete PawPal workspace and privacy controls`.

## Package acceptance

- [ ] Posting → moderation → public feed → comment/react/follow/save → profile/activity works with role checks and refresh persistence.
- [ ] Public animal and user content renders without JavaScript-dependent map data.
- [ ] Cross-session/owner tests and public-field exclusion tests pass. No unrequested visual/manual checks or production builds ran.
