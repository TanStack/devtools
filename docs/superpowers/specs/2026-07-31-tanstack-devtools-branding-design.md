# TanStack Devtools Branding and Compact Workbench Design

- **Date:** 2026-07-31
- **Status:** Approved for implementation
- **Scope:** `@tanstack/devtools`, `@tanstack/devtools-ui`, `@tanstack/devtools-a11y`, and the React basic example

## Context

Core Devtools and shared UI duplicate raw color ramps in `packages/devtools/src/styles/tokens.ts` and `packages/devtools-ui/src/styles/tokens.ts`. The accessibility plugin has a third styling layer in `packages/devtools-a11y/src/core/styles/styles.ts`. The resulting UI uses unrelated gray/blue values, inconsistent light/dark states, and a plugin drawer that consumes panel width.

The replacement is a compact Workbench with app-first work surfaces, TanStack brand chrome, and a horizontal Plugins strip. This is a presentation and accessibility change. It must retain the existing core navigation, plugin lifecycle, equal-width multi-plugin layout, whole-panel resizing, persistence, trigger, hide/reveal, and picture-in-picture (PiP) behavior.

This specification serves shared-UI contributors who need an exact token/build contract and core/accessibility contributors who need state, lifecycle, and verification contracts. Each contributor can follow the relevant ownership section, migration step, named test paths, and acceptance criteria without consulting a separate design artifact.

## Goals

- Resolve one private semantic light/dark theme from `@tanstack/devtools-ui` for core, shared components, and the accessibility plugin.
- Use exact TanStack color, Bricolage Grotesque, and Inter assets.
- Replace the 0/192px horizontal plugin drawer with a horizontal Plugins strip that expands vertically from 32px to 48px.
- Put Settings and Detach in the 36px TanStack Devtools banner.
- Keep up to three active plugin panes mounted at equal width with static separators.
- Register the accessibility plugin in `examples/react/basic` and provide deterministic audit content for browser verification.
- Meet the contrast, keyboard, forced-colors, reduced-motion, and constrained-size requirements in this specification.

## Non-goals and exemptions

- Query, Router, and all user-provided plugin internals remain owner-styled. The example's `examples/react/basic/src/package-json-panel.tsx` is a user-plugin fixture and is out of scope.
- No per-pane splitter or per-pane resizing is added. Plugin panes remain equal-width. Only the existing whole-panel height resize remains.
- No public CSS-variable theme API, new theme value, or supported consumer token contract is introduced.
- The native expanded operating-system select popup remains platform-owned. The closed control is in scope.
- Vendor marks, plugin logos, screenshots, and SEO preview colors that simulate Google or social platforms may retain their source colors. Repository-owned chrome around them uses semantic roles.
- The implementation does not change audit rules, plugin registration APIs, storage keys, state shapes, shortcuts, placement, or PiP capability.
- Gradients, gradient text, glow, glass effects, neon effects, bounce/spring motion, and decorative card grids are prohibited in in-scope surfaces.

## Chosen approach

Add a private semantic theme entry point to `@tanstack/devtools-ui`, migrate shared primitives, consume that theme from core and accessibility, and then replace the drawer layout. This keeps one internal semantic source without converting the existing raw-token surface into a public compatibility promise.

Rejected alternatives:

1. Restyling each package independently retains three theme implementations.
2. Publishing CSS variables as a customization API creates a new public compatibility contract.
3. Keeping the vertical rail or horizontal drawer does not recover panel width.
4. A single-active-pane tab canvas removes simultaneous plugin panes.

## Package ownership and build contract

### Shared UI

`packages/devtools-ui/src/styles/semantic-theme.ts` is the new source for semantic colors, fonts, spacing, radii, shadows, and motion. `packages/devtools-ui/src/internal.ts` exports the resolved theme types and helpers for monorepo packages. The root `packages/devtools-ui/src/index.ts` does not re-export them.

Add `./src/internal.ts` to the `entry` array in `packages/devtools-ui/vite.config.ts` and add this package export in `packages/devtools-ui/package.json`:

```json
"./internal": {
  "import": {
    "types": "./dist/esm/internal.d.ts",
    "default": "./dist/esm/internal.js"
  }
}
```

Core and accessibility import from `@tanstack/devtools-ui/internal`. Publint must verify the subpath. The `/internal` name declares that it is package plumbing, not a supported application theming API.

Keep every existing raw key in `packages/devtools-ui/src/styles/tokens.ts`. In particular, `Tag` accepts `keyof typeof tokens.colors`; removing or renaming a color key is a source/type compatibility break. Shared primitives migrate to semantic roles, but the legacy raw map and `Tag` keys remain available. Core's duplicated raw palette may be reduced only after no core style references it.

### Core and accessibility

- `packages/devtools/src/` owns the Workbench grid, banner, navigation, Plugins strip, Marketplace, whole-panel separator, and Devtools-owned plugin frames.
- `packages/devtools-a11y/src/core/` consumes `/internal` semantic roles while retaining audit/config/export behavior.
- Plugin content continues to receive only the existing `{ theme, devtoolsOpen }` props. No semantic theme object crosses the plugin boundary.

