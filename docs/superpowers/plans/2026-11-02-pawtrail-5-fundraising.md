# PawTrail Fundraising Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver complete animal-welfare campaign discovery, transparent detail, explicitly simulated contributions, creation/review, and organizer management.

**Architecture:** Consume foundation, animal/Horde links, moderation, media, and account services. Campaign totals and public supporter projections derive from an append-only demo ledger; real-mode payment actions are disabled pending a separate integration.

**Tech Stack:** Next.js, TanStack Query, RHF/Zod, Shadcn, Recharts, Vitest/Testing Library.

**Spec:** [Architecture specification](../specs/2026-11-02-pawtrail-design.md), §§4–8; [master plan](2026-11-02-pawtrail-implementation.md).

## Global Constraints

No semicolons/raw feature controls; run UI check after UI edits. No builds or visual/manual verification without explicit request. Money is PHP integer centavos; demo presets are ₱100/₱250/₱500/₱1,000, minimum ₱1.00. No real-money processing, fictional verification, erased ledger history, public private evidence, or revealed anonymous identity. Demo clock `2026-11-02T00:00:00+08:00`.

## Review Focus

R1 tests zero/overfunded/closed progress and server projections; R2 tests numeric abuse, duplicate contributions and anonymity; R3 tests review/verification boundaries and private supporting files; R4 tests append-only expenses, scope and balance correctness.

### Task R1: Campaign discovery, detail and transparent summaries

**Files:** Create `src/app/(public)/fundraisers/{page.tsx,loading.tsx,error.tsx}`, `src/app/(public)/fundraisers/[slug]/page.tsx`, `src/features/fundraising/{types,schemas,service,filters,totals}.ts`, `src/features/fundraising/{campaign-card,campaign-grid,campaign-story,donation-summary,expense-breakdown,campaign-updates,supporter-list}.tsx`, `tests/unit/fundraising/{discovery,totals,public-detail}.test.tsx`.

**Interfaces:** Implement `fundraisers.list/get/supporters`; produce `calculateCampaignTotals(entries: CampaignLedgerEntry[], target: MoneyMinor): CampaignTotals`. Totals contain raised, target, spent, available, remaining, rawPercent and displayPercent. Clamp only the visual bar to 0–100; retain actual raised/percentage and show overfunding truthfully. Expense estimates and recorded spending are separate.

- [ ] Test `renders_sample_campaign_and_transparency`, `filters_categories_and_sort_stably`, and `handles_overfunding_without_corrupting_totals`:

```ts
expect(mochiTotals).toMatchObject({ raised: 1250000, target: 2000000, rawPercent: 62.5 })
expect(overfunded.displayPercent).toBe(100)
expect(overfunded.rawPercent).toBeGreaterThan(100)
expect(overfunded.remaining).toBe(0)
expect(JSON.stringify(publicCampaign)).not.toContain(privateReceipt.storagePath)
```

- [ ] Run `npm run test:unit -- tests/unit/fundraising/discovery.test.tsx tests/unit/fundraising/totals.test.tsx tests/unit/fundraising/public-detail.test.tsx`; expect missing discovery/totals/detail.
- [ ] Implement all five categories, urgency/nearly-funded/new/nearby/completed filters, sorts, photo/title/location/organizer/category/progress/supporter/status cards, server-rendered details, gallery/story/animal/group references/updates, sticky contribution summary and share, expense breakdown and public redacted evidence only. Expose totals, recorded spending, sample balance, and honest demo/no-payout status. Display sample verification only when the fixture explicitly has that status.
- [ ] Run tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: add transparent fundraising discovery and campaign pages`.

### Task R2: Strictly simulated contributions and anonymous supporter views

**Files:** Create `src/features/fundraising/{donation-dialog,donation-review,donation-result}.tsx`, `src/features/fundraising/{money-input,donation-service,ledger,public-supporter}.ts`, `tests/unit/fundraising/{money,donation-idempotency,anonymity,donation-dialog}.test.tsx`. Modify campaign totals and notifications.

**Interfaces:** Implement `fundraisers.simulateDonation`; produce `parsePHPAmount(input: string): MoneyMinor`, `toPublicSupporter(contribution: DemoContribution): PublicSupporter`. `DemoDonationInput` contains amountMinor, optional message, anonymous flag and idempotency key (RequestOptions); `DemoContribution` contains demo-only status and timestamps, never a real payment/provider reference.

- [ ] Test `rejects_invalid_amounts`, `records_one_demo_contribution_for_retries`, `hides_identity_in_every_public_view`, and `real_mode_cannot_simulate_payment`:

```ts
expect(parsePHPAmount('250.50')).toBe(25050)
for (const input of ['NaN', 'Infinity', '-1', '0.001', '1e9']) expect(() => parsePHPAmount(input)).toThrow()
expect(secondAttempt.id).toBe(firstAttempt.id)
expect(publicSupporter.displayName).toBe('Anonymous PawPal')
expect(JSON.stringify(publicSupporter)).not.toContain(donor.username)
await expect(realApi.fundraisers.simulateDonation(id, input)).rejects.toMatchObject({ code: 'DEMO_ONLY' })
```

- [ ] Run `npm run test:unit -- tests/unit/fundraising/money.test.tsx tests/unit/fundraising/donation-idempotency.test.tsx tests/unit/fundraising/anonymity.test.tsx tests/unit/fundraising/donation-dialog.test.tsx`; expect missing money/ledger/privacy behavior.
- [ ] Implement presets/custom amount/message/anonymity, confirmation summary, idempotent ledger write, and the exact result copy “Demo contribution recorded — no money was transferred.” Do not collect card/bank/GCash credentials or create a “payment successful” screen. In mock mode update illustrative totals/supporter count and profile/dashboard links in one transaction. Anonymity applies to supporter messages, helper walls, feed updates, notifications visible to other users, and public metadata. Reuse strict money parsing for goals/expenses. In real mode show the unavailable integration state, with no fake contribution mutation.
- [ ] Run these tests and totals/projection tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: add honest demo contributions and anonymous support`.

