---
'@tanstack/devtools': minor
---

Add the `openAsModal` config option. A dialog opened with `dialog.showModal()` makes the devtools inert. With this option, the open panel moves on top of such a dialog and takes input, and the app dialog is inert until the panel closes. Open the panel with the open hotkey while the dialog is open.
