/**
 * Maximum number of plugins that can be active simultaneously in the devtools.
 *
 * The workspace arranges them in a tree of splits and stacked tabs, so this is
 * a cap on how many can be *open*, not on how many fit side by side — a stacked
 * tab costs no space.
 */
export const MAX_ACTIVE_PLUGINS = 18

/**
 * Height of a group's tab bar, along the top edge of the group's rect. 4px of
 * padding around the tabs (a small gutter from the card edge) plus a 24px
 * close target, which is the WCAG 2.5.8 minimum.
 */
export const PLUGIN_GROUP_TAB_HEIGHT = 32
/** Space between a pane card and the workspace edge, and between cards. */
export const PANE_CARD_INSET = 8
/**
 * Thickness of the draggable gutter between two panes of a split. Matches
 * `PANE_CARD_INSET` so the middle gap equals the outer gap.
 */
export const PLUGIN_SPLITTER_SIZE = 8
/**
 * A pane smaller than this is not worth having. A drop that would breach it in
 * either axis becomes a stacked tab instead of a split, so the gesture always
 * produces something readable.
 */
export const MIN_PANE_SIZE = { w: 280, h: 160 }
/** How much of a pane's edge counts as a split zone rather than the centre. */
export const PANE_DROP_EDGE_RATIO = 0.25

export const WORKBENCH_HEADER_HEIGHT = 36
export const PLUGINS_STRIP_HEIGHT = 44
/**
 * The single inline gutter every workbench surface aligns to: the header, the
 * secondary tab strips and the content of each destination all start here, so
 * the left edge reads as one column instead of three.
 */
export const WORKBENCH_GUTTER = 16
/** Half gutter, used on narrow panels where 16px eats too much width. */
export const WORKBENCH_GUTTER_NARROW = 12
export const PANEL_CLOSE_THRESHOLD = 70
export const PANEL_MAX_VIEWPORT_RATIO = 0.9

/**
 * How close (in px, per axis) the floating trigger has to be to a corner for
 * that corner to go hot and pin the trigger on release.
 */
export const HOT_CORNER_SNAP = 72
/** Size of the quarter-circle mark painted in a hot corner. */
export const HOT_CORNER_MARK_SIZE = 112
/**
 * How long (ms) the floating trigger must be held still over a hot corner
 * before that corner is deactivated for the rest of the drag.
 */
export const HOT_CORNER_HOLD_MS = 800
/** Long side of the arrow tab docked on the edge the trigger was hidden off. */
export const TRIGGER_EDGE_TAB_LENGTH = 44
/** Minimum gap between the docked edge tab and the viewport ends. */
export const TRIGGER_EDGE_TAB_PAD = 8