## Semantic theme

### Surfaces, text, borders, and controls

All listed pairs are minimum verified contrast pairs for the named use. Text may be placed only on the backgrounds listed in its row.

| Role | Light | Dark | Allowed pairing and ratio |
|---|---|---|---|
| `surface.app` | `#ffffff` | `#111111` | panel root |
| `surface.workspace` | `#ffffff` | `#1f1f1f` | pane content |
| `surface.subtle` | `#fafafa` | `#1b1b1b` | secondary region |
| `surface.elevated` | `#ffffff` | `#2b2b2b` | popover/dialog |
| `surface.brand` | `#eeebd4` | `#111111` | banner/brand-only region |
| `text.primary` | `#111111` | `#ffffff` | app/ workspace: at least 16.48:1 |
| `text.secondary` | `#3e3529` | `#aea691` | workspace: 12.03:1 / 6.80:1 |
| `text.muted` | `#756c5b` | `#aea691` | subtle/workspace: 4.96:1 / 6.80:1 |
| `text.mutedOnBrand` | `#3e3529` | `#aea691` | brand: 10.00:1 / 7.79:1 |
| `text.inverse` | `#ffffff` | `#111111` | inverse/control fill |
| `text.link` | `#003e53` | `#9cd5e2` | workspace: 11.58:1 / 10.23:1 |
| `border.decorative` | `#eeebd4` | `#2d2d2d` | non-informational division only |
| `border.control` | `#756c5b` | `#aea691` | workspace: 5.18:1 / 6.80:1 |
| `border.focus` | `#003e53` | `#61adbf` | adjacent app surface: 11.58:1 / 7.41:1 |
| `state.hover` | `#1111110f` | `#ffffff14` | overlay plus non-color cue |
| `state.pressed` | `#1111111f` | `#ffffff1f` | overlay plus non-color cue |
| `selection.fill` | `#3e3529` | `#c5c3bf` | white text 12.03:1 / `#111111` text 10.73:1 |

`border.decorative` may be below 3:1 only when it carries no control boundary, state, focus, or separation needed to understand content. Inputs, checkboxes, buttons without a fill, whole-panel resize separator, selected indicators, and error boundaries use `border.control`, focus, or status borders and meet 3:1. Focus is a 2px outline with a 2px offset and cannot be clipped.

Do not use `#756c5b` on cream; its ratio is 4.31:1. Muted banner copy uses `text.mutedOnBrand`. Blue is limited to focus, links, and information. Tooling selection uses charcoal/tint. Green, amber, and terracotta indicate status only.

Light neutral and blue text ratios are recorded separately by surface:

| Foreground | On `#ffffff` | On `#fafafa` |
|---|---:|---:|
| `#3e3529` | 12.03:1 | 11.52:1 |
| `#003e53` | 11.58:1 | 11.09:1 |

### Status roles

Five roles cover component feedback and accessibility summaries. Each subtle treatment uses all three listed values. The contrast ratio is text against background; borders are also tested against the adjacent background.

| Role | Light background | Light border | Light text | Text / border ratio |
|---|---|---|---|---:|
| success | `#d8f0da` | `#1d4226` | `#1d4226` | 9.36:1 / 9.36:1 |
| warning | `#fef6cc` | `#624a00` | `#624a00` | 7.71:1 / 7.71:1 |
| error | `#f9d8c4` | `#5f1a06` | `#5f1a06` | 9.56:1 / 9.56:1 |
| info | `#d8f0f3` | `#003e53` | `#003e53` | 9.75:1 / 9.75:1 |
| neutral | `#eeebd4` | `#756c5b` | `#3e3529` | 10.00:1 / 4.31:1 |

| Role | Dark subtle background | Dark border | Dark text | Text / border ratio |
|---|---|---|---|---:|
| success | `#1d4226` | `#69bc75` | `#a2e1a9` | 7.46:1 / 4.87:1 |
| warning | `#624a00` | `#f4d648` | `#fae884` | 6.78:1 / 5.83:1 |
| error | `#5f1a06` | `#e06e49` | `#edaa8d` | 6.56:1 / 3.97:1 |
| info | `#003e53` | `#61adbf` | `#9cd5e2` | 7.18:1 / 4.54:1 |
| neutral | `#2b2b2b` | `#aea691` | `#c5c3bf` | 8.05:1 / 5.84:1 |

Each status role also defines a solid treatment. `solidFill` is the control/badge background and `onFill` is its only text/icon foreground:

