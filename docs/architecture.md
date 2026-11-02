# PawTrail architecture

Next.js App Router renders public identities and stories on the server. The canonical controls live in `src/components/ui`. The approved orange/cream community journal uses Nunito and Inter, with a compact navigation column and mobile bottom navigation. New public route modules remain Server Components. Forms, gestures, maps and charts are client islands.

`PawTrailApi` is the shared domain boundary. `createApiClient` supplies the same typed route/schema mapping to the browser transport and the Django transport. Browser requests stay on `/api/v1`; the allowlisted BFF validates inputs and output DTOs and enforces same-origin writes. No feature component calls a remote backend directly.

The mock adapter installs social, discovery, account, adoption, fundraising, mission, event, moderation, media and authentication services. The filesystem repository serializes commands, validates JSON and atomically replaces each cookie-isolated overlay. Actor-scoped idempotency receipts prevent duplicate side effects. Request-scoped repository wrappers reject writes after an account switch. Optional workflow state stores private preferences, interests, applications and histories, campaign drafts, expense receipt associations and private sighting coordinates. These records never join public projections.

Public data uses allowlists and current moderation state. Exact sighting coordinates remain in private workflow state; public locations come from configured approximate areas. Applicant answers and draft content stay in owner/organization scopes. Hidden profiles, anonymous contributions and withdrawn records are filtered from public activity, search and leaderboards. Verification is a separate evidence-backed moderator decision, with creator/organization conflicts excluded.

Campaign support is strictly simulated. Totals derive from contribution entries. Expenses are append-only; a correction supersedes its referenced entry without deleting history. Private receipts are exposed only in the organizer workspace. Photo updates reuse the reviewed community-post publication path, so pending or withdrawn photo updates never appear in public campaign history.

Mission participation, review state, in-app notifications and Kibble changes commit in one repository transaction. Rewards are unique per participation and action. Reversal appends a negative ledger entry. Wallets and ranking read the ledger; level is one plus each complete 100 net earned Kibble. Helping Paw requires an approved mission contribution. Kibble cannot be purchased or cashed out.

Successful mutations revalidate the application layout, invalidate client data and refresh server views. The session provider remounts the query scope and clears private observers on identity changes. Maps/marker clustering and Recharts are imported only in their lazy feature islands; Motion is confined to the adoption deck and respects reduced motion.

The default persistence is a single-process local demonstration. A production Django service, persistent shared storage, background jobs, real organization verification, external messaging and real payment processing are separate infrastructure. The real adapter has been implemented against a proposed contract; live conformance has not been established.
