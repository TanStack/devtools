/**
 * Maximum number of plugins that can be active simultaneously in the devtools
 */
export const MAX_ACTIVE_PLUGINS = 3

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
