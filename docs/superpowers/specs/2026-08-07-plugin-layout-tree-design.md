# Plugin Workspace Layout Tree, Drag and Drop, and Resizing

- **Date:** 2026-08-07
- **Status:** Design agreed, not yet implemented
- **Scope:** `@tanstack/devtools`, `@tanstack/devtools-e2e`, and the e2e apps
- **Depends on:** PR #492 (`codex/tanstack-devtools-workbench`) merged first
- **Supersedes:** the non-goal in `2026-07-31-tanstack-devtools-branding-design.md` that reads "No per-pane splitter or per-pane resizing is added. Plugin panes remain equal-width."

## Context

The Plugins destination shows active plugin panes in one flex row. Each pane is `flex: 1 1 0px`, separators are decorative, and `MAX_ACTIVE_PLUGINS` is 3. Pane order comes from `state.activePlugins`, which is the only record of which plugins are open.

Users want to open up to 9 plugins, arrange them in splits and stacks, resize them, and rearrange them by dragging. `@neodrag/solid` supplies the interaction layer.

Two properties of the existing code constrain every decision below.

**Plugins own their DOM.** `plugin.render(mount, props)` hands a mount node to third-party code. `examples/react/basic/src/setup.tsx:89` registers a plugin whose whole body is `<iframe src="http://localhost:3005" />`. Moving a DOM node to a different parent reloads any iframe inside it and can drop canvas or WebGL contexts. `display: none` does not.

**jsdom has no layout engine.** `getBoundingClientRect()` returns zeros and `clientWidth` is 0. Existing tests mock both. Any rect maths verified only through jsdom is verifying its own mocks.

## Goals

- Replace the flat pane row with a layout tree of splits and tab groups.
- Raise the active plugin ceiling from 3 to 9.
- Drag a tab to reorder it, move it to another group, or split a pane.
- Drag a splitter to resize, with pixel sizes held in the tree.
- Give every pointer interaction a keyboard equivalent.
- Keep plugin DOM alive across every rearrangement.
- Migrate existing persisted state with no user-visible loss.

## Non-goals

- No change to the plugin registration API, `plugin.render`, or `plugin.destroy` signatures.
- No change to the Plugins strip's meaning. It stays the answer to "which plugins are open"; group tab bars answer "which tab is active in this cell".
- No drag handle on pane bodies. Only tabs and splitters are draggable, so plugin-owned interactions are never hijacked.
- No pointer drag, split, or resize while detached into PiP. Keyboard paths stay available.
- No `createResizable`. It sets an element's own width and height, which would compete with the tree as a second source of truth.
- No `createSortable` on pane bodies. It applies only to tab bars.

## Chosen approach

### 1. Layout tree, persisted, single source of truth

```ts
type LayoutNode =
  | { kind: 'group'; id: string; tabs: string[]; active: number }
  | { kind: 'split'; dir: 'row' | 'col'; sizes: number[]; children: LayoutNode[] }

// state.layout: LayoutNode | null   <- the only truth
```

`activePlugins` becomes derived and is no longer persisted:

```ts
const activePlugins = createMemo(() => flattenTabs(store.state.layout))
```

The strip, the render effect, and `getDefaultActivePlugins` keep reading `activePlugins`, so they do not change.

Migration, on read, once: state with `activePlugins` and no `layout` becomes a single group.

```ts
if (!parsed.layout && parsed.activePlugins?.length)
  parsed.layout = { kind: 'group', id: 'g0', tabs: parsed.activePlugins, active: 0 }
```

Rejected: keeping both `activePlugins` and `layout` as parallel state. Two sources drift, and the reconcile step becomes load-bearing logic with no owner.

### 2. Flat DOM, panes positioned from computed rects

Every pane is a direct child of one container for its entire life and never re-parents. The tree is walked to a rect per pane and applied inline.

```tsx
<div class={styles().pluginsWorkspace} style={{ position: 'relative' }}>
  <For each={openPluginIds()}>{(id) => <Pane id={id} rect={rects()[id]} />}</For>
</div>
```

This is what keeps the example's iframe plugin alive across a drag. It also produces the rect maths that drop-zone hit-testing needs anyway.

Inactive tabs in a stack are hidden with `display: none`, which does not reload an iframe.

Rejected: nested containers with `appendChild` re-parenting (reloads the iframe on every move), and letting Solid recreate the node and calling `plugin.render` again (discards plugin state, breaks the existing no-destruction guarantee).

### 3. All tree mutation is pure

One module, no DOM imports:

```ts
// src/utils/layout-tree.ts
export const splitAt      = (t: LayoutNode, paneId: string, zone: Zone, dragId: string) => LayoutNode
export const stackInto    = (t: LayoutNode, paneId: string, dragId: string) => LayoutNode
export const moveTab      = (t: LayoutNode, tabId: string, toGroup: string, index: number) => LayoutNode
export const resize       = (t: LayoutNode, path: number[], delta: number) => LayoutNode
export const closeTab     = (t: LayoutNode, tabId: string) => LayoutNode
export const canSplit     = (t: LayoutNode, paneId: string, zone: Zone, min: Size) => boolean
export const layoutRects  = (t: LayoutNode, box: Size) => Record<string, Rect>
export const repairLayout = (raw: unknown, known: Set<string>) => LayoutNode | null
```

