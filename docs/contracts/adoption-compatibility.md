# Initial adoption compatibility rules

These are deterministic demonstration rules, not validated animal-welfare criteria or an adoption approval. A1 implements them. Human shelter review remains necessary. Preferences are optional and observations about animal needs must come from declared sample records or reviewed backend data.

`scoreCompatibility` returns no numerical score when no dimension can be evaluated. Otherwise calculate `round(100 × sum(weight × componentScore) / sum(answeredWeights))`. Missing preference or missing necessary animal evidence omits the whole dimension. Every returned component includes its input evidence, score and plain-language explanation.

| Dimension | Weight | Rule for component score |
| --- | ---: | --- |
| Species | 20 | 1 for exact requested species; 0 for a mismatch. No species preference means omitted. |
| Living environment | 20 | 1 when the selected home type is in the animal's explicitly recorded suitableHomeTypes; 0 when an explicitly recorded requirement excludes it. Missing home/evidence means omitted. Do not infer suitability merely from breed or body size. |
| Lifestyle | 20 | Compare declared activity preference and known animal energy on low/medium/high: exact = 1, adjacent = 0.5, opposite = 0. Missing energy/activity means omitted. |
| Experience | 15 | A recorded experienced-handler requirement with a novice applicant = 0; an experienced applicant or explicitly novice-suitable animal = 1. Missing necessary preference/requirement data means omitted. |
| Other pets | 15 | If the user has no other pets, 1. Otherwise any known incompatible household pet type = 0; all declared household types explicitly compatible = 1; remaining unknown compatibility means omitted. |
| Distance | 10 | With a selected origin area, positive maximum travel distance and known public animal area, approximate centroid distance within the limit = 1, beyond it = 0. Missing origin/limit/area means omitted. Never request private animal coordinates. |

Age range, size and preferred personality are optional discovery filters with no additional scoring weight. Selected personality tags use all-selected matching. A user may apply the chosen filters or skip them; skipped questionnaire fields do not silently become defaults. Species/home incompatibilities appear as advisories with explanations, not as a hidden guarantee or automatic approval/rejection.

Examples to pin in A1 tests:

- No answers → `score: null`, empty evaluated components.
- Only matching species → `score: 100`, answered weight 20.
- Species match (20×1), lifestyle adjacent (20×0.5), and distance beyond preference (10×0) → `score: 60`, answered weight 50.
- All six dimensions matching → `score: 100`; still show the responsible-adoption disclaimer.
- Unknown other-pet compatibility is excluded; it is never scored as safe by default.

The approximate distance and illustrative score do not establish a safe home, medical diagnosis, temperament guarantee, or completed adoption. Shelter review and subsequent real-world steps remain distinct states.
