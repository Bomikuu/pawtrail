# Geographic community borders — feasibility proposal

Status: implemented for initial Davao coverage after the owner selected local areas/custom splits. See `geographic-community-areas-2026-11-08.md` for current behavior, source editions and verification limits. The design discussion below records the original proposal.

## Current evidence

The social `Area` model stores a name/slug, center latitude/longitude and radius. The discovery API uses the same point/radius shape. These values describe approximate areas; they cannot reconstruct real regional or borough borders. The housing service’s existing interior/yard zones and community plot blocks are game-room concepts, rather than geographic administrative boundaries.

## Proposed behavior

A published community area would store an authoritative GeoJSON Polygon/MultiPolygon, stable area ID, parent region ID, boundary source/version and linked community ID. The map would render a restrained boundary line and selected-area fill. Selecting an area would show its name and an Enter community action with real membership/activity data. A keyboard-accessible area selector/list would provide the equivalent entry action without requiring a polygon click.

The geographic area and its community should remain separate records. A large region can contain two smaller community zones, each with its own polygon and community ID, while preserving the parent-region boundary. Custom partitions should be labelled community zones rather than official administrative borders, and should be validated for overlap, gaps and containment. The owner selected smaller local areas/custom splits. Initial implementation follows barangay source polygons and explicitly labelled custom child zones.

Community IDs can initially scope the existing feed, missions, membership and game-room entry on shared backend services. Distinct physical server instances are a separate infrastructure choice and can be introduced later through community-to-instance routing. Geographic selection must not create duplicate animal identities, imply live animal locations, publish precise private coordinates or automatically grant community/reward permissions.

## Data and implementation prerequisites

Select the geographic unit and obtain its real, licensed/versioned polygon data. Persist the area/community relationship and entry policy. Expose only published, simplified boundary geometry suitable for the visible viewport; retain accurate stored boundaries for point-in-area assignments. Add polygon rendering and explicit Enter community behavior to both the vector map and accessible/raster fallback. Validate memberships and game-room permissions on the server. Define partitioning rules for large areas explicitly rather than drawing arbitrary lines through a region.

Implementation now includes stored source geography, a schema migration, custom splits and distinct shared game rooms. No invented regional geometry, server-status indicator, separate server deployment or automatic community-membership enrollment was added.
