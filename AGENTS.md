# PawTrail agent guidance

- Current user override: implement directly in the main session, without subagents. Do not author or run automated tests, type/UI/format/detector checks, builds, or browser verification unless the user requests them. Source review is permitted. Keep the user's development preview running.

- Use the `jev-cli` and `graphify` skills. Submit no secrets or private records to Jev; verify its judgments directly.
- This is a standalone project. Do not modify PixelCore or `/home/bomiku1/projects/dineEase-web` while implementing it.
- Read `PRODUCT.md`, the architecture spec, the master plan, and the selected work package before implementation.
- Use automated tests and scoped automated checks for frontend and backend-facing changes. Documentation-only work needs document checks, not application tests.
- Do not run production builds unless the user explicitly requests them. Do not run visual tests, browser-based visual inspections, or manual verification unless explicitly requested.
- When verification is authorized, run `npm run check:ui` after frontend changes. The canonical shadcn/ui layer is `src/components/ui`, populated from the official registry through the shadcn CLI. Do not replace those sources with hand-written lookalikes. Feature components and routes must not contain raw button, input, select, textarea, or table primitives.
- Use Tailwind utilities for ordinary layout, spacing, typography, colors, borders, responsive behavior, and interaction states. CSS is reserved for theme/font setup, browser-specific rules, and authored animation keyframes. Product behavior belongs in composed shared/feature components rather than custom primitive implementations.
- Typography: use self-hosted Saira Condensed for primary headings, names and world labels, and Instrument Sans for secondary body text, controls and dialogue. Preserve these font-token roles across the platform, management dashboard and game.
- Use `ButtonLink` for Next.js links styled as actions and `ButtonAnchor` for external/document actions. Ordinary navigation remains a semantic Next.js Link or anchor.
- Frontend TypeScript and JavaScript use no semicolons. Public profile content remains server-rendered.
- The owner now authorizes database fixtures without repeated visible Sample tags. Keep internal fixture/seed provenance, never turn fixtures into identity references or verified Kibble, and never treat unpaid pledges as collected money.
- Do not commit credentials, uploads, demo session stores, or applicant records. New branches use `codex/`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

- Live data is database-only, with authorized fixtures populated through `backend/social/management/commands/seed_community.py`. Keep current/default real API mode, internal seed keys and no browser fixture fallback. The social domains live in `backend/social`; identity/calibration evidence remains separate. Full platform pages use the Django API adapter; do not restore the retired unavailable-state guards.
