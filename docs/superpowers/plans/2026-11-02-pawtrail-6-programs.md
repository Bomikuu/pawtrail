# PawTrail Community Programs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect verified help, non-cash rewards, shelters, and local events to the same animal/community records.

**Architecture:** Consume foundation, social/moderation, discovery and groups. Mission participation is per volunteer; approval produces a uniquely identified contribution used by an append-only Kibble ledger. Shelter/event views reuse domain services rather than duplicate records.

**Tech Stack:** Next.js, Shadcn, TanStack Query, RHF/Zod, Motion, Recharts where meaningful, Vitest/Testing Library.

**Spec:** [Architecture specification](../specs/2026-11-02-pawtrail-design.md), §§4–8; [master plan](2026-11-02-pawtrail-implementation.md).

## Global Constraints

No semicolons or feature-level raw controls; run UI check after frontend edits. No builds or visual/manual verification without explicit request. Kibble is non-cash and only approved contributions earn it. Purchased points never count toward volunteer rankings. PHP centavos, en-PH, Asia/Manila; frozen demo time `2026-11-02T00:00:00+08:00`. Public animal locations remain approximate; private evidence requires authorization.

## Review Focus

W1 tests deadlines, reviewer permissions, resubmission and concurrent acceptance; W2 tests double awards, reversals and month boundaries; W3 tests organization scoping; W4 tests capacity, repeated RSVP, cancellation and schedule boundaries.

### Task W1: Help missions, quests, evidence and reviewer workflow

**Files:** Create `src/app/(public)/missions/{page.tsx,loading.tsx,error.tsx}`, `src/app/(public)/missions/[slug]/page.tsx`, `src/app/(public)/missions/create/page.tsx`, `src/app/(dashboard)/dashboard/missions/page.tsx`, `src/features/missions/{types,schemas,service,transitions}.ts`, `src/features/missions/{mission-card,mission-detail,mission-form,evidence-form,my-missions,review-evidence}.tsx`, `tests/unit/missions/{transitions,deadlines,permissions,idempotency}.test.ts`.

**Interfaces:** Implement `missions.list/get/create/accept/submit/review/participations`. `accept(missionId)` returns the unique current actor's `MissionParticipation`; `submit(participationId, MissionEvidenceInput)` changes that participation; `review(participationId, MissionReviewInput)` checks expected version and organizer/reviewer permissions. `ParticipationFilters` supports own/organization, status and cursor. Produce `Contribution = { id, sourceKind: 'mission' | 'sighting' | 'feeding', sourceId, userId, approvedAt, eligiblePoints }`; persist contribution and participation approval in one transaction. “Create Quest” is `MissionInput.kind = 'quest'` using the same states.

- [ ] Test `acceptance_does_not_complete_or_reward`, `different_volunteers_have_separate_participations`, `rejected_evidence_can_be_resubmitted_before_deadline`, and `review_is_versioned_and_idempotent`:

```ts
expect(accepted.status).toBe('accepted')
expect(await rewardFor(accepted.id)).toBe(0)
expect(firstVolunteer.id).not.toBe(secondVolunteer.id)
expect(await reviewTwice()).toHaveLength(1)
await expect(submitAfterDeadline()).rejects.toMatchObject({ code: 'DEADLINE_PASSED' })
await expect(reviewOwnEvidence()).rejects.toMatchObject({ status: 403 })
```

- [ ] Run `npm run test:unit -- tests/unit/missions`; expect missing participation/review rules.
- [ ] Implement mission cards (photo/priority/area/activity/deadline/reward/volunteers), detail instructions/safety/supplies/verification/activity, create mission/quest forms, accept, evidence upload, review/reject/reason/resubmit, dashboard queues and safe in-app notifications. Scope volunteers to their participation and reviewers to managed missions. Closed missions block acceptance; submitted evidence can still be reviewed after the deadline if submitted on time. Reject unsafe instructions/private public locations through the same moderation boundary. Publish approved contribution events; W2 consumes them for rewards.
- [ ] Run mission/auth/media tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: coordinate reviewed help missions and quests`.

### Task W2: Kibble wallet, immutable rewards and volunteer leaderboard

**Files:** Create `src/app/(dashboard)/dashboard/kibble/page.tsx`, `src/app/(public)/leaderboard/page.tsx`, `src/features/kibble/{types,schemas,ledger,service,reward-policy}.ts`, `src/features/kibble/{wallet,transaction-list}.tsx`, `src/features/leaderboard/{service,leaderboard,top-pawpals}.tsx`, `src/components/illustrations/leaderboard-pawpals.tsx`, `tests/unit/kibble/{awards,reversals,monthly,leaderboard}.test.ts`.

**Interfaces:** Implement `kibble.wallet/transactions/leaderboard`; produce server-only `awardContribution(contribution: Contribution): Promise<KibbleEntry>`, `reverseContribution(contributionId: Id, reason: string): Promise<KibbleEntry>`, `rankPawPals(entries: KibbleEntry[], period: 'month' | 'all', now: Date): LeaderboardEntry[]`. Uniqueness key is sourceKind/sourceId/userId/award-or-reversal. Wallet balance/earned/monthly totals derive from the ledger; ranking counts earned community points, not purchased points. Tie-break by verified contribution count, then stable user ID.

- [ ] Test `approved_mission_earns_exactly_once`, `pending_submission_earns_nothing`, `reversal_preserves_history`, `uses_manila_month_boundary`, and `paid_points_do_not_rank`:

```ts
expect(await totalAwardedFor(approvedMission.id)).toBe(30)
expect(await totalAwardedFor(unreviewedSighting.id)).toBe(0)
expect(await ledgerRowsFor(revokedContribution.id)).toHaveLength(2)
expect(monthFor('2026-10-31T16:00:00Z', 'Asia/Manila')).toBe('2026-11')
expect(rankWithPurchasedPoints).toEqual(rankWithoutPurchasedPoints)
```

- [ ] Run `npm run test:unit -- tests/unit/kibble`; expect missing ledger/ranking behavior.
- [ ] Implement +20 approved sighting, +8 approved feeding, +30 approved mission defaults, with +15 naming-win rows only as clearly seeded sample history. A contribution has one declared activity kind; one evidence submission cannot mint duplicate sighting/feeding awards accidentally. Connect S3/D3/W1 approvals and removals to transactional/idempotent awards/reversals. Implement balance/lifetime/month/contribution summaries, transaction descriptions, month/all-time leaderboard, top three, avatars/badges, pagination, current-user rank, and original flat hero illustration. No purchasing, spending, conversion, or cash-out UI is introduced.
- [ ] Run Kibble, mission, and moderation tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: reward verified help with accountable Kibble`.

