---
'@tanstack/devtools': minor
---

Handle every devtools keyboard shortcut with TanStack Hotkeys.

- **Breaking:** `openHotkey` is a hotkey string in TanStack Hotkeys syntax, such as `'Control+~'` (the default) or `'Mod+Shift+D'`. Arrays such as `['Control', '~']` are no longer accepted.
- **Breaking:** `inspectHotkey` takes modifier names only. `CtrlOrMeta` is now `Mod`, which is Command on macOS and Control on other platforms. The default is `['Shift', 'Alt', 'Mod']`.
- Saved settings in the old format are ignored, and the config or the default applies instead.
- The Settings tab records the open shortcut from a key press, and rejects a shortcut that the app already registered with TanStack Hotkeys.
- Escape no longer closes the devtools when it closes an open dialog or popover of the app. Escape while moving a pane with the keyboard cancels the move and leaves the panel open.
- Alt+M for magnetic trigger mode now works on macOS, and it no longer fires while you type in a text field.
- The devtools hotkeys are in the `tanstack-devtools` scope. In an app that also uses TanStack Hotkeys, an enabled devtools hotkey runs instead of the app's global hotkey for the same key, such as Escape while the panel is open. An app with an exclusive scope can keep the devtools hotkeys working with `exclusive: { allow: ['tanstack-devtools'] }`.
- `@tanstack/hotkeys` is a new dependency, and `@solid-primitives/keyboard` is removed. An app that already uses TanStack Hotkeys shares one hotkey manager with the devtools.
