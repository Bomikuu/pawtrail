# PawTrail agent guidance

- Use the `jev-cli` and `graphify` skills. Submit no secrets or private records to Jev; verify its judgments directly.
- This is a standalone project. Do not modify PixelCore or `/home/bomiku1/projects/dineEase-web` while implementing it.
- Read `PRODUCT.md`, the architecture spec, the master plan, and the selected work package before implementation.
- Use automated tests and scoped automated checks for frontend and backend-facing changes. Documentation-only work needs document checks, not application tests.
- Do not run production builds unless the user explicitly requests them. Do not run visual tests, browser-based visual inspections, or manual verification unless explicitly requested.
- Run `npm run check:ui` after frontend changes once that command exists. The canonical Shadcn layer is `src/components/ui`. Feature components and routes must not contain raw button, input, select, textarea, or table primitives.
- Use `ButtonLink` for Next.js links styled as actions and `ButtonAnchor` for external/document actions. Ordinary navigation remains a semantic Next.js Link or anchor.
- Frontend TypeScript and JavaScript use no semicolons. Public profile content remains server-rendered.
- Keep sample data, sample verification, mock authentication, and donation demonstrations clearly labeled. No real payment processing belongs in the initial implementation.
- Do not commit credentials, uploads, demo session stores, or applicant records. New branches use `codex/`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
