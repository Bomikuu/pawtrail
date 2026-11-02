# PawTrail Adoption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver responsible adoption discovery from optional preferences and interest through private applications and shelter decisions.

**Architecture:** Consume foundation, public animal profiles, private workspace and scoped organization permissions. Interest, compatibility, applications, decisions, and finalized adoption are distinct concepts; this package stops at approved next steps.

**Tech Stack:** Next.js, RHF/Zod, TanStack Query, Shadcn, Motion, Vitest/Testing Library.

**Spec:** [Architecture specification](../specs/2026-11-02-pawtrail-design.md), §§4–8; [master plan](2026-11-02-pawtrail-implementation.md).

## Global Constraints

No semicolons or feature-level raw controls; run UI check after UI edits. No production builds or visual/manual checks without explicit request. Applications stay private/server-side. Compatibility uses illustrative weights 20/20/20/15/15/10 and is never a guarantee. Demo clock `2026-11-02T00:00:00+08:00`; mock actions are labeled.

## Review Focus

A1 covers skipped preference dimensions; A2 covers repeated interest and unavailable animals; A3 covers duplicate submit/refresh/privacy; A4 covers cross-shelter access, stale reviews, and animals no longer available.

### Task A1: Optional preferences and explainable compatibility

**Files:** Create `src/app/(public)/adopt/preferences/page.tsx`, `src/features/adoption/{types,schemas,compatibility,service}.ts`, `src/features/adoption/{preferences-form,compatibility-explanation}.tsx`, `tests/unit/adoption/{compatibility,preferences}.test.tsx`.

**Interfaces:** Implement `adoption.preferences/savePreferences`; produce `scoreCompatibility(animal: AdoptionCandidate, preferences: AdoptionPreferences): CompatibilityResult`. Preferences cover species, age, size, home, experience, other pets, activity, personality, travel distance; all are optional. Result is `{ score: number | null, components: CompatibilityComponent[], explanations: string[], advisories: string[] }`. Each answered scoring component is 0–1; divide the weighted total by the sum of answered weights, then round to an integer percentage. Age/size/personality refine the relevant rule or filter; do not silently add weights.

- [ ] Test `scores_only_answered_dimensions`, `all_skipped_has_no_score`, and `provides_evidence_for_each_component`:

```ts
expect(scoreCompatibility(pet, {}).score).toBeNull()
expect(scoreCompatibility(pet, { species: pet.species }).score).toBe(100)
expect(weights).toEqual({ species: 20, home: 20, lifestyle: 20, experience: 15, otherPets: 15, distance: 10 })
expect(result.components.every(component => component.explanation.length > 0)).toBe(true)
```

- [ ] Run `npm run test:unit -- tests/unit/adoption/compatibility.test.tsx tests/unit/adoption/preferences.test.tsx`; expect missing rules/forms.
- [ ] Implement preference persistence, skip/reset flow, explicit scoring rules, filter serialization and short explanations. Missing pet information yields an unanswered dimension instead of guessed compatibility. Flag known incompatibilities and unknowns; avoid presenting a high score as permission to adopt. Implement the existing rules table in `docs/contracts/adoption-compatibility.md` and extend its representative input/output cases only when the rule behavior is deliberately changed.
- [ ] Run tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: add optional adoption preferences and explanations`.

### Task A2: Swipe discovery, accessible buttons and interested list

**Files:** Create `src/app/(public)/adopt/{page.tsx,loading.tsx,error.tsx}`, `src/app/(public)/adopt/interested/page.tsx`, `src/features/adoption/{discovery-deck,adoption-card,adoption-actions,interested-list}.tsx`, `src/features/adoption/{deck-controller,queries,mutations}.ts`, `tests/unit/adoption/{deck,interest,accessibility}.test.tsx`.

**Interfaces:** Implement `adoption.discover/setInterest/interested`; produce `advanceDeck(action: 'pass' | 'interested', current: DeckState): DeckState`. Interested is a unique user/animal relationship, not an application. Swipe up navigates to `/pets/[slug]`; pass/right interest have equivalent labeled buttons. Pointer capture and gesture handling may not prevent ordinary vertical scrolling outside the active deck.

- [ ] Write `buttons_and_swipes_have_identical_effects`, `interest_is_idempotent`, and `failed_interest_does_not_lose_current_card`:

```ts
expect(buttonActionState).toEqual(swipeActionState)
expect(interested.items.filter(a => a.id === pet.id)).toHaveLength(1)
expect(await applicationCountFor(pet.id)).toBe(0)
expect(stateAfterFailedInterest.currentId).toBe(pet.id)
expect(screen.getByRole('button', { name: 'Interested' })).toBeEnabled()
```

- [ ] Run `npm run test:unit -- tests/unit/adoption/deck.test.tsx tests/unit/adoption/interest.test.tsx tests/unit/adoption/accessibility.test.tsx`; expect missing deck/interest behavior.
- [ ] Implement large photo/name/age/species/gender/location/traits/rescuer/availability cards, restrained reduced-motion-aware transitions, pointer and keyboard controls, preferences entry, interest confirmation, profile/application links, saved interests, pass session state, exhausted/filtered/failed states and recovery. Recheck current availability before creating interest/application; unavailable pets get a truthful notice and next option.
- [ ] Run tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: add accessible adoption discovery and interests`.

