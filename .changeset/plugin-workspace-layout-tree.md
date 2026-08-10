---
'@tanstack/devtools': minor
---

feat: arrange plugin panes in splits and stacked tabs, drag and resize them, and raise the limit to eighteen

The Plugins destination is now a workspace instead of a fixed row. Panes can sit side by side, above and below each other, or stacked as tabs in one group, and the arrangement is a tree that persists across reloads along with each pane's size and which tab is selected. Up to eighteen plugins can be open, up from three, because a stacked tab costs no space.

Drag a pane's tab onto the edge of another pane to split it, onto its middle to stack, or onto another tab bar to move it there. Drag the gutter between two panes to resize: one grows by exactly what the other loses, and neither can shrink below a readable minimum. Where the panel is too short to split without leaving an unreadable cell, the same drop becomes a stacked tab rather than being refused. The tab being carried follows the cursor, and a highlight shows where it will land.

The Plugins strip now lists only the plugins that are _not_ open, so each plugin has exactly one control: its strip entry while closed, its pane tab once open. Entries can be dragged out of the strip to place a pane exactly where you want it instead of appending it, including onto an empty workspace, where it takes the whole area. The strip folds itself away once everything is open and returns when a plugin closes.

Every one of those actions has a keyboard equivalent, because the pointer gestures are suppressed while the panel is detached into a picture-in-picture window. `Enter` picks a pane up, the arrow keys choose where it goes, `Enter` drops it and `Escape` puts it back; gutters take arrow keys, `Shift`-arrow and `Home`/`End`, the same pattern the whole-panel resizer already used. Picking up and dropping is announced to screen readers.

For plugin authors, two guarantees are now explicit. A pane's mount node is never removed from the document while the plugin is open, whatever the user does to the layout, so an `<iframe>` will not reload and a `<canvas>` will not lose its context. And `destroy` is called exactly once, when the plugin closes, before the node is detached — not when a pane is moved, resized, or hidden by navigating to another destination.

`state.activePlugins` in `localStorage` is superseded by `state.layout`. Existing state is migrated on first read, reopening as a single group in the order it recorded, and an arrangement that cannot be read is repaired rather than throwing: unknown plugin ids are dropped, empty groups close up, and a wholly unusable entry falls back to reopening whatever plugins it can still identify.
