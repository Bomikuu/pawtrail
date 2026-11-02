# Release handoff

The local preview is for the owner to try. Production readiness has not been certified.

- [ ] Owner requests and reviews automated validation on the final tree.
- [ ] Resolve any type, UI, behavior or integration failures that validation finds.
- [ ] Owner reviews desktop/mobile appearance, gestures, focus and long/error/empty states.
- [ ] Owner approves final brand artwork and provides real community content and photos.
- [ ] Configure restricted Google Maps browser key and verify allowed domains/APIs.
- [ ] Implement/connect the Django backend and complete object-permission, pagination, media and session conformance.
- [ ] Choose a shared production store/session strategy, HTTPS and operational retention policy.
- [ ] Configure real public indexing only for verified public real content; sample/demo pages stay noindex.
- [ ] Review an explicit deployment target before publishing. No deployment has been performed.

Optional validation commands, only when explicitly requested: `npm run typecheck`, `npm run check:ui`, `npm run format:check`, and `npm run test:unit`. No production build is part of routine verification. The manual CI workflow has no push/PR/schedule trigger and runs only with its explicit validation flag.
