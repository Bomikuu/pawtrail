# Platform animal encounters

Approved direction: connect the game to public PawTrail animals and reuse the existing follow, saved-animal, mission and adoption services. Implement directly without agents. Do not run automated tests, checks, builds or browser verification for this follow-up.

- Add a small typed platform bridge; project public records explicitly, preserve provenance, use stable platform IDs, and exclude coordinates/private records.
- Import up to twelve public adoptable shelter cats/dogs into themed neighborhood/shelter encounter spots. Keep fictional quest animals separate. Imported animals open platform details instead of generating fictional care evidence.
- Add an accessible shadcn encounter directory/detail dialog with real photographs, published details, current availability, follow/save, mission links and adoption handoff; handle loading, errors, missing profiles and no available animals.
- Save position before leaving, retain an animal-specific return link throughout platform flows, and reopen refreshed animal details on return. Keep game Kibble separate from platform rewards.
- Install the adapter and return component through the existing source-sync script; document limitations and operation.

Delivered: typed bridge/public projection, themed imported actors, directory/detail dialog, follow/save, mission/shelter/adoption handoffs, tab-local return component and position preservation, auth return-path fix, sync installation and documentation. No automated validation was run for this follow-up.
