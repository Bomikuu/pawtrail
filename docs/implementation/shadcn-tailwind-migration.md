# Actual shadcn/ui and Tailwind migration

Goal: replace the hand-written primitive layer with official registry components and move routine styling into Tailwind classes at the component call sites. Preserve PawTrail's supplied artwork, orange/cream identity, neutral black dark mode, navigation feedback, profile columns, and privacy/business logic.

- [x] Install official registry components through the shadcn CLI using the existing aliases.
- [x] Adapt application callers to the registry APIs, including native selects, checkbox form semantics, loading buttons, dialogs and toasts.
- [x] Move ordinary layout, spacing, typography, colors, borders and responsive states from the existing stylesheets into Tailwind utilities. Keep only font/theme definitions and complex browser/animation rules in CSS.
- [x] Preserve the live preview and review the source changes. No agents, automated tests, checks, builds, or browser verification, per the user's instructions.

The official component sources remain in `src/components/ui`. Product-specific behavior belongs in composed feature/shared components rather than rewritten primitive implementations. Source provenance and any compatibility decisions are recorded below when implemented.

## Registry provenance

Installed with shadcn CLI **4.23.0**, using the project's existing `new-york`, React Server Components, TypeScript, and Tailwind v4 configuration:

```sh
npm exec --yes --package=shadcn@4.23.0 -- shadcn add button input textarea dialog alert-dialog dropdown-menu hover-card progress skeleton table select native-select checkbox tabs card badge avatar sonner radio-group --overwrite --yes
```

These 19 files come from the official registry. The current registry uses the `cn` package and unified `radix-ui` imports. Their dependencies are pinned in the lockfile. The upstream MIT license is retained in [the license file](../licenses/shadcn-ui.txt). The sources are formatted to the repository's no-semicolon convention. The only functional primitive adjustment forwards `value` to the Radix Progress root so its accessible value matches the indicator.

Official references: [Next.js installation](https://ui.shadcn.com/docs/installation/next), [manual setup](https://ui.shadcn.com/docs/installation/manual), and [Native Select](https://ui.shadcn.com/docs/components/radix/native-select).

## Application integration

- Buttons, inputs, textareas, dialogs, menus, hover cards, progress, skeletons, tables, and toasts use the registry sources. Social activity/catalog cards, status badges, and people avatars now compose the official Card, Badge, and Avatar components.
- Native form selects use the official Native Select to preserve empty options, DOM change events, browser validation, and FormData. The Radix Select is also installed for controlled select interactions. Boolean fields use Checkbox.
- `LoadingButton` composes Button with PawTrail's animal loader. ButtonLink and ButtonAnchor compose Button with navigation/document links; they do not implement alternate button styles.
- Progress callers convert counts and money totals to percentages. The displayed counts and business rules remain unchanged.
- ThemeProvider from `next-themes` owns the class-based theme, system preference, pre-paint initialization, and persistence. Dark tokens use black and neutral charcoal.

## Tailwind ownership

The one-time migration moved presentation into 107 source files using 535 class recipes, replacing 9,830 lines across the seven former stylesheets. Routine presentation now lives in Tailwind classes, including responsive and contextual arbitrary variants where needed. Semantic class markers remain where Tailwind context selectors depend on them; they no longer point to separate page stylesheets. The sidebar, header, search, drawer, and mobile navigation were simplified into direct utility compositions.

`src/app/globals.css` owns Tailwind imports, shadcn theme tokens, self-hosted font declarations, and shared base utilities. `src/styles/complex.css` contains scrollbar browser rules, reduced-motion handling, and animation keyframes. The six former feature/shell stylesheets are removed. `scripts/migrations/tailwind-styles.mjs` records the one-time conversion and refuses to reapply it.

## Delivery limits

Source review covered registry API compatibility, native form behavior, theme integration, navigation compositions, and preserved profile loading boundaries. The preview process was left running. No automated tests, checks, builds, browser inspection, or subagents were used for this migration; runtime and rendered behavior have not been verified.

Graphify had no extracted graph for this worktree, so relevant component relationships were traced directly. Jev compared synthetic migration choices without source/private records; its judgment was guidance only.