| Role | Light `solidFill` | Light `onFill` | Ratio | Dark `solidFill` | Dark `onFill` | Ratio |
|---|---|---|---:|---|---|---:|
| success | `#1d4226` | `#ffffff` | 11.29:1 | `#69bc75` | `#111111` | 8.14:1 |
| warning | `#624a00` | `#ffffff` | 8.40:1 | `#f4d648` | `#111111` | 13.09:1 |
| error | `#5f1a06` | `#ffffff` | 12.83:1 | `#e06e49` | `#111111` | 5.84:1 |
| info | `#003e53` | `#ffffff` | 11.58:1 | `#61adbf` | `#111111` | 7.41:1 |
| neutral | `#3e3529` | `#ffffff` | 12.03:1 | `#c5c3bf` | `#111111` | 10.73:1 |

Status on an untinted white/`#fafafa` surface uses light text `#1d4226`, `#624a00`, `#5f1a06`, `#003e53`, or `#3e3529`; each is at least 8.05:1 on `#fafafa`. Status on an untinted `#1f1f1f` surface uses dark text `#69bc75`, `#f4d648`, `#e06e49`, `#9cd5e2`, or `#c5c3bf`; each is at least 5.10:1. Every status also includes an icon and text label. A colored dot alone is insufficient.

### Syntax roles

Code surfaces are `#fafafa` in light mode and `#1f1f1f` in dark mode. Use these exact foregrounds:

| Syntax role | Light | Ratio | Dark | Ratio |
|---|---|---:|---|---:|
| keyword | `#5f1a06` | 12.29:1 | `#e06e49` | 5.10:1 |
| string | `#1d4226` | 10.82:1 | `#69bc75` | 7.10:1 |
| number/constant | `#541f5d` | 11.62:1 | `#c56dcf` | 5.07:1 |
| comment | `#756c5b` | 4.96:1 | `#aea691` | 6.80:1 |
| property/link | `#003e53` | 11.09:1 | `#61adbf` | 6.47:1 |
| punctuation/plain | `#3e3529` | 11.52:1 | `#c5c3bf` | 9.37:1 |
| selection | `#003e53` on `#d8f0f3` | 9.75:1 | `#ffffff` on `#003e53` | 11.58:1 |

The contrast tests label white and `#fafafa` cases separately; a passing white pair is not assumed to pass on `#fafafa`. `::selection` switches every syntax token to the selection foreground shown above so a token's original foreground never remains on the selection background.

### Type, spacing, radius, depth, and motion

- Bundle exactly `BricolageGrotesque-Bold.ttf` and the variable `Inter-latin.woff2` under `packages/devtools-ui/src/assets/fonts/`. Add `OFL-Bricolage-Grotesque.txt` and `OFL-Inter.txt` beside them. Do not bundle a mono font.
- Use Bricolage only for the banner title, pane titles, first-level empty-state headings, and numeric audit totals. Use Inter elsewhere. Code uses the existing system monospace stack.
- UI sizes are 12/17, 14/20, and 16/24px. Labels are 12/14px at weight 500 and 0.5px tracking. Body is weight 300 at 16px and weight 400 at 14px and 12px.
- Spacing uses 4px increments. Compact controls use 4 or 8px gaps and 6px vertical/8px horizontal padding. Section gaps are 8, 12, or 16px.
- Radius is 4px for controls, 6px for grouped surfaces, and 8px for dialogs/popovers.
- Daily shadows are exactly `0 1px 2px rgba(0,0,0,0.03)` or `0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)`. A modal/popover may use `0 25px 50px -12px rgba(0,0,0,0.20)`.
- Plugins-strip CSS interpolation is 120ms ease-out. The existing drawer leave grace period remains 400ms. `prefers-reduced-motion: reduce` sets CSS interpolation duration to 0ms but retains the 400ms leave grace period to prevent accidental collapse.

Register these exact faces once per target document:

```css
@font-face {
  font-family: 'Bricolage Grotesque';
  src: url(<emitted BricolageGrotesque-Bold.ttf URL>) format('truetype');
  font-style: normal;
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url(<emitted Inter-latin.woff2 URL>) format('woff2');
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}
```

`semantic-theme.ts` imports both asset URLs so Vite emits them. An idempotent `/internal` helper inserts a style element with a fixed ID into the active `Document`. `ThemeContextProvider` installs it in its owner document; `PiPProvider` installs it again after clearing/copying the popup head so PiP does not depend on opener timing. On unmount, a shared document-level registration remains usable by another Devtools instance. If either request fails, Bricolage falls back to `ui-sans-serif, system-ui, sans-serif`, Inter falls back to `ui-sans-serif, system-ui, sans-serif`, and code retains the existing system monospace stack.

The Bricolage license is copied with its bundled source asset. Before adding `OFL-Inter.txt`, retrieve `LICENSE.txt` from the official `rsms/inter` repository revision that supplied `Inter-latin.woff2`, verify that it declares SIL Open Font License 1.1 and the Inter Project Authors, record that revision and both SHA-256 hashes in the implementation PR, then copy it without modification. If provenance or license verification fails, do not ship the Inter binary and use the system-sans fallback.