Components hold no layout maths. This is what makes the feature testable at all, given jsdom.

### 4. neodrag's actual role

Settled by measurement and by reading the published `3.0.0-next.10` types. **The docs site is out of sync with the published package** — it omits the `./drop`, `./sortable`, `./splitpane`, `./resize`, `./rotate`, `./panzoom`, `./select`, `./swipe` subpaths, documents a `snapToGrid` export that does not exist (the real one is `snapGuides`), and does not mention `createSplitPane` at all. Trust the `.d.ts` files, not the docs.

| Primitive | Used for | Why |
| --- | --- | --- |
| `createDraggable` | tabs and splitters | The engine base. `axis`-constrained on splitters; the delta feeds `resize()`. |
| `createDroppable` (`@neodrag/solid/drop`) | pane bodies and tab bars | `accepts` filters on `dragData`; quadrant and insertion index derived from `input` in `onOver`. Sub-zones within one element are not a feature, so we compute them. |
| `ghost`, `autoScroll({container})`, `scrollLock`, `ariaDrag` | extras | `ghost` matters most: the original stays put, which is required because the tree positions panes. |
| `createSortable` (`@neodrag/solid/sortable`) | group tab bars | Data-first and state-controlled: it "reports reordering operations back to your component" rather than mutating the DOM. `group: 'tsd-panes'` plus `onTransfer` gives cross-group tab moves, and FLIP animation comes free. Tabs are cheap DOM, so nothing heavy moves. Costs 6.04 kB, accepted by raising the size limit to 65 kB. |
| ~~`createSplitPane`~~ | **not used** | Cannot integrate with the flat DOM, and buys nothing. `gutter()` needs a registered `container` **element** per split to compute `container_px()`, and our flat DOM has no per-split elements. `pane()` is the only caller of `ensureCount` and it stamps `overflow:hidden`, `minWidth:0`, `minHeight:0`, and `flex` onto the element — which would break the per-pane `overflow-y: auto` that `workbench.test.tsx` asserts. Its conserved-budget maths is exactly our `resize()` reducer. |
| ~~`createResizable`~~ | **not used** | Sets an element's own width and height, competing with the tree for ownership of size. |

`use` is a static array built once per binding, so extras must read live state through closures rather than captured primitives. Note also that the Solid `createSplitPane` adapter silently overwrites any `onChange` you pass; live values come from the returned `sizes()` accessor. Not relevant now that we do not use it, but the same shadowing pattern may apply elsewhere in the adapter layer.

### 4a. Measured bundle cost

Baseline `packages/devtools/dist/index.js` is 45.41 kB against a 60 kB limit — 14.6 kB of headroom. Measured on `3.0.0-next.10`, minified and brotlied, each variant built through the real entry point so nothing tree-shakes away:

| Imported | Total | Marginal |
| --- | --- | --- |
| baseline | 45.41 kB | — |
| `createDraggable` alone | 50.69 kB | +5.28 |
| \+ `ghost`, `autoScroll`, `scrollLock`, `ariaDrag` | 51.94 kB | +1.25 |
| \+ `createDroppable` | 52.97 kB | +2.28 |
| \+ `createSortable` | 56.73 kB | **+6.04** |
| \+ `createSplitPane` | 51.71 kB | +1.02 |
| draggable + 4 extras + droppable | 54.22 kB | +8.81 |
| **chosen set** (the above plus `createSortable`) | **61.04 kB** | **+15.63** |

**Decision:** keep `createSortable` for its cross-list transfer and FLIP animation, and raise the size limit from 60 kB to **65 kB**, leaving 3.96 kB of headroom. The alternative — dropping Sortable for 54.22 kB and reimplementing reorder on the `moveTab()` reducer — was measured and rejected: it saves 6.04 kB but loses reorder animation, which is a core part of the UX this feature exists to improve.

`createSplitPane` and `createResizable` stay out for the architectural reasons above, not for size.

### 5. Drop resolution degrades rather than refuses

```ts
const MIN_CELL = { w: 280, h: 160 }

onDrop: ({ data, input }) => {
  const zone = quadrant(input, rectOf(paneId))
  const fits = zone === 'center' || canSplit(layout(), paneId, zone, MIN_CELL)
  setState({ layout: fits
    ? splitAt(layout(), paneId, zone, data.id)
    : stackInto(layout(), paneId, data.id) })
}
```

The panel is 400px tall by default and chrome takes `WORKBENCH_HEADER_HEIGHT` (36) plus `PLUGINS_STRIP_HEIGHT` (44), leaving about 320px. Three rows with a tab bar each would give every plugin about 79px of content. Rather than refuse the gesture, a drop with no room to split becomes a stacked tab, which costs no space. The drop overlay states which will happen before release.

