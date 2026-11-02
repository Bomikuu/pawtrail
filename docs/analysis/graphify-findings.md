# PawTrail requirements graph findings

Graphify analyzed the original user brief, not implemented source code. The graph contains 25 selected concepts, 38 explicit pairwise relationships and one search-domain hyperedge. It is a navigation aid; it is not exhaustive endpoint coverage or proof of implementation correctness.

Public animal profiles are the strongest shared entity (10 connections, source §7); community posts link animals/Hordes/campaigns/missions (7 connections, §16); the centralized API layer links mock data and future Django access (6 connections, §23). These relationships justify a foundation → social/profile → connected feature packages order. Missions produce reviewed contributions for Kibble (§13–14), and applications belong to applicants and responsible shelters (§8).

The graph's six communities and raw cohesion scores are: API/mock foundation 0.3333; community/rewards 0.4000; profiles/adoption 0.5000; organizations/fundraising 0.5000; location/help 1.0000; thin global-search community 1.0000. Search is grouped through a hyperedge, so its isolation in the pairwise graph is not evidence that the product has no search links.

Graph integrity checks found 0 missing/dangling endpoints, 0 self-loops and 0 collapsed same-endpoint relationships in the extracted pairwise edges. These checks validate graph structure, not factual completeness. Every extracted relationship is labeled EXTRACTED with source section references; architecture decisions in the plan remain the author's proposals.

Planning traversal used exact graph-vocabulary terms `profiles community adoption fundraising api missions` and reached 24 concepts. Relevant source locations include §7 Public Animal Profiles, §8 Adoption, §13 Help Missions, §16 Community Feed, and §23 API Layer. The [graph snapshot](requirements-graph.json) uses repository-relative source paths into the [original brief](../requirements/pawtrail-original-brief.txt).

Token accounting: host extraction-agent usage was not exposed, so no token total is claimed for semantic extraction. The earlier Jev emphasis query reported 434 input/44 output tokens. Graphify's generic token-reduction benchmark was not beneficial on this small one-document corpus (reported 0.7×); the graph is retained for relationship tracing, not as a claimed cost optimization.