The two font binaries must total at most 160 KiB uncompressed and no third font binary may be emitted. Add a package-build assertion for emitted font count and total bytes; retain the existing 60 KB core JavaScript size limit through `pnpm size`.

## Concrete component coverage

Shared UI coverage is `Button` (`components/button.tsx`), `Checkbox` (`checkbox.tsx`), `Header`/`HeaderLogo` (`header.tsx`), `Input` (`input.tsx`), `TanStackLogo` (`logo.tsx`), `MainPanel` (`main-panel.tsx`), `Section`/`SectionTitle`/`SectionDescription`/`SectionIcon` (`section.tsx`), `Select` (`select.tsx`), `Tag` (`tag.tsx`), `ThemeContextProvider` (`theme.tsx`), `JsonTree` (`tree.tsx`), and the icons exported by `packages/devtools-ui/src/icons.ts`.

Core coverage is `MainPanel` (`packages/devtools/src/components/main-panel.tsx`), `ContentPanel` (`content-panel.tsx`), `Tabs`/the replacement Workbench navigation (`tabs.tsx`), `TabContent` (`tab-content.tsx`), `Trigger` (`trigger.tsx`), `SourceInspector` (`source-inspector.tsx`), `SettingsTab` (`tabs/settings-tab.tsx`), `HotkeyConfig` (`tabs/hotkey-config.tsx`), `PluginsTab` (`tabs/plugins-tab.tsx`), `PluginMarketplace` (`tabs/plugin-marketplace.tsx`), all components in `tabs/marketplace/`, and repository-owned wrappers in `tabs/seo-tab/`.

Accessibility coverage is `Shell`, `Settings`, `IssueList`, and `IssueCard` in `packages/devtools-a11y/src/core/components/`, `packages/devtools-a11y/src/core/styles/styles.ts`, and the severity highlight/tooltip styles created by `packages/devtools-a11y/src/core/utils/ui.utils.ts`.

Accessibility severity mapping is explicit: critical uses error with a 3px solid outline, serious uses error with a 2px solid outline, moderate uses warning with a 2px solid outline, and minor uses info with a 2px dashed outline. Each issue and tooltip includes the written severity label, so critical and serious do not depend on outline thickness alone.

Repository-owned hover, focus, pressed, selected, disabled, loading, empty, validation, error, severity, scrollbar, dialog, popover, and source-inspector states in those files use semantic roles. PackageJsonPanel and all external plugin descendants are excluded. SEO simulated result text/link colors and vendor assets use the exemption above.

## Workbench geometry and constrained height

The core open panel uses:

```css
grid-template-rows: 36px var(--plugins-strip-height, 32px) minmax(0, 1fr);
```

- Row 1 is a fixed 36px banner. It contains the emblem and “TanStack Devtools” on the left; explicit “Plugins” and “SEO” destination controls; and Settings, Detach, and Close controls on the right. Plugins, SEO, and Settings expose the current destination with `aria-current="page"`. Controls are 28×28px or wider and have accessible names.
- Row 2 is a single-line horizontal Plugins strip. It is 32px idle and 48px while hovered, `:focus-within`, Marketplace-open, or zero-active-plugin forced expansion applies. It never wraps and uses horizontal scrolling when content exceeds width.
- Row 3 contains zero to three equal-width plugin panes or the selected core view. Active plugin panes use `display:flex`; each mount is `flex: 1 1 0; min-width: 0`. Adjacent panes have a static 1px `border.decorative` separator. There are no pane resize handles.

The 32→48px strip grows downward and its tab content translates vertically within the 16px change, matching the current drawer's reveal concept on the new axis. Pointer leave schedules contraction after the existing 400ms grace period. Focus leaving the strip uses the same grace period. Focus never moves during contraction.

At widths `<=360px`, hide the “TanStack Devtools” text and retain the emblem with accessible name “TanStack Devtools”. The strip remains one row. At whole-panel heights 84px and above, all three grid rows operate normally. At 70–83px, compact-height mode fixes the banner at 36px and strip at 32px, disables the 48px expansion, and leaves `minmax(0,1fr)` for any remaining content; all banner and strip controls remain operable. Dragging the existing whole-panel separator to a computed height `<70px` keeps the existing result: set `isOpen` false. The stored height, close threshold, and `persistOpen` semantics are not changed.

PiP uses `100vh`, displays the same grid, and omits Detach and Close as it does today. As an intentional compatibility exception, PiP also omits the resize separator: popup height is window-owned, and the current handle can only mutate the hidden future attached height. Detaching snapshots the stored attached height without changing it; closing PiP/reattaching restores that exact height. The trigger is not interactive in PiP. The component is always described as a **horizontal Plugins strip with vertical expansion**; “vertical strip” is not used.

## Whole-panel resize separator

Preserve the current left-button pointer drag calculation for top/bottom placement in `packages/devtools/src/devtools.tsx`. Add keyboard semantics to the same drag handle:

