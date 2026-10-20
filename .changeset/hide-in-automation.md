---
'@tanstack/devtools': minor
---

Add the `hideInAutomation` config option. When it is `true`, the devtools do not render in a browser that automation drives (Playwright, Cypress, Selenium), detected by `navigator.webdriver`. This keeps the devtools out of end-to-end test selectors. The default is `false`.
