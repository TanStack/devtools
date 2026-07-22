---
'@tanstack/devtools': minor
---

Add a floating trigger mode. Set `triggerMode: 'floating'` (or choose it under
Settings → Trigger Mode) to drag the devtools trigger anywhere on screen with
the left mouse button. Releasing a drag with velocity throws it — it glides with
momentum and springs back off the screen edges. The trigger is always kept
within a padded, on-screen area (it can never end up off-screen) and its
position is persisted to local storage.
