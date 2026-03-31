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