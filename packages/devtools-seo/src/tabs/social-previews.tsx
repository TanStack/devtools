import { For, createSignal } from 'solid-js'
import { Section, SectionDescription } from '@tanstack/devtools-ui'
import { useSeoStyles } from '../utils/use-seo-styles'
import { useHeadChanges } from '../hooks/use-head-changes'
import type { SeoSectionSummary } from '../utils/seo-section-summary'
import type { SeoSeverity } from '../utils/seo-severity'

type SocialAccent =
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'discord'
  | 'slack'
  | 'mastodon'
  | 'bluesky'

const SOCIALS: Array<{
  network: string
  tags: Array<{ key: string; prop: string }>
  accent: SocialAccent
}> = [
  {
    network: 'Facebook',
    tags: [
      { key: 'og:title', prop: 'title' },
      { key: 'og:description', prop: 'description' },
      { key: 'og:image', prop: 'image' },
      { key: 'og:url', prop: 'url' },
    ],
    accent: 'facebook',
  },
  {
    network: 'X/Twitter',
    tags: [
      { key: 'twitter:title', prop: 'title' },
      { key: 'twitter:description', prop: 'description' },
      { key: 'twitter:image', prop: 'image' },
      { key: 'twitter:url', prop: 'url' },
    ],
    accent: 'twitter',
  },
  {
    network: 'LinkedIn',
    tags: [
      { key: 'og:title', prop: 'title' },
      { key: 'og:description', prop: 'description' },
      { key: 'og:image', prop: 'image' },
      { key: 'og:url', prop: 'url' },
    ],
    accent: 'linkedin',
  },
  {
    network: 'Discord',
    tags: [
      { key: 'og:title', prop: 'title' },
      { key: 'og:description', prop: 'description' },
      { key: 'og:image', prop: 'image' },
      { key: 'og:url', prop: 'url' },
    ],
    accent: 'discord',
  },
  {
    network: 'Slack',
    tags: [
      { key: 'og:title', prop: 'title' },
      { key: 'og:description', prop: 'description' },
      { key: 'og:image', prop: 'image' },
      { key: 'og:url', prop: 'url' },
    ],
    accent: 'slack',
  },
  {
    network: 'Mastodon',
    tags: [
      { key: 'og:title', prop: 'title' },
      { key: 'og:description', prop: 'description' },
      { key: 'og:image', prop: 'image' },
      { key: 'og:url', prop: 'url' },
    ],
    accent: 'mastodon',
  },
  {
    network: 'Bluesky',
    tags: [
      { key: 'og:title', prop: 'title' },
      { key: 'og:description', prop: 'description' },
      { key: 'og:image', prop: 'image' },
      { key: 'og:url', prop: 'url' },
    ],
    accent: 'bluesky',
  },
]

type SocialMeta = {
  title?: string
  description?: string
  image?: string
  url?: string
}

type SocialReport = {
  network: string
  found: Partial<SocialMeta>
  missing: Array<string>
}

function analyzeSocialReports(): Array<SocialReport> {
  const metaTags = Array.from(document.head.querySelectorAll('meta'))
  const reports: Array<SocialReport> = []

  for (const social of SOCIALS) {
    const found: Partial<SocialMeta> = {}
    const missing: Array<string> = []
    for (const tag of social.tags) {
      const meta = metaTags.find(
        (m) =>
          (tag.key.includes('twitter:')
            ? false
            : m.getAttribute('property') === tag.key) ||
          m.getAttribute('name') === tag.key,
      )

      if (meta && meta.getAttribute('content')) {
        found[tag.prop as keyof SocialMeta] =
          meta.getAttribute('content') || undefined
      } else {
        missing.push(tag.key)
      }
    }
    reports.push({ network: social.network, found, missing })
  }
  return reports
}

/**
 * Builds a summary of missing social meta tags per network for the SEO overview.
 */
