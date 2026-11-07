# Dashboard navigation investigation — 6 November 2026

The owner reported 10+ second dashboard transitions, including repeat visits. Investigation used source inspection, the running development server's trace, direct local HTTP timings, and isolated sample-session data. The existing development server was kept running.

## Confirmed unnecessary work

`createMockApi` installs community and moderation services for every API instance. Both service constructors eagerly cloned their input and ran `applySamplePack` for an anonymous draft, including when a session repository was supplied. Repository-backed reads never used those anonymous drafts. Sample generation includes applications, activities, contributions, achievements and reward calculations for the sample members, so even a small session response paid for unrelated setup twice.

Server API creation was also repeated within the same React render. The root layout, dashboard session guard and page's `privateApi` helper each call `getServerApi`; profile additionally calls it through `publicArea`. Each invocation opened/read the demo repository and constructed the entire adapter. Those components also repeated session reads. Background header queries create further API instances through the BFF, amplifying the synchronous setup work when requests overlap.

The navigation provider follows a React transition and the router request. No deliberate 10-second wait was found in this navigation path; its page-arrival animation is 180ms.

## Changes

- Community and moderation services now construct their anonymous sample draft only on the first actual anonymous read. Repository-backed reads bypass that work entirely. Anonymous sample behavior remains available.
- `getServerApi` now uses React's request-scoped `cache`, sharing one adapter across components in a server render.
- The returned adapter's session read is also memoized within that render. This reduces repeated identity reads in demo mode and repeated session HTTP calls in real mode. BFF handlers still create their own request context.

These changes do not store an API or identity in a process-wide cache. Every new render request gets a separate scope; cookie writes, mutations and logout remain in the existing route handlers. The installed Next.js fetching-data guide explicitly documents `React.cache` as scoped to one request with no sharing between requests.

Changed implementation: `src/features/community/service.ts`, `src/features/moderation/service.ts`, and `src/lib/api/server.ts`.

## Measurements

Requests ran against the existing `next dev` server at `http://127.0.0.1:3000`. Each sequence initialized its own isolated `user-6` sample session, visited all routes once, then repeated them. Values below are the second pass's complete response time, including streamed body completion. Every listed request returned HTTP 200.

| Request | Before | After final changes |
| --- | ---: | ---: |
| `/api/v1/auth/session` | 1,281ms | 357ms |
| `/dashboard/settings` | 3,524ms | 339ms |
| `/dashboard/profile` | 3,168ms | 343ms |
| `/dashboard/animals` | 2,257ms | 284ms |

Before the changes, the first measured profile request took 6,880ms. After the final code change, the first measured settings request took 764ms and the second took 339ms. These are observed samples from a development process, not percentiles, a production SLA, or timings of browser click-to-paint.

A separate temporary-data probe measured persisted repository reads at 30–43ms and snapshot construction at 14–16ms. Generating a fresh sample snapshot initially took 470ms; subsequent snapshots with the initialized workflow took 11–18ms. Repeated dataset reads are additional overhead, but these measurements do not support blaming disk/network distance alone for multi-second responses.

## Development overhead and limits

The existing Next development trace includes a 13,131ms `/api/v1/me/kibble` request and route-compilation spans as high as 20,633ms. These are separate spans, not numbers to sum for one click. During investigation, the long-running Next process held approximately 4.1GiB resident memory and 1.3GiB swapped memory; the machine's 4GiB swap was essentially full. Development compilation and memory pressure can therefore contribute to local spikes, in addition to the confirmed application work removed here. Their individual effect was not isolated by restarting the server or changing the machine.

The exact 10+ second delay was not reproduced on every directly requested route. Warm page responses improved materially after the changes, but browser transition/paint timings were not measured. No production build, production server, real Django endpoint, browser automation, unit-test suite, type/UI/format/detector checks, or dependency changes were run for this investigation. Direct HTTP timing was the scoped diagnostic requested by the owner. Production behavior remains unbenchmarked; development compilation is not part of normal production route serving.

Historical Graphify foundation references were consulted for `getServerApi` and `createMockApi`, then checked against current source because the graph predates the sample-pack additions. No graph extraction tokens were spent for this investigation (historical graph reports 0 input / 0 output extraction tokens). Current runtime measurements, rather than the old graph, support the performance findings.
