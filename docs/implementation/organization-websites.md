# Organization landing pages and Pixelcore Studio

## Ownership and scope

This feature lives in the social implementation worktree, not the standalone Phaser repository. PawTrail currently models rescue organizations through `social.Shelter`; it does not have a separate organization entity. Each shelter can own one independent landing website without replacing its profile. Existing owner/staff/admin permissions govern management.

The medical conversation owns animal record models, clinical UI and medical API changes. This feature does not change those modules. Its schema is in the separate `landing_pages` Django app. The scoped makemigrations command also generated `social/0006_animalmedicalrecord_animalmedicalrevision_and_more.py` from the other conversation's pending models; that generated file was left intact, and it was NOT applied by this task. Only `landing_pages` and its `website_builder` dependencies were migrated. Their dependencies stop at social/0005.

## Actual Studio integration

Inspected `/home/micxsz/projects/website-builder` and Pixelcore's existing Studio handoff. PawTrail embeds the existing shared `@sitebuilder/react` / `@sitebuilder/editor` editor and server renderer directly. It uses the actual `website_builder` Django revision/template/global-section/media services with PawTrail authorization hooks. There is no replacement editor and no cross-platform identity handoff needed for this embedded workspace. Pixelcore application source and Studio source were not modified.

Frontend packages are snapshots packed from the local Studio checkout into `vendor/pixelcore-studio/*.tgz`; package-lock records them. Backend `shared-website-builder` is currently an editable dependency on that checkout's Python package. Deployment must supply that dependency or replace the editable source with an internal distribution. Two self-hosted PawTrail fonts are registered through host-side extension modules; registry sources are unchanged.

## Routes and flow

- `/websites/templates`: public template discovery.
- `/websites/templates/{story,adoption,community}`: full responsive previews rendered through Studio's real SSR renderer, explicitly illustrative.
- `/dashboard/pages`: assigned shelter websites, existing draft/publication status and template selection.
- `/dashboard/pages/[website-id]`: full Studio workspace, guarded by the real account and backend scope.
- `/sites/[shelter-slug]`: server-rendered published page with SEO metadata, existing-profile action and host branding.
- Existing shelter workspace links to website management; existing shelter profile links to the website only after publication.

Selecting a template creates an immutable initial draft. Studio supports its existing editing, responsive preview, draft saves, revision history and explicit publication. Expected-version conflicts protect updates. Unpublish preserves the draft and revisions. Public rendering reads the published revision only and requires the shelter profile itself to be public. Unpublished/missing pages return 404.

The three templates seed actual shelter name/description, a permitted public photo or PawTrail companion illustration, and real profile links. They do not fabricate testimonials, impact totals, donation collection or animal availability. Preview CTA links stay within the preview. No medical details, exact addresses, applicant information or staff data are bound to the editor.

## Media and permissions

The same-origin BFF uses the real encrypted account session and refresh path. Django rechecks every site operation against the shelter owner/staff/admin. A forged site ID cannot access another tenant's templates, revisions or media. Raster uploads use Studio's existing bounded conversion, removing EXIF. New images remain private until referenced in a currently published document; public documents return only referenced assets. Unpublish removes their public access. Dedicated review-sharing routes are intentionally unavailable; use the editor preview until PawTrail has its own review-link surface.

## Development and concurrent work

The existing 8002 process was not restarted. A separate development URL surface at `127.0.0.1:8003`, using `landing_pages.local_settings`, shares the exact database/auth/storage configuration. `PAWTRAIL_LANDING_API_BASE_URL` can override it; production defaults to the configured Django API. The normal backend also registers the landing routes on its next restart. The local API log is `/tmp/pawtrail-landing-pages.log`. No broad game synchronization was used.

## Validation

Jev ran successfully and selected the shared Studio engine with server-scoped permissions. Graphify traced the existing Studio host/React/Django boundaries. UI UX Pro's initial generic query was unsuitable; its nonprofit result was used with the established PawTrail fonts/palette. Impeccable context launcher was unavailable (permission denied), so existing product/design sources and craft floor were read directly.

UI boundary check passed. Scoped TypeScript diagnostics for the new landing modules/routes: zero. Django model check: no issues. Migration applied. API probes confirmed unauthenticated management = 401 and an unavailable public page = 404. Firefox rendered template discovery and the actual SSR template on desktop and phone, with no console errors. Screenshots are in `output/playwright/landing-templates-desktop.png`, `landing-story-desktop.png`, `landing-story-mobile.png`.

Signed-in create/save/upload/publish/unpublish was NOT exercised using an actual shelter manager account. No production builds or automated tests were run. Those permissioned flows are implemented but are not claimed as end-to-end verified.