### 6. Lifecycle is derived, not called

`plugin.destroy()` is invoked in exactly one place:

```tsx
const Pane = (props: { id: string }) => {
  onCleanup(() => pluginById(props.id)?.destroy?.(props.id))
  return <div data-plugin-mount ref={register(props.id)} />
}
```

Exactly-once by construction, and it runs before Solid detaches the node, so the plugin can still tear down its own DOM. Reorders do not fire it because the key is unchanged. Every close path is then a plain tree edit, and pruning an empty split destroys nothing.

This also removes the current side effect inside the `setStore` updater in `toggleActivePlugins`.

### 7. Keyboard parity

Splitters reuse the pattern already in `content-panel.tsx`: `role="separator"`, `tabIndex={0}`, `aria-valuemin`/`valuemax`/`valuenow`, and `ArrowUp`/`ArrowDown`/`Home`/`End` with a shift-modifier step.

Tabs get a move mode: `Enter` picks up, arrows move or split, `Enter` drops, `Escape` cancels. `ariaDrag` announces state through a live region.

Sortable's keyboard support is undocumented, so the keyboard path is ours and does not depend on it.

### 8. Bad state is repaired, never thrown

Storage **access** errors keep propagating, matching `getStateFromLocalStorage`. A malformed tree is a data problem, like the unknown plugin id that is already pruned today, so `repairLayout` prunes dead ids, drops empty groups, collapses single-child splits, renormalises sizes, and falls back to a single group built from whatever valid ids it found. It cannot throw.

### 9. PiP

`gesturesEnabled = () => pip().pipWindow === null`, the same guard `content-panel.tsx` already applies to the resize separator. Keyboard handlers stay bound in both windows because `pip-context.tsx:117` delegates `keydown` to the PiP document.

## Open risks

1. ~~**Bundle size is unmeasured.**~~ **Resolved 2026-08-07.** Measured at 61.04 kB for the chosen set; the size limit moves 60 kB → 65 kB as a deliberate decision. See 4a. Consumers pay 15.63 kB for the feature.
2. **The version is a prerelease.** Pin `3.0.0-next.10` exactly; do not float on `@next`. `latest` is still `2.3.1`, so v3 is unreleased and its API is visibly still moving — the published exports already differ from the documentation.
3. **The engine may not reach the PiP document.** All classes register into a "single process-wide engine instance" whose document binding is undocumented, and Solid's `delegateEvents` does not help a library that calls `document.addEventListener` itself. Mitigated by decision 9, and worth confirming in the same spike.
4. **Sub-zones are not a documented Droppable feature.** Quadrants are derived from `input`, so we depend only on pointer position being reported.

## Test impact

Displaced by the new layout, all in `packages/devtools`:

- `tests/workbench.test.tsx:1260` "keeps equal-width frames and static separators for three active plugins"
- `tests/workbench.test.tsx:1069` "preserves destination transitions and rejects a fourth plugin without destroying"
- `src/context/devtools-context.test.ts:189` limit of 3
- `src/utils/get-default-active-plugins.test.ts:71` and `:163` limit of 3
- `src/tabs/plugins-tab.tsx:64` empty-state hint text naming the limit

New:

- `src/utils/layout-tree.test.ts` — exhaustive pure coverage of every reducer, including deep nesting, closing the last tab in a nested group, pruning that collapses two levels, size renormalisation, and `repairLayout` against malformed input.
- e2e in `e2e/apps/react-vite/tests/` with page-object helpers added to `e2e/helpers/src/page-objects/devtools.ts` so all eight apps can use them: drag a tab to each of the five zones, splitter drag, keyboard move mode, keyboard resize, and iframe survival (assert the iframe's `contentWindow` did not reload after a drag).

## Doc impact

- `docs/overview.md` — the pane model and the new ceiling.
- `docs/plugin-lifecycle.md` — when `destroy` fires now that it is derived from pane teardown.
- `docs/configuration.md` — any new persisted state surfaced to users.
- New page for the workspace layout: splits, stacks, keyboard shortcuts, and the min-cell degradation rule.
- Changeset for `@tanstack/devtools`: minor, covering the new state shape and the migration.

## Delivery

Branch `feat/plugin-layout-tree` off `codex/tanstack-devtools-workbench`, opened as a second PR once #492 merges. #492 stays the redesign; this stays the layout engine.

Order of work:

1. ~~Size-limit spike and version pin.~~ **Done.** 61.04 kB; limit raised to 65 kB; see 4a.
2. `layout-tree.ts` plus its tests, with no UI wired up.
3. State shape, migration, `repairLayout`, derived `activePlugins`.
4. Flat DOM and rect positioning, replacing the flex row. Raise the ceiling to 9.
5. Splitters: pointer and keyboard.
6. Tab bars: Sortable, cross-group transfer, keyboard move mode.
7. Pane drop zones with quadrant resolution and the degrade-to-stack rule.
8. e2e coverage and docs.