export function getSocialPreviewsSummary(): SeoSectionSummary {
  const reports = analyzeSocialReports()
  const issues: Array<{ severity: SeoSeverity; message: string }> = []
  let networksWithGaps = 0

  for (const report of reports) {
    if (report.missing.length === 0) continue
    networksWithGaps += 1
    const titleMissing = report.missing.some((k) => k.includes('title'))
    const descOrImageMissing = report.missing.some(
      (k) => k.includes('description') || k.includes('image'),
    )
    const severity: SeoSeverity = titleMissing
      ? 'error'
      : descOrImageMissing
        ? 'warning'
        : 'info'
    issues.push({
      severity,
      message: `${report.network}: missing ${report.missing.join(', ')}`,
    })
  }

  const hint =
    networksWithGaps === 0
      ? 'All checked networks have core tags'
      : `${networksWithGaps} network(s) missing tags`

  return { issues, hint }
}

function socialAccentClasses(
  s: ReturnType<ReturnType<typeof useSeoStyles>>,
  accent: SocialAccent,
): { card: string; header: string } {
  switch (accent) {
    case 'facebook':
      return {
        card: s.seoSocialAccentFacebook,
        header: s.seoSocialHeaderFacebook,
      }
    case 'twitter':
      return {
        card: s.seoSocialAccentTwitter,
        header: s.seoSocialHeaderTwitter,
      }
    case 'linkedin':
      return {
        card: s.seoSocialAccentLinkedin,
        header: s.seoSocialHeaderLinkedin,
      }
    case 'discord':
      return {
        card: s.seoSocialAccentDiscord,
        header: s.seoSocialHeaderDiscord,
      }
    case 'slack':
      return { card: s.seoSocialAccentSlack, header: s.seoSocialHeaderSlack }
    case 'mastodon':
      return {
        card: s.seoSocialAccentMastodon,
        header: s.seoSocialHeaderMastodon,
      }
    case 'bluesky':
      return {
        card: s.seoSocialAccentBluesky,
        header: s.seoSocialHeaderBluesky,
      }
  }
}

function SocialPreview(props: {
  meta: SocialMeta
  network: string
  accent: SocialAccent
}) {
  const styles = useSeoStyles()
  const s = styles()
  const accent = socialAccentClasses(s, props.accent)

  return (
    <div class={`${s.seoPreviewCard} ${accent.card}`}>
      <div class={`${s.seoPreviewHeader} ${accent.header}`}>
        {props.network} Preview
      </div>
      {props.meta.image ? (
        <img src={props.meta.image} alt="Preview" class={s.seoPreviewImage} />
      ) : (
        <div class={`${s.seoPreviewImage} ${s.seoPreviewImagePlaceholder}`}>
          No Image
        </div>
      )}
      <div class={s.seoPreviewTitle}>{props.meta.title || 'No Title'}</div>
      <div class={s.seoPreviewDesc}>
        {props.meta.description || 'No Description'}
      </div>
      <div class={s.seoPreviewUrl}>
        {props.meta.url || window.location.href}
      </div>
    </div>
  )
}

export function SocialPreviewsSection() {
  const [reports, setReports] = createSignal<Array<SocialReport>>(
    analyzeSocialReports(),
  )
  const styles = useSeoStyles()

  useHeadChanges(() => {
    setReports(analyzeSocialReports())
  })

  return (
    <Section>
      <SectionDescription>
        See how your current page will look when shared on popular social
        networks. The tool checks for essential meta tags and highlights any
        that are missing.
      </SectionDescription>
      <div class={styles().seoPreviewSection}>
        <For each={reports()}>
          {(report, i) => {
            const social = SOCIALS[i()]
            return (
              <div>
                <SocialPreview
                  meta={report.found}
                  accent={social!.accent}
                  network={social!.network}
                />
                {report.missing.length > 0 ? (
                  <>
                    <div class={styles().seoMissingTagsSection}>
                      <strong>Missing tags for {social?.network}:</strong>

                      <ul class={styles().seoMissingTagsList}>
                        <For each={report.missing}>
                          {(tag) => (
                            <li class={styles().seoMissingTag}>{tag}</li>
                          )}
                        </For>
                      </ul>
                    </div>
                  </>
                ) : null}
              </div>
            )
          }}
        </For>
      </div>
    </Section>
  )
}
