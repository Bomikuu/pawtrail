# Selectable people avatars

Source: the owner's attached `codex-clipboard-a2e6ec19-6a88-4465-986b-cda041c96151.png`, a 1536 × 1024 sheet containing 30 illustrated portraits. The owner requested their use as selectable people avatars. No external license or exclusive ownership is asserted.

The application ships 30 individually cropped, 192 × 192 WebP images at quality 76, approximately 151 KB combined. It does not ship the original sheet. Files use stable `avatar-01.webp` through `avatar-30.webp` names under `public/images/avatars`. Picker images load lazily and reserve their square dimensions. `src/features/users/avatar-presets.ts` owns stable IDs, descriptions and local image mappings.

People choose an illustration in **Dashboard → Profile → Choose your avatar**, then press **Save profile**. Preview/selection is local until the profile save succeeds. Selection persists through the existing profile update/repository flow. The shared avatar renderer is used by the account menu, sidebar, composer, posts, comments and public profiles. Existing identifiable people receive a stable illustrated default based on their record ID until they choose; anonymous attribution has no identifying avatar.

The server recognizes only catalog IDs (`pawtrail-avatar-01` through `pawtrail-avatar-30`) as curated images. Arbitrary uploaded photographs retain publication review. Replacing an outstanding avatar-photo review withdraws its obsolete photo association and advances its version; removed/rejected profile decisions remain intact. No illustration grants roles or verification.

No agents, automated tests, type/UI checks, builds, detector scans or browser verification were used for this change. Asset preparation and source formatting are not runtime verification.
