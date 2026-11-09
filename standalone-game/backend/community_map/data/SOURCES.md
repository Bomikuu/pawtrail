# Davao community geography

Public Davao City barangay extract from the [Barangay Boundaries Repository](https://github.com/bendlikeabamboo/barangay-boundaries-repository/tree/main/2023-10-24/hierarchical_t0p005), based on PSA PSGC snapshot 2023-10-24 and NAMRIA administrative geometry edition 2023-11-06. Credit Philippine Statistics Authority, NAMRIA, and the upstream maintainer. The upstream code license is preserved in UPSTREAM-LICENSE.txt; the upstream dataset attribution remains authoritative.

The upstream geometry is simplified at 0.005 degrees. These are source-dated indicative community outlines, not freshly surveyed borders. No interpolation from animal positions, home coordinates or approximate-radius records was used. Custom Zone 1/2 subdivisions are PawTrail community partitions; they are not administrative barangays.

The normalized extract contains 182 real barangay source records. Its source metadata records the upstream SHA-256 and URL. Dataset filtering changes only the properties and geographic scope; geometry coordinates are preserved. The initial PSA GeoRisk query timed out, so no 2016 GeoRisk geometry was imported.

## Whole-city communities — 9 November 2026

The active discovery layer now uses the six whole cities in Region XI: Davao, Panabo, Island Garden City of Samal, Tagum, Digos and Mati. `davao-region-cities-2023.geojson` retains the city geometries from the same upstream `highly_urbanized_cities.geojson` and `component_cities.geojson` files, without inventing or subdividing boundaries. Each input URL and SHA-256 is recorded in the extract. Source dates and 0.005° simplification remain explicit. This is Davao Region city coverage, not nationwide municipality coverage.

The older barangay extract is retained for provenance/history. Its communities and custom zones are no longer published or enterable. Whole-city imports use `import_city_communities --skip-checks --file community_map/data/davao-region-cities-2023.geojson`; no subdivision parameter is used. Per-city map colors are presentation metadata, not an administrative classification.

## Active nationwide city coverage — 9 November 2026

The owner's final choice is **cities only**. The active normalized source is now `philippines-cities-2023.geojson`: 149 whole city outlines nationwide, assembled from the upstream highly urbanized, component and independent component city files. Municipalities, barangays and custom zones are not active communities. The previous six Davao city IDs/colors remain stable.

The upstream export includes Isabela twice at different administrative levels: an unmatched ADM3 city polygon and an ADM2 “not a province” container. Normalization keeps the actual ADM3 city geometry, uses component-city PSGC code `0990101000` from the upstream reference coverage report, and omits the duplicate container. It does not invent a second community or substitute arbitrary geometry. Input URLs/hashes and this normalization are recorded in the extract.

Reproduce with `scripts/prepare-national-communities.py --source-dir <download-directory> --output backend/community_map/data/philippines-cities-2023.geojson`, using the three downloaded source files prefixed `pawtrail-`. Colors are assigned from neighboring outlines while preserving the original six city colors. The edition remains PSGC 2023-10-24 / NAMRIA 2023-11-06; it is not a claim of newly surveyed 2026 borders.