- `role="separator"`, `aria-orientation="horizontal"`, `tabIndex="0"`, and accessible name “Resize TanStack Devtools panel”.
- The separator exists only while attached. Its maximum is `Math.floor(window.innerHeight * 0.9)`. `aria-valuemax` is that integer, `aria-valuenow` is the stored height clamped to `[70, aria-valuemax]`, and `aria-valuemin="70"`.
- For a bottom-attached panel, ArrowUp increases height by 10px and ArrowDown decreases it by 10px. For a top-attached panel, ArrowDown increases height by 10px and ArrowUp decreases it by 10px. Shift changes the step to 50px. This matches the physical separator direction.
- Home sets 70px. End sets the computed maximum above. Every keyboard change uses the same `setHeight` and `<70px` close paths as pointer resizing. PiP has no pointer or keyboard resize path.
- The separator has a visible focus outline and a control-boundary contrast of at least 3:1.

## Navigation and state transitions

The strip is rendered independently of the selected core view so plugin choices remain available from SEO and Settings. The following transitions are normative:

| Action/state | State change | Rendered result and lifecycle |
|---|---|---|
| Select SEO | `activeTab = 'seo'`; `activePlugins` unchanged; Marketplace closed | SEO view replaces plugin mounts; no plugin `destroy` call |
| Select Settings | `activeTab = 'settings'`; `activePlugins` unchanged; Marketplace closed | Settings view replaces plugin mounts; no plugin `destroy` call |
| Select banner Plugins destination | `activeTab = 'plugins'`; Marketplace closed; `activePlugins` unchanged | Existing active mounts return in activation order; the Plugins control has `aria-current="page"` |
| Select Marketplace | `activeTab = 'plugins'`; Marketplace open; `activePlugins` unchanged; strip forced to 48px except compact-height mode | Marketplace replaces plugin mounts; no plugin `destroy` call |
| Select inactive plugin | `activeTab = 'plugins'`; Marketplace closed; append its ID when fewer than three are active | New mount is appended; all panes become equal width; `render` receives current props |
| Select active plugin | `activeTab = 'plugins'`; Marketplace closed; remove its ID | Call `destroy(pluginId)` once before removing its mount; remaining panes become equal width |
| Select a fourth inactive plugin from Plugins, SEO, or Settings | `activeTab = 'plugins'`; Marketplace closed; `activePlugins` unchanged | The existing three mounts render in activation order; no `render`/`destroy` call is added for the rejected plugin |
| Zero registered plugins | `plugins = []`; `activeTab = 'plugins'` | Render the existing Marketplace fallback; strip contains the Marketplace destination and does not render plugin controls |
| Registered plugins with zero active | `plugins.length > 0`; `activePlugins = []`; `activeTab = 'plugins'` | Render the zero-active workspace state; strip forced to 48px, or 32px at 70–83px height, so registered plugins remain selectable |
| Three active plugins | Three IDs in activation order | Three equal-width mounts with two static 1px separators; no resize controls |
| Close whole panel or press Escape | Existing `isOpen`/`persistOpen` toggle | Plugin instances are not destroyed; active `render` calls receive `devtoolsOpen: false` through the existing effect |
| Theme change | Existing `theme` value changes | Active plugin `render` and custom name callbacks receive the new `light | dark` value |
| Enter PiP | Existing PiP request and window state; stored attached height unchanged | Same active/core view; panel uses `100vh`; Detach, Close, and resize separator omitted; reattachment restores the exact pre-detach attached height |

## Plugin compatibility contract

- Preserve `PLUGIN_CONTAINER_ID = 'plugin-container'` and `PLUGIN_TITLE_CONTAINER_ID = 'plugin-title-container'`. Mount and title IDs remain `${PLUGIN_CONTAINER_ID}-${plugin.id}` and `${PLUGIN_TITLE_CONTAINER_ID}-${plugin.id}`.
- Preserve explicit IDs and generated ID behavior, registration order in the strip, activation order in `activePlugins`, `MAX_ACTIVE_PLUGINS = 3`, default-open behavior, and stored ID filtering.
- Preserve `name: string | ((el: HTMLHeadingElement, props) => void)`. The function still receives the same live `HTMLHeadingElement`, theme, and `devtoolsOpen` values.
- Preserve `render(el: HTMLDivElement, props)` calls when an active mount exists and reactive theme/open inputs change. Moving between Plugins, Marketplace, SEO, or Settings may unmount/remount DOM but does not call plugin `destroy`.
- Preserve `destroy(pluginId)` only when an active plugin is toggled inactive. Whole-panel close, core-view navigation, Marketplace navigation, and PiP do not add destroy calls.
- Do not apply core typography, colors, or descendant selectors inside plugin mount elements. Devtools owns only mount sizing, background frame, title control, and inter-pane separator.
- Replace each click-only plugin title container with a focusable wrapper using `role="button"`, `tabIndex="0"`, `aria-labelledby` pointing to the existing live `h3` ID, and `aria-pressed` for active state. Click, Enter, and Space invoke the same toggle; Space prevents page scrolling. Keep the live `h3` so the custom `HTMLHeadingElement` callback is unchanged. A string name receives a core-owned text class. A callback-owned `h3` and all of its descendants receive no core font family, size, weight, text-transform, or foreground-color rule; only the wrapper's layout, background, border, and focus state are core-owned.

