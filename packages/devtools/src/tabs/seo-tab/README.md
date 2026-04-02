# SEO Tab Overview

## Overview

The seo tab contains major tabs that are complement to the inspect elements light house tab and not a replacement for them. It is a replacement for the extensions and simple tools you use to check and discover things by simply digging deeper in the html section, network or other pages in your site.

SEO tabs:

- Social Previews: shows open graph and twitter previews for you page when shared across social media apps.
- SERP Previews: shows you a similar preview of how your page will be displayed in search engine results page.
- JSON-LD Previews: shows you all the json ld detected in the page.
- Heading Structure Visualizer: preview your layout in heading tags.
- Links preview: check all page links and thier details like internal/external, text, ...
- Canonical & URL & if page is indexible and follow
- overview tab for SEO Score / Report: that contains a percentage of how everything is going in the other tabs and a small icon/link that will redirect them to the sepcific tab for more informations and details.

## Social Previews

Shows simulated share cards for major networks using metadata read from `document.head`.

Implemented networks and tag checks:

- Facebook, LinkedIn, Discord, Slack, Mastodon, Bluesky:
  - `og:title`, `og:description`, `og:image`, `og:url`
- X/Twitter:
  - `twitter:title`, `twitter:description`, `twitter:image`, `twitter:url`

How it works:

- Reads all `meta` tags from the current page head and maps matches into a per-network report.
- Renders one card per network with:
  - network header color,
  - preview image (or `No Image` placeholder),
  - title (`No Title` fallback),
  - description (`No Description` fallback),
  - URL (falls back to `window.location.href` when missing).
- Lists missing tags under each network in a dedicated "Missing tags" block.
- Subscribes to head updates via `useHeadChanges` and refreshes reports reactively.

## SERP Previews

Shows Google-style result snippets based on the current page title, description, favicon, URL, and site name.

Data sources:

- `document.title`
- `<meta name="description" ...>`
- `<meta property="og:site_name" ...>` (fallback: hostname without `www.`)
- `<link rel~="icon" ...>` for favicon (resolved to absolute URL when possible)
- `window.location.href`

Rendered previews:

- Desktop preview
- Mobile preview

Truncation and limits:

- Title truncated to `~60` characters for display.
- Description truncated to `~158` characters for display.
- Mobile description overflow check uses `~120` characters (3-line approximation).

Issue reporting:

- Shared checks:
  - missing favicon/icon,
  - missing title,
  - missing meta description,
  - title likely too long (message references width > 600px).
- Desktop-specific check:
  - meta description may be trimmed (desktop/mobile pixel-width guidance message).
- Mobile-specific check:
  - description exceeds mobile 3-line limit.

Like Social Previews, this section updates live through `useHeadChanges`.

## JSON-LD Previews

Parses all `script[type="application/ld+json"]` blocks available on the current page and displays each block as formatted JSON with validation output.

Current scan behavior:

- Non-reactive by design.
- The section scans and validates JSON-LD when the tab is opened.
- If page JSON-LD changes later, reopen the tab to rescan.

Supported schema types with dedicated manual validation rules:

- `WebSite`
- `Organization`
- `Person`
- `Article`
- `Product`
- `BreadcrumbList`
- `FAQPage`
- `LocalBusiness`

Validation model:

- Shared checks for every entity:
  - missing or invalid `@context` (expects Schema.org context),
  - missing `@type`,
  - invalid JSON syntax and invalid root shape.
- Type-specific checks:
  - missing required attributes -> `error`,
  - missing recommended attributes -> `warning`,
  - missing optional attributes -> `info`,
  - unknown/non-allowed attributes for that type -> `warning`.
- Unknown schema types still render parsed output and are reported as:
  - `warning`: no dedicated validator yet.

UI details:

- One card per JSON-LD block with:
  - detected type summary,
  - formatted parsed JSON (or raw content for parse errors),
  - copy action (`Copy parsed JSON-LD`),
  - grouped severity messages (`error`, `warning`, `info`).

JSON-LD health progress bar:

- Displayed when at least one JSON-LD block is found.
- Starts at `100%`.
- Decreases by:
  - `20` points per `error`,
  - `10` points per `warning`.
- `info` issues (optional missing attributes) do not reduce score.
- Score is clamped between `0` and `100`.

## Heading Structure Visualizer

Scans all heading tags (`h1` to `h6`) on the page and renders the hierarchy in DOM order.

Current behavior:

- Non-reactive scan when the section is opened.
- Shows each heading with indentation based on heading level.
- Displays a structure issue list with severity.

Checks included:

- No headings found (`error`)
- Missing `h1` (`error`)
- Multiple `h1` (`warning`)
- First heading is not `h1` (`warning`)
- Skipped heading levels, e.g. `h2` to `h4` (`warning`)
- Empty heading text (`warning`)

## Links Preview

Collects links from the page and reports their SEO/security-related characteristics.

Current behavior:

- Non-reactive scan when the section is opened.
- Detects `a[href]` links and excludes devtools UI links.
- Classifies links as `internal`, `external`, `non-web`, or `invalid`.

Checks included:

- Missing visible/accessibility text (`error`)
- `javascript:` links (`error`)
- Invalid URL format (`error`)
- External `_blank` link without `noopener` (`warning`)
- Unexpected protocol (`warning`)
- mailto, tel, and other non-web links (`info`)

## Canonical, URL, Indexability & Follow

Evaluates canonical URL setup, robots directives, and basic URL hygiene.

Current behavior:

- Non-reactive scan when the section is opened.
- Reads canonical links from `<head>`.
- Reads `robots` and `googlebot` meta directives.
- Derives indexability/follow from directives (`noindex`/`nofollow`).
- Includes a simple score (`100 - 25*errors - 10*warnings`).

Checks included:

- Missing canonical tag (`error`)
- Multiple canonical tags (`error`)
- Empty/invalid canonical href (`error`)
- Canonical with hash fragment (`warning`)
- Canonical cross-origin mismatch (`warning`)
- Page marked as `noindex` (`error`)
- Page marked as `nofollow` (`warning`)
- Missing robots directives (`info`)
- URL query parameters present (`info`)
