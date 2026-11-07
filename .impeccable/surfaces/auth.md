# Authentication

Mode: Operate. Approved build path: code.

The login route uses the owner's 6 November 2026 reference: a warm cream canvas, a community introduction on the left, and a white sign-in card on the right. Nunito headings use weight 600, and labels/actions remain compact. The owner's second supplied image is the cat-and-dog illustration, encoded locally with transparency preserved. On smaller screens the form leads, with a compact illustration beneath it. Registration follows the subsequent supplied reference as a centered card without a left introduction or illustration.

The card composes the official CLI-installed shadcn Card, Input and Button components, plus the existing LoadingButton and ButtonLink wrappers. All presentation is expressed with Tailwind. Password visibility, field errors, submit feedback, safe return paths, Google sign-in and explicit unavailable recovery guidance belong to the form. Demo disclosure stays visible beneath the card; the three sample personas expand on demand. Google authentication never selects a mock identity.

## Direction contract

THESIS: welcoming community context supports the sign-in task; the owner's reference determines the composition, with quieter typography and restrained ornament.

OWN-WORLD: route-local cream `#fffaf5`, white card, existing orange/brown tokens, subtle peach corner shapes, rounded outlined fields, Nunito 600 headings and Inter body text. Dark mode inherits the neutral application tokens.

STORY: returning members recognize PawTrail, enter credentials or choose Google, and return to their intended local destination. Demo visitors can choose an explicitly labeled sample profile.

FIRST VIEWPORT: at desktop widths, a roughly 1104px centered grid pairs a community introduction and supplied illustration with a 448px form column. Below the desktop breakpoint, the sign-in card is first and the illustration is compact. Expanded help and sample choices may increase document height.

FORM: code-led adaptation of the explicit supplied composition inside the established brand; no concept-selection round is needed for this pinned reference.

FINISH: source review and asset provenance complete the authorized work. Browser inspection, automated checks and subagent review remain disabled by the project's current owner instruction, so rendered quality and live Google authentication are unverified.

## Registration direction contract

THESIS: one centered account form adapts the supplied registration reference and matches the softer login treatment. The existing four-field registration remains a single complete task.

OWN-WORLD: the same route-local cream, white card, orange action, brown text, Nunito 600 headings and Inter labels. The wordmark is centered above a card capped at 768px. The page includes no illustration assets; the avatar controls reuse the existing owner-supplied catalog.

STORY: choose an avatar, complete account details, read community guidance, and create the profile. The avatar choice is validated and saved with the demo profile. Community membership remains the public registration role; organization access remains assigned through the existing permission flow.

FIRST VIEWPORT: avatar preview and compact choices precede a two-column field grid on wider screens. Mobile uses one field column. Account-type presentation, inline guidance, the full-width create action and sign-in navigation complete the card. Additional avatars and guidelines expand in place.

FORM: direct code-led adaptation of the owner's pinned composition; no multi-step progress is shown for the existing single-step signup flow. Shelter selection is visibly unavailable with its assignment explanation.

FINISH: source review only under the current owner override. Registry components are composed without modification, no new rasters ship, and no tests, checks, builds, browser verification or delegated review are run.