## Accessibility and forced colors

- Normal text is at least 4.5:1; large text and required non-text boundaries are at least 3:1. Tests use the exact pair tables above.
- Selected/open/severity/validation states use text or an accessible name plus an icon/border; color is not the only cue.
- Hover and `:focus-within` expand the Plugins strip. Horizontal overflow is operable with keyboard focus and browser scrolling.
- Icon buttons are actual buttons with names: “SEO”, “Settings”, “Detach TanStack Devtools”, “Close TanStack Devtools”, and plugin-derived names. New names are asserted; the implementation does not assume the current icon-only controls already have names.
- At 200% browser zoom, banner controls remain reachable, the strip scrolls, and plugin/core content scrolls without page-level horizontal overflow.
- Under `@media (forced-colors: active)`, surfaces use `Canvas`/`CanvasText`, controls use `ButtonFace`/`ButtonText`, and selected plugins use `Highlight`/`HighlightText`. Retain `forced-color-adjust: auto` on controls. Focused controls, inputs, checkboxes, pane separators, and the attached-only resize separator retain a `ButtonText` or `CanvasText` border at least 1 CSS px wide. The emblem uses `currentColor` or remains hidden behind the accessible brand name; no state depends on raster/SVG color.

## React basic accessibility fixture

Add `@tanstack/devtools-a11y: workspace:*` to `examples/react/basic/package.json`. In `examples/react/basic/src/setup.tsx`, use the exact development API:

```ts
import { a11yDevtoolsPlugin } from '@tanstack/devtools-a11y/react'

plugins={[a11yDevtoolsPlugin(), /* existing plugins */]}
```

Add `examples/react/basic/src/a11y-audit-fixture.tsx` exporting `A11yAuditFixture`. Render it only when `import.meta.env.DEV` is true. The fixture contains an inline-data image without `alt` (`image-alt`), an empty button (`button-name`), and an input without a label (`label`), each with a fixed test ID. Do not randomize content, fetch data, or use timers. Browser audit assertions require those three axe rule IDs and may allow additional host/browser findings.

The React entry returns a no-op accessibility plugin outside development. Therefore accessibility-plugin browser verification must run against the one-shot Vite development server from `pnpm --filter @tanstack/devtools-example-react-basic dev`, not `vite preview` or a production build. Start it natively in Windows, await the browser checks, and terminate the complete process tree.

Query, Router, duplicate Router, and Package.json panels remain useful multi-pane fixtures but are not recolored.

## Migration sequence

1. Add `semantic-theme.ts`, `internal.ts`, font assets/licenses, Vite entry, package export, and semantic/contrast tests in `packages/devtools-ui` without removing legacy token keys.
2. Migrate the concrete shared components to semantic roles.
3. Migrate core-owned styles while retaining the current drawer geometry.
4. Migrate accessibility-owned components/styles without changing audit output.
5. Add `a11yDevtoolsPlugin()` and `A11yAuditFixture` to the React basic development example.
6. Implement the 36/32/minmax Workbench grid, banner navigation, horizontal strip, and additive resize-separator keyboard behavior.
7. Remove only unused core literals/raw ramps. Retain shared legacy raw keys and exempt external/vendor/simulated SEO colors.
8. Apply the documentation impact below. No public theme API documentation is added.

## Documentation Impact

- Update `docs/architecture.md` in its Core Layer description and diagram labels: document the 36px banner, explicit Plugins/SEO/Settings destinations, horizontal Plugins strip with vertical expansion, equal-width multi-plugin mounts, and private `@tanstack/devtools-ui/internal` dependency. This serves contributors tracing shell ownership and plugin mounting.
- Update `docs/overview.md` in Core and Key Features: describe the banner navigation, horizontal Plugins strip, simultaneous plugin panes, Marketplace destination, and light/dark TanStack styling. This serves evaluators learning what the shell exposes.
- Do not change `docs/plugins/a11y.md`: the package install, exact `a11yDevtoolsPlugin()` call, audit behavior, severity model, and public configuration remain unchanged. The deterministic basic-example fixture is test-only example content, not an accessibility-plugin user workflow. A visual-theme-only edit would add no user action to this page.
- Update `examples/react/basic/README.md`: use the repository's pnpm filter command, state that browser audit testing requires Vite development mode, identify `A11yAuditFixture` as intentionally invalid development-only content, and list the three expected axe rule IDs. This serves contributors reproducing the browser matrix.

## Test Strategy

Tests are grouped by unit, integration, and browser scope. Each category includes happy, edge, and failure coverage. Existing test paths are extended instead of creating a second test framework.

### Unit

