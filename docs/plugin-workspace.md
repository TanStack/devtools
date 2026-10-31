---
title: Plugin workspace
id: plugin-workspace
---

The Plugins destination arranges open plugins in a workspace you can rearrange:
panes side by side, stacked on top of each other, or grouped as tabs. Up to
eighteen plugins can be open at once.

## Opening a plugin

The Plugins strip lists the plugins that are **not** open. Once a plugin has a
pane, its entry leaves the strip — the pane's own tab is where you select and
close it, so there is only ever one control for it.

- **Click** an entry to open it beside the others, sharing the space equally.
- **Drag** an entry down into the workspace to choose where it lands, using the
  same zones as below. Dropping onto an empty workspace gives it the whole area.

The strip folds itself away when everything is open, and comes back on its own the
moment a plugin closes and returns to it. A fold you make with the pull tab is
kept across reloads.

## Arranging panes

Each pane has a tab above it. **Click** a tab to bring that pane to the front of
its group; **drag** it to rearrange:

| Drop it on | Result |
| --- | --- |
| the left or right quarter of a pane | the pane splits into a column, and the tab takes the new side |
| the top or bottom quarter of a pane | the pane splits into a row |
| the middle of a pane | the tab joins that pane as a stacked tab |
| another pane's tab bar | the tab moves into that group, at the position you drop it |

A highlight shows where the pane will land before you let go, and the tab you are
carrying follows the cursor so it is clear which pane is moving.

Dropping on a tab bar always means "put it in this group" rather than splitting the
top edge, so the two gestures never compete for the same few pixels.

### When a pane is too small to split

The devtools panel is short, so splitting a small pane would leave both halves
unreadable. When there is not enough room, the same drop becomes a **stacked tab**
instead of being refused. Stacking costs no space, so every plugin stays usable in
a short panel. The highlight tells you which is about to happen.

At the default panel height a vertical split has no room at all, so drops on a top
or bottom edge stack instead. Drag the panel taller first if you want rows.

## Resizing

Each pane sits in a rounded card with a small gutter from the workspace edge.
Drag between cards to resize: the resize line appears on hover. One pane grows
by exactly what the other loses, and neither can shrink past a readable minimum.

## Keyboard

Everything above works without a pointer. This matters in a detached
picture-in-picture window, where the pointer gestures are deliberately turned off
(the same way the panel's own resize handle is) but the keyboard still works.

**Moving a pane** — focus a tab, then:

| Key | Action |
| --- | --- |
| `Enter` or `Space` | pick the pane up, or drop it if already held |
| `Arrow` keys | choose where it goes — a neighbouring pane, or a side of its own pane to split |
| `Escape` | put it back |

**Resizing** — focus a gutter, then:

| Key | Action |
| --- | --- |
| `Arrow` keys | move the gutter |
| `Shift` + `Arrow` | move it in larger steps |
| `Home` / `End` | push it as far as it will go |

Picking a pane up and putting it down is announced to screen readers.

## What persists

The arrangement is saved to `localStorage` and restored on reload, including which
tab is selected in each group and the size of every pane.

If a plugin is no longer registered, it is dropped from the saved arrangement and
the panes around it close up. If the saved arrangement cannot be read at all, the
devtools recover by reopening whichever plugins it can identify as a single group,
rather than refusing to open.

State saved by an older version, which recorded only *which* plugins were open,
reopens as one group in that order. This happens once and is then saved in the new
form.

## Notes for plugin authors

Panes are never re-parented. A plugin's mount node stays a child of the same
element for as long as the plugin is open, whatever you do to the layout, so an
`<iframe>` will not reload and a `<canvas>` will not lose its context when the user
drags panes around.

`destroy` is called when the plugin closes, once, and before its mount node is
removed — so the node is still there if you need to clean up inside it. Moving,
splitting, resizing and switching destinations do not call it. Navigating to
Marketplace, SEO or Settings leaves your pane mounted and hidden.

`render` is called again when the theme or the panel's open state changes, as
documented in [plugin lifecycle](./plugin-lifecycle.md).
