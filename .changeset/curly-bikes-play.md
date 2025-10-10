---
'@tanstack/devtools-event-client': patch
'@tanstack/devtools-client': patch
'@tanstack/devtools-vite': patch
'@tanstack/devtools': patch
---

Number of improvements to various parts of the DevTools:

- Update event client to allow users to disable it
- Allow trigger to be completely hidden
- Add a new package `@tanstack/devtools-client` to allow users to listen to events we emit from Vite.
- Fix bugs inside of the DevTools like plugins being nuked on page refresh.