| Case | Path | Assertions |
|---|---|---|
| Happy | New `packages/devtools-ui/tests/semantic-theme.test.ts` | Exact role values, light/dark resolution, 120ms motion, raw `tokens.colors`/`Tag` key retention, `/internal` types and exports, two emitted font files, and <=160 KiB font total |
| Happy | New `packages/devtools-ui/tests/contrast.test.ts` | Every white and `#fafafa` text case separately, including the exact `#3e3529` and `#003e53` ratios; dark workspace; all five subtle and `solidFill`/`onFill` roles in both modes; syntax; selection foreground switching; focus; and control borders |
| Edge | Existing `packages/devtools-ui/tests/index.test.ts` and `tree.tsx` | All exported component states, string/custom plugin-name typography boundary helpers, theme propagation, disabled/focus states, and system-monospace retention |
| Failure | New `packages/devtools-ui/tests/fonts.test.ts` | Missing font request leaves declared system-sans fallbacks, duplicate registration is idempotent, popup registration targets the popup document, and license files/provenance metadata exist |
| Happy | Existing `packages/devtools-a11y/tests/index.test.ts` and `export.test.ts` | Semantic theme consumption and unchanged React/Solid/Angular plugin exports |
| Edge/error | Existing `packages/devtools-a11y/tests/config.test.ts` | Four audit severities map to labeled semantic status treatments; invalid/missing persisted config retains current fallback behavior |

### Integration

| Case | Path | Assertions |
|---|---|---|
| Happy | New `packages/devtools/tests/workbench.test.tsx` | Every normative navigation row; explicit Plugins destination; 1–3 equal-width mounts; static separators; Settings/SEO/Marketplace/PiP; live IDs and callback heading |
| Edge | `packages/devtools/tests/workbench.test.tsx` | Zero registered versus registered-zero-active; fourth inactive selection from Plugins/SEO/Settings; 32/48px strip; 400ms grace; focus leave/re-entry; 69/70/83/84px; `<=360px`; top/bottom placement |
| Failure | `packages/devtools/tests/workbench.test.tsx` | Rejected fourth plugin leaves three IDs/order; blocked `window.open` preserves current thrown error; callback/render exceptions retain current fail-loud behavior; no extra destroy calls; timers clean up on unmount |
| Happy | Existing `packages/devtools/tests/index.test.ts` | Default/custom trigger, URL flag, open hotkey, Escape, source inspector, theme, close/reopen persistence, pointer whole-panel resize, and additive keyboard separator |
| Edge/error | Existing `packages/devtools/tests/index.test.ts` | Malformed storage fallback, storage write failure, `<70px` close, 90%-viewport attached maximum, separator omission in PiP, exact pre-detach height after reattachment, mount aborted before dynamic import, and existing repeated mount/unmount errors |
| Happy | Existing `packages/devtools/src/context/devtools-context.test.ts` | Explicit/generated IDs, registration and activation order, default-open, stored ID filtering, reactive plugin replacement, mount/remount, render input changes, and destroy-only-on-toggle |
| Failure | Existing `packages/devtools/src/context/devtools-context.test.ts` | Removed plugin IDs are filtered, duplicate/generated IDs retain existing behavior, malformed stored state falls back through the existing parser, and a plugin replacement cannot reorder retained active IDs |
| Happy/error | Existing `packages/devtools-a11y/tests/index.test.ts` plus example type/build | Exact React factory call works in development; production remains no-op; deterministic rule IDs are declared without timers/network |

### Browser

Use `pnpm --filter @tanstack/devtools-example-react-basic dev` and browser automation. Before every independent scenario, run the following in the page, then reload and wait for the app and Devtools event bus:

```js
localStorage.removeItem('tanstack_devtools_settings')
localStorage.removeItem('tanstack_devtools_state')
localStorage.removeItem('pip_open')
localStorage.removeItem('tanstack-devtools-a11y-config')
location.reload()
```

| Case | Matrix and assertions |
|---|---|
| Happy | Light and dark at 1280×720: trigger/reveal, explicit Plugins/SEO/Settings destinations, Marketplace, one and three active plugins, equal widths/static separators, A11y audit with `image-alt`/`button-name`/`label`, Detach/PiP with no resize separator, exact pre-detach height after return, close/reopen, and zero console errors |
| Edge | Light and dark at 360×480 and 320×400; panel heights 70, 83, 84, and 400px; 200% zoom; keyboard-only strip overflow; 400ms focus/pointer grace; reduced motion; top/bottom panel placement; three panes; owner colors unchanged in Query/Router/PackageJsonPanel |
| Failure | 69px pointer/keyboard resize closes the attached panel; a blocked popup follows the current error path without changing active state; failed font requests render system-sans controls without clipping; production build exposes the no-op accessibility plugin; native expanded select remains platform-styled |
| Forced colors | With `forced-colors: active`, create hidden reference elements authored with each required system-color pair. Compare computed surface, control, and selected-plugin colors to the corresponding reference element, because browsers may resolve keywords to RGB values. If the automation environment cannot expose forced-color computed values, assert the authored forced-colors CSS plus keyboard/state behavior. Never compare computed values to literal keyword strings. Also assert that text/state remains present when authored colors/background images are suppressed and that focused controls, inputs, checkboxes, static pane separators, and the attached resize separator have a system-color border at least 1 CSS px wide. |

