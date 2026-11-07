# Centered registration reference adaptation

The owner requested a registration screen similar to the supplied 6 November 2026 reference, centered without its left introduction or illustration. The route now uses a 768px maximum-width white card on the login screen's cream canvas, a centered wordmark, restrained headings, paired fields on wider screens, and a single field column on mobile.

The form includes the existing owner-supplied avatar catalog with four initial choices, a preview and an expandable full selection. Optional `avatarId` is validated against that catalog by the shared registration schema. Demo registration stores the resolved image with the new profile and returns it through the existing session projection. No upload control is offered before authentication, because the media service requires an authenticated actor.

The reference's account-type presentation retains community membership as the public registration role. Shelter/organization access is visibly unavailable and explained as assigned by the organization; submitting the form cannot grant organization roles. Community guidance expands inline. The existing single-step registration flow has no decorative multi-step indicator. Password visibility, field errors, safe return paths, submit feedback and honest demo labeling remain available.

Card, Input, Button, Avatar and RadioGroup compose the official shadcn components already installed through the CLI, documented in [the migration provenance](shadcn-tailwind-migration.md). No registry sources or stylesheets were changed. Shared form behavior was extracted to `use-auth-form.ts` so login and registration retain the same error handling and navigation behavior without importing each other's screen.

The optional backend field is documented in [the Django contract](../contracts/django-api.md). Source review only: no tests, automated type/UI/format/detector checks, builds, browser inspection or subagent review were performed under the current project instruction. The development preview was left running. Rendered quality and live backend conformance remain unverified.