### Task W3: Shelter/rescuer profiles and organization workspace

**Files:** Create `src/app/(public)/shelters/{page.tsx,loading.tsx,error.tsx}`, `src/app/(public)/shelters/[slug]/page.tsx`, `src/app/(dashboard)/dashboard/shelter/page.tsx`, `src/features/shelters/service.ts`, `src/features/shelters/{shelter-card,shelter-profile,shelter-workspace,volunteer-roster}.tsx`, `tests/unit/shelters/{public-profile,dashboard-scope,volunteers}.test.tsx`; extend F2's shelter types/schemas.

**Interfaces:** Implement `shelters.list/get/dashboard`. `ShelterProfile` contains public identity/logo/story, verification provenance, general area, adoptable animals, campaigns, public events, updates and intentionally public contact links. `ShelterDashboard` contains only the actor's organization: managed animal summaries, application counts, campaigns, missions, events and consenting volunteer records. The API aggregates existing services with organization filters.

- [ ] Test `organization_workspace_is_membership_scoped`, `public_profile_does_not_reveal_roster_contacts`, and `managed_sections_reference_canonical_records`:

```ts
await expect(otherOrg.shelters.dashboard(shelter.id)).rejects.toMatchObject({ status: 404 })
expect(workspace.animals.every(animal => animal.shelterId === shelter.id)).toBe(true)
expect(JSON.stringify(publicProfile)).not.toContain(volunteer.privateEmail)
expect(workspace.applications.count).toBe(await countOrgApplications(shelter.id))
```

- [ ] Run `npm run test:unit -- tests/unit/shelters`; expect missing profile/aggregation/scope behavior.
- [ ] Implement searchable organization list, full server-rendered profile and managed workspace. Use existing animal editor, A4 application queues, R4 fundraiser tools, W1 missions, W4 events and approved participation data for volunteer coordination. Actions navigate to concrete scoped routes instead of duplicate management implementations. Contact links use voluntarily published channels; no external message is automatically sent. Sample badges are explicit sample statuses, never inferred verification.
- [ ] Run shelter/auth/application projection tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: connect shelters rescuers and volunteer workspaces`.

### Task W4: Animal-welfare events, organizer management and RSVP

**Files:** Create `src/app/(public)/events/{page.tsx,loading.tsx,error.tsx}`, `src/app/(public)/events/[slug]/page.tsx`, `src/app/(dashboard)/dashboard/events/page.tsx`, `src/app/(dashboard)/dashboard/events/create/page.tsx`, `src/app/(dashboard)/dashboard/events/[id]/edit/page.tsx`, `src/features/events/{types,schemas,service,transitions}.ts`, `src/features/events/{event-card,event-detail,event-form,event-list,rsvp-button}.tsx`, `tests/unit/events/{schedule,rsvp,permissions,map-features}.test.ts`.

**Interfaces:** Implement `events.list/get/create/update/setRsvp`. `EventInput` contains type/title/story/cover/organizer/venue/start/end/timezone, optional capacity and publication state. Times persist as ISO instants with zone for display. `setRsvp` is unique per user/event and transactional against optional capacity. Only managed organizer roles can create/edit; public RSVP requires an actor.

- [ ] Test `repeat_rsvp_does_not_inflate_count`, `last_slot_has_one_winner`, `cancelled_or_started_event_rejects_new_rsvp`, and `public_venue_does_not_reveal_animal_homes`:

```ts
expect(afterRepeat.attendeeCount).toBe(before.attendeeCount + 1)
expect(await concurrentLastSlotSuccesses()).toBe(1)
await expect(rsvpToCancelled()).rejects.toMatchObject({ code: 'EVENT_UNAVAILABLE' })
expect(publicFeature.geometry).toEqual(event.publishedVenue)
expect(JSON.stringify(publicFeature)).not.toContain(animal.privateHomeAddress)
```

- [ ] Run `npm run test:unit -- tests/unit/events`; expect missing schedules/RSVP/permissions.
- [ ] Implement type/location/date filters, photo/organizer/venue/schedule/story/count detail, accessible RSVP and withdrawal before event start, capacity/full/cancelled/past states, organizer create/edit/cancel, in-app change notifications, and organization profile/map markers. Event types cover Libre Kapon, adoption day, vaccinations, feeding and fundraising. Attendee count is labeled RSVP count, not verified attendance. Mobile layout and form errors use existing controls.
- [ ] Run event/map/shelter tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: discover and coordinate local welfare events`.

## Package acceptance

- [ ] Accept → submit evidence → review → exactly one reward works for separate volunteers; invalid timing/reviews fail safely.
- [ ] Wallet and rankings agree with verified activity and Manila month boundaries; purchased points are excluded.
- [ ] Shelter tools enforce organization membership; event capacity/RSVP/visibility are consistent across detail, search and map.