Run focused tests first. Then run Prettier check, affected ESLint, typecheck, package builds, publint, example build, `pnpm test:docs`, font asset-count/byte check, and `pnpm size`. The final repository gate is the root command `pnpm run test`. All commands are native Windows one-shots; no watch, Vite, Node, esbuild, or Vitest process remains afterward.

## Risks and controls

- Mixed raw/semantic styles: search only the in-scope concrete files and fail review on non-exempt color literals.
- Plugin selector bleed: prohibit descendant typography/color rules below plugin mount IDs and compare external plugin screenshots before/after.
- Font size increase: include only listed weights/formats and enforce `pnpm size` plus package build output review.
- Height regression: test exact 69/70/83/84px boundaries and both top/bottom placement.
- Lifecycle regression: assert callback counts and DOM IDs across every navigation row.
- Development-only a11y behavior: require Vite development mode for audit browser tests and separately verify the production build remains no-op.

## Acceptance criteria

- [ ] `@tanstack/devtools-ui/internal` is emitted, typed, publint-valid, and not re-exported from the package root.
- [ ] Core and accessibility resolve the exact semantic tables through `/internal`; all legacy `tokens.colors` and `Tag` color keys remain.
- [ ] Exactly `BricolageGrotesque-Bold.ttf` and `Inter-latin.woff2` plus the two verified OFL files are packaged; both font faces use `font-display: swap`, opener and PiP registration passes, fallback rendering passes, binary count is two, and raw binary total is <=160 KiB.
- [ ] `#3e3529` measures 12.03:1 on white and 11.52:1 on `#fafafa`; `#003e53` measures 11.58:1 on white and 11.09:1 on `#fafafa`; all five subtle and `solidFill`/`onFill` roles in both modes, syntax selection foregrounds, borders, focus, and muted-on-brand roles pass automated checks.
- [ ] Shared components, named core files, and named accessibility files have no non-exempt raw color literals after migration.
- [ ] External plugin descendants, PackageJsonPanel, vendor marks, and simulated SEO colors retain owner/source styling.
- [ ] Grid rows are 36px, 32/48px, and `minmax(0,1fr)`; CSS motion is 120ms and leave grace is 400ms.
- [ ] Heights 70–83px use 36/32px compact mode; 84px enables expansion; a drag result below 70px closes the whole panel with existing persistence semantics.
- [ ] At widths `<=360px`, the visible wordmark is removed and the accessible “TanStack Devtools” name remains.
- [ ] Zero to three plugins follow the navigation table, render at equal width with static 1px separators, and expose no per-pane resizing.
- [ ] Zero registered plugins renders Marketplace; registered-zero-active renders its separate workspace state and forces strip expansion outside compact-height mode.
- [ ] Selecting a fourth inactive plugin from Plugins, SEO, or Settings enters Plugins, closes Marketplace, retains the same three IDs/order, and renders the same three mounts. IDs, callback element type, render/destroy behavior, mount behavior, and `MAX_ACTIVE_PLUGINS` remain compatible.
- [ ] Explicit Plugins, SEO, Settings, Marketplace, close, theme, and PiP transitions match the normative table; Plugins/SEO/Settings expose `aria-current="page"`.
- [ ] Each plugin control is a `role="button"`/`tabIndex="0"` wrapper with Enter/Space, `aria-labelledby`, and `aria-pressed`; callback-owned heading subtrees have no core typography or foreground override.
- [ ] Attached whole-panel pointer resizing is unchanged; keyboard directions match top/bottom attachment and max/now/End use 90% attached height. PiP has no resize separator, stays `100vh`, and reattachment restores the exact pre-detach stored height.
- [ ] Forced-colors tests compare computed values with hidden system-color reference elements or verify authored CSS plus behavior; reduced-motion, keyboard-only, 200% zoom, horizontal overflow, focus, font-failure, and blocked-popup tests pass.
- [ ] React basic calls `a11yDevtoolsPlugin()` in development and the deterministic fixture yields `image-alt`, `button-name`, and `label`.
- [ ] Each browser scenario clears `tanstack_devtools_settings`, `tanstack_devtools_state`, `pip_open`, and `tanstack-devtools-a11y-config`, reloads, and then begins assertions.
- [ ] `docs/architecture.md`, `docs/overview.md`, and `examples/react/basic/README.md` contain the specified updates; `docs/plugins/a11y.md` remains unchanged for the recorded rationale.
- [ ] Unit, integration, browser, formatting, ESLint, typecheck, build, publint, docs links, asset-size, `pnpm size`, and final root `pnpm run test` checks pass with no remaining test/server processes.
