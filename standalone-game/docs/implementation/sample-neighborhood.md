# Sample map neighborhood

The community map now includes **eight sample homes and four sample shelters**, arranged around Poblacion, Matina, and Buhangin so that the initial map zoom forms several nearby clusters. The **Show demo homes & shelters** switch is on by default; sample labels and fictional-location descriptions remain visible. Public shelter records and permitted member homes still load separately.

## Try it

1. Open `/play?map=community`, or use Explore places.
2. Click a numbered cluster to zoom in and list its members.
3. Select a pin or place in the list to open its preview.
4. Use Enter home / Enter care space. Demo places open `/play?home=system%3Amap-demo%3A…&demo=1` and create a local demo visitor session without requiring a platform login.
5. Walk around, select a demo cat, and try petting, feeding, water, or play. Use Places to return to the map. Different rooms retain their own virtual care and guestbook state.

The eight homes have different hosts, floor/wall finishes, and pairs of demo cats. The four shelters have care-oriented furniture and three demo cats each. **28 fictional cats** are seeded. Room capacity and occupancy come from the existing service; no fake visitors or online counts are created. All rooms are public within the sample realm and reuse the existing permission, proximity, cooldown, and live-room rules.

## Identity and data

- Canonical fixture: `public/pawtrail-game/maps/community-demo.json`.
- Idempotent seeding: `backend/housing/demo_neighborhood.py`.
- Hosts use the reserved `system:map-demo:` namespace and cannot be impersonated through guest entry.
- The explicit `?demo=1` session branch requires both a development Next server and mock API mode. Django also requires DEBUG for these guest samples. It issues a server-signed assertion for a generated demo visitor, never a caller-supplied member ID.
- A separate HttpOnly, SameSite=Strict demo cookie keeps the visitor stable for local use; it does not replace platform authentication. Short-lived account assertions and opaque session tokens use the existing Homes bridge.
- Seeded data belongs to the sample realm and cannot be entered by real-realm game identities. Explicit demo entry switches only the game visit to a fictional guest. Core platform user, animal, adoption, and wallet records are not modified.
- Demo animals are marked as fictional. Their detail panels do not link to nonexistent public profiles or fetch nonexistent host achievements.

The room seed uses get-or-create operations so repeat visits preserve existing virtual care, messages, and memories. It is applied when a demo visitor session is provisioned and was also applied to the current local Homes database for this delivery. The public fixture is copied to the integrated application with the runtime assets. The standalone Vite map can show sample previews, but live entry uses the integrated Next session bridge and the Homes service.

No automated tests, browser checks, typechecks, or builds were run. The local Homes service was restarted to load the new demo handlers; the running Next dev server picks up the source changes.