### Task A3: Private multi-step applications and applicant tracking

**Files:** Create `src/app/(public)/adopt/applications/page.tsx`, `src/app/(public)/adopt/applications/new/page.tsx`, `src/app/(public)/adopt/applications/[id]/page.tsx`, `src/features/adoption/{application-wizard,application-review-step,application-list,application-detail}.tsx`, `src/features/adoption/{application-service,application-transitions}.ts`, `tests/unit/adoption/{application-validation,application-privacy,application-persistence}.test.ts`.

**Interfaces:** Implement `adoption.saveDraft/apply/applications/application/withdraw/resubmit` exactly as spec §5. `AdoptionApplicationInput` contains animalId, basic applicant contact, living situation, care experience, motivation and policy agreement. `ApplicationFilters` supports actor-owned or organization-managed lists, animalId/status, paging. Applicant detail is distinct from public summary. `AdoptionApplicationDraft` contains id, animalId, version and partially completed answers; find existing drafts through actor-scoped `applications({ status: 'draft', animalId })`, then resume with `application(id)`. Private draft/resubmission endpoints use the same permission and version checks as submitted applications.

- [ ] Test `step_validation_blocks_incomplete_submission`, `draft_survives_reload_without_browser_storage`, and `duplicate_application_is_not_created`:

```ts
expect(applicationSchema.safeParse({ ...validInput, agreement: false }).success).toBe(false)
expect(await reopenedDraft()).toMatchObject({ animalId: pet.id, motivation: validInput.motivation })
expect(repeatedSubmit.id).toBe(firstSubmit.id)
await expect(outsider.adoption.application(firstSubmit.id)).rejects.toMatchObject({ status: 404 })
expect(JSON.stringify(await publicApi.animals.get(pet.slug))).not.toContain(validInput.email)
```

- [ ] Run `npm run test:unit -- tests/unit/adoption/application-validation.test.ts tests/unit/adoption/application-privacy.test.ts tests/unit/adoption/application-persistence.test.ts`; expect missing application persistence/privacy behavior.
- [ ] Implement step progress/back/next/review, saved server-side drafts, necessary fields only, policy agreement, duplicate-click protection/idempotency, application list/detail and withdrawal. Existing submitted active application for the same applicant/animal returns the existing record with guidance. Drafts are editable only by the applicant; submitted answers are versioned and only resubmitted when more information is requested. Public sharing links never include answers or contact details. Notify the responsible shelter in-app; do not claim an external message was sent.
- [ ] Run these tests, auth and public-projection tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: support private adoption applications and status tracking`.

### Task A4: Shelter review, requests for information and decisions

**Files:** Create `src/app/(dashboard)/dashboard/shelter/applications/page.tsx`, `src/app/(dashboard)/dashboard/shelter/applications/[id]/page.tsx`, `src/features/adoption/{shelter-application-queue,shelter-application-review,status-history}.tsx`, `tests/unit/adoption/{shelter-permissions,application-transitions,review-conflicts}.test.ts`.

**Interfaces:** Implement `adoption.review`; `ApplicationReviewInput = { expectedVersion: number, decision: 'needs_information' | 'approved' | 'rejected', message: string }`. `transitionApplication(current, command, actor): AdoptionApplication` checks current status, actor organization, current animal availability, expected version, and allowed transition. Applicant resubmission/withdrawal use A3 methods. No decision marks an animal adopted automatically.

- [ ] Test `only_responsible_shelter_can_read_or_decide`, `stale_decision_is_conflict`, and `approval_does_not_finalize_adoption`:

```ts
await expect(otherShelter.adoption.review(id, decision)).rejects.toMatchObject({ status: 404 })
await expect(reviewWithOldVersion()).rejects.toMatchObject({ code: 'CONFLICT' })
expect(approved.status).toBe('approved')
expect((await api.animals.get(pet.slug)).status).not.toBe('adopted')
expect(history.map(entry => entry.to)).toEqual(['submitted', 'needs_information', 'submitted', 'approved'])
```

- [ ] Run `npm run test:unit -- tests/unit/adoption/shelter-permissions.test.ts tests/unit/adoption/application-transitions.test.ts tests/unit/adoption/review-conflicts.test.ts`; expect missing reviews/transitions.
- [ ] Implement scoped queues, applicant responses, request-info flow, applicant response/resubmission, approve/reject confirmation, decision audit trail and owner-scoped notifications. Closed/withdrawn/rejected applications cannot receive invalid transitions. Recheck animal availability at review time and show a conflict instead of approving an unavailable animal. Responsible adoption next steps are explicit sample guidance, not an executed transfer.
- [ ] Run the entire adoption test directory once, typecheck, UI check; expect pass.
- [ ] Commit `feat: add responsible shelter application review`.

## Package acceptance

- [ ] Preferences → discovery → interest → draft → application → request info/resubmit → decision works across a refresh.
- [ ] Button alternatives work without gestures. Skipped preferences do not fabricate a score.
- [ ] Unrelated actors cannot read answers; interest/approval do not finalize adoption.
