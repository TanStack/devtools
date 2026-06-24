---
'@tanstack/devtools-ui': patch
---

Fix `Checkbox` ignoring controlled `checked` prop updates. It previously read `checked` into internal state only once at mount, so it never reflected later prop changes when used as a controlled input (e.g. the devtools settings panel). It now reflects the `checked` prop whenever it is provided and falls back to internal state only when uncontrolled.
