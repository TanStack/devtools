import { For, createSignal } from 'solid-js'
import {
  MainPanel,
  Section,
  SectionDescription,
  SectionIcon,
  SectionTitle,
} from '@tanstack/devtools-ui'
import { SocialBubble } from '@tanstack/devtools-ui/icons'
import { useStyles } from '../styles/use-styles'
import { useHeadChanges } from '../hooks/use-head-changes'

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

const SOCIALS = [
  {
    network: 'Facebook',
    tags: [
      { key: 'og:title', prop: 'title' },
      { key: 'og:description', prop: 'description' },
      { key: 'og:image', prop: 'image' },
      { key: 'og:url', prop: 'url' },
    ],
    color: '#4267B2',
  },
  {
    network: 'X/Twitter',
    tags: [
      { key: 'twitter:title', prop: 'title' },
      { key: 'twitter:description', prop: 'description' },
      { key: 'twitter:image', prop: 'image' },
      { key: 'twitter:url', prop: 'url' },
    ],
    color: '#1DA1F2',
  },
  {
    network: 'LinkedIn',
    tags: [
      { key: 'og:title', prop: 'title' },
      { key: 'og:description', prop: 'description' },
      { key: 'og:image', prop: 'image' },
      { key: 'og:url', prop: 'url' },
    ],
    color: '#0077B5',
  },
  {
    network: 'Discord',
    tags: [
      { key: 'og:title', prop: 'title' },
      { key: 'og:description', prop: 'description' },
      { key: 'og:image', prop: 'image' },
      { key: 'og:url', prop: 'url' },
    ],
    color: '#5865F2',
  },
  {
    network: 'Slack',
    tags: [
      { key: 'og:title', prop: 'title' },
      { key: 'og:description', prop: 'description' },
      { key: 'og:image', prop: 'image' },
      { key: 'og:url', prop: 'url' },
    ],
    color: '#4A154B',
  },
  {
    network: 'Mastodon',
    tags: [
      { key: 'og:title', prop: 'title' },
      { key: 'og:description', prop: 'description' },
      { key: 'og:image', prop: 'image' },
      { key: 'og:url', prop: 'url' },
    ],
    color: '#6364FF',
  },
  {
    network: 'Bluesky',
    tags: [
      { key: 'og:title', prop: 'title' },
      { key: 'og:description', prop: 'description' },
      { key: 'og:image', prop: 'image' },
      { key: 'og:url', prop: 'url' },
    ],
    color: '#1185FE',
  },
  // Add more networks as needed
]
function SocialPreview(props: {
  meta: SocialMeta
  color: string
  network: string
}) {
  const styles = useStyles()

  return (
    <div
      class={styles().seoPreviewCard}
      style={{ 'border-color': props.color }}
    >
      <div class={styles().seoPreviewHeader} style={{ color: props.color }}>
        {props.network} Preview
      </div>
      {props.meta.image ? (
        <img
          src={props.meta.image}
          alt="Preview"
          class={styles().seoPreviewImage}
        />
      ) : (
        <div
          class={styles().seoPreviewImage}
          style={{
            background: '#222',
            color: '#888',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'min-height': '80px',
            width: '100%',
          }}
        >
          No Image
        </div>
      )}
      <div class={styles().seoPreviewTitle}>
        {props.meta.title || 'No Title'}
      </div>
      <div class={styles().seoPreviewDesc}>
        {props.meta.description || 'No Description'}
      </div>
      <div class={styles().seoPreviewUrl}>
        {props.meta.url || window.location.href}
      </div>
    </div>
  )
}
export const SeoTab = () => {
  const [reports, setReports] = createSignal<Array<SocialReport>>(analyzeHead())
  const styles = useStyles()

  function analyzeHead(): Array<SocialReport> {
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

  useHeadChanges(() => {
    setReports(analyzeHead())
  })

  return (
    <MainPanel withPadding>
      <Section>
        <SectionTitle>
          <SectionIcon>
            <SocialBubble />
          </SectionIcon>
          Social previews
        </SectionTitle>
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
                    color={social!.color}
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
    </MainPanel>
  )
}
