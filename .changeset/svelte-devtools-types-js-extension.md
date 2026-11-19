---
'@tanstack/svelte-devtools': patch
---

Import `./types` with a `.js` extension so the published declarations resolve under `moduleResolution: "NodeNext"` and `"Node16"`. Before this fix, those setups reported `TS2835` with `skipLibCheck: false`, and with `skipLibCheck: true` the `<TanStackDevtools />` props and the exported plugin types silently became `any`.
