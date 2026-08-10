---
'@tanstack/devtools': minor
'@tanstack/devtools-ui': minor
'@tanstack/devtools-a11y': minor
---

feat: apply TanStack branding and the compact Workbench layout across core, shared UI, and accessibility Devtools

The Workbench now separates chrome from canvas: the header and the secondary strips paint the brand surface and share one 16px gutter with the content below them. The palm emblem is inline SVG instead of a filtered raster, plugin destinations get a real empty state, and the Marketplace, SEO, and Settings destinations drop their competing accent colours in favour of the semantic theme.

The secondary strip gets a pull tab on its bottom edge that folds the strip away behind the header, leaving the panel height and the destination content untouched. It only appears on destinations that have a strip.

The SEO tab's `<head>` watcher no longer reports `<style>` tags. It observes attributes and character data across the whole `<head>` subtree, and a CSS-in-JS library rewrites a `<style>` tag there on every render — so an SEO analysis triggered a re-render, the re-render emitted CSS, and the CSS triggered another analysis. Stylesheets carry no SEO metadata, so they are filtered out.

Fixes along the way: the resize handle had grown to 24px and sat on top of the header, so a press aimed at a header button started a resize instead of clicking; the Marketplace settings drawer was `position: fixed` and covered the host page instead of the Workbench; the floating trigger lost its brand fill on hover and its transition was overridden away; the "New" ribbon on a plugin card overlapped the card icon; scroll gestures inside the panel chained on to the host page; and the hotkey editor showed each shortcut's description as its heading and never rendered its title.