### Task R3: Campaign wizard, private evidence and publication review

**Files:** Create `src/app/(public)/fundraisers/create/page.tsx`, `src/features/fundraising/{campaign-wizard,campaign-type-step,campaign-details-step,campaign-budget-step,campaign-evidence-step,campaign-review-step}.tsx`, `src/features/fundraising/{campaign-transitions,draft-service}.ts`, `tests/unit/fundraising/{wizard,review-states,evidence-access,draft}.test.tsx`.

**Interfaces:** Implement `fundraisers.drafts/draft/saveDraft/create` exactly as spec §5. `CampaignDraft` contains id/version and partially completed wizard fields; list/resume endpoints are owner-only and include authorized evidence references. `CampaignInput` includes category/title/story, cover/gallery IDs, animalId or hordeId when linked, beneficiary/organizer/area, positive goal, itemized estimates, expected timeline, private evidence IDs. The service assigns creator/organization/review status. Moderator decisions use S3 review API with an explicit campaign subject.

- [ ] Test `requires_valid_budget_and_beneficiary`, `persists_each_step_privately`, and `publish_does_not_imply_verification`:

```ts
expect(created.status).toBe('pending_review')
expect(created.verification.status).toBe('unverified')
expect(sumEstimates(input.expenses)).toBe(input.goalMinor)
await expect(publicApi.fundraisers.get(created.slug)).rejects.toMatchObject({ status: 404 })
await expect(otherOrganizerReadEvidence()).rejects.toMatchObject({ status: 404 })
```

- [ ] Run `npm run test:unit -- tests/unit/fundraising/wizard.test.tsx tests/unit/fundraising/review-states.test.tsx tests/unit/fundraising/evidence-access.test.tsx tests/unit/fundraising/draft.test.tsx`; expect missing wizard/state/access behavior.
- [ ] Implement five steps from the brief, image previews, itemized estimates summing to the goal, data-minimized evidence, private draft resume, review preview and submit. Submission enters pending_review and blocks support until activation; approval and verification are separate audited decisions. Preserve rejected-review reasons and permit a revised resubmission. Redaction is an explicit organizer/reviewer operation that creates a public-safe evidence asset; never expose original PDFs or identity/banking fields by merely hiding a link.
- [ ] Run tests, moderation tests, typecheck, UI check; expect pass.
- [ ] Commit `feat: support reviewed fundraiser creation and evidence`.

### Task R4: Organizer workspace, campaign updates and append-only expenses

**Files:** Create `src/app/(dashboard)/dashboard/fundraisers/page.tsx`, `src/app/(dashboard)/dashboard/fundraisers/[id]/page.tsx`, `src/features/fundraising/{organizer-dashboard,campaign-editor,update-form,expense-form,ledger-table,supporter-history}.tsx`, `tests/unit/fundraising/{organizer-permissions,ledger-history,closure,summary}.test.ts`.

**Interfaces:** Implement `fundraisers.dashboard/update/addUpdate/addExpense/close`. `ExpenseInput` includes amountMinor, description, incurredAt, private receipt IDs, optional correctingEntryId. Updates to campaigns permit title/story/images/timeline within review policy. Goal and beneficiary become immutable once active or supported; attempted changes return `IMMUTABLE_CAMPAIGN_FIELD`. No API deletes financial ledger entries. A changed funding purpose requires a new reviewed campaign rather than silently rewriting the supported one.

- [ ] Test `cannot_edit_other_organizers_campaign`, `corrections_preserve_original_history`, `close_prevents_new_demo_contributions`, and `summary_uses_full_ledger_not_current_page`:

```ts
await expect(otherActor.fundraisers.addExpense(id, expense)).rejects.toMatchObject({ status: 403 })
expect(corrected.entries.map(entry => entry.id)).toEqual(expect.arrayContaining([original.id, correction.id]))
expect(corrected.availableMinor).toBe(corrected.raisedMinor - corrected.spentMinor)
await expect(api.fundraisers.simulateDonation(closed.id, input)).rejects.toMatchObject({ code: 'CAMPAIGN_CLOSED' })
expect(dashboard.totalRaisedMinor).toBe(sumAllCampaignLedgers())
```

- [ ] Run `npm run test:unit -- tests/unit/fundraising/organizer-permissions.test.ts tests/unit/fundraising/ledger-history.test.ts tests/unit/fundraising/closure.test.ts tests/unit/fundraising/summary.test.ts`; expect missing management/ledger rules.
- [ ] Implement active/raised/supporter/completed summaries, managed campaign cards, permitted edits, dated updates with photos, expense/receipt upload, immutable corrections, supporter paging, milestone updates, closure confirmation and audit trail. Reject negative available balances or make an explicitly reviewed correction state; never silently alter previous entries. Recharts may summarize genuine sample ledger trends with table alternatives, not decorative invented analytics. Keep payout text truthful: no real disbursement occurred.
- [ ] Run the fundraising test directory once, typecheck, UI check; expect pass.
- [ ] Commit `feat: add transparent fundraiser organizer tools`.

## Package acceptance

- [ ] Create → private draft → review → active sample campaign → simulated contribution → organizer update/expense → closure works with refresh persistence.
- [ ] Anonymity holds across every public projection, all money uses integer centavos, and repeated submissions do not duplicate totals.
- [ ] No real payment, payout, or verified identity is claimed without the corresponding integration/evidence.
