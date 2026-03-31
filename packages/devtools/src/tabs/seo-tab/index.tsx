import { Show, createSignal } from 'solid-js'
import { MainPanel } from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import { SocialPreviewsSection } from './social-previews'
import { SerpPreviewSection } from './serp-preview'
import { JsonLdPreviewSection } from './json-ld-preview'
import { HeadingStructurePreviewSection } from './heading-structure-preview'
import { LinksPreviewSection } from './links-preview'
import { CanonicalUrlPreviewSection } from './canonical-url-preview'

type SeoSubView =
  | 'social-previews'
  | 'serp-preview'
  | 'json-ld-preview'
  | 'heading-structure'
  | 'links-preview'
  | 'canonical-url'

export const SeoTab = () => {
  const [activeView, setActiveView] =
    createSignal<SeoSubView>('social-previews')
  const styles = useStyles()

  return (
    <MainPanel withPadding>
      <nav class={styles().seoSubNav} aria-label="SEO sections">
        <button
          type="button"
          class={`${styles().seoSubNavLabel} ${activeView() === 'social-previews' ? styles().seoSubNavLabelActive : ''}`}
          onClick={() => setActiveView('social-previews')}
        >
          Social previews
        </button>
        <button
          type="button"
          class={`${styles().seoSubNavLabel} ${activeView() === 'serp-preview' ? styles().seoSubNavLabelActive : ''}`}
          onClick={() => setActiveView('serp-preview')}
        >
          SERP Preview
        </button>
        <button
          type="button"
          class={`${styles().seoSubNavLabel} ${activeView() === 'json-ld-preview' ? styles().seoSubNavLabelActive : ''}`}
          onClick={() => setActiveView('json-ld-preview')}
        >
          JSON-LD Preview
        </button>
        <button
          type="button"
          class={`${styles().seoSubNavLabel} ${activeView() === 'heading-structure' ? styles().seoSubNavLabelActive : ''}`}
          onClick={() => setActiveView('heading-structure')}
        >
          Heading Structure
        </button>
        <button
          type="button"
          class={`${styles().seoSubNavLabel} ${activeView() === 'links-preview' ? styles().seoSubNavLabelActive : ''}`}
          onClick={() => setActiveView('links-preview')}
        >
          Links Preview
        </button>
        <button
          type="button"
          class={`${styles().seoSubNavLabel} ${activeView() === 'canonical-url' ? styles().seoSubNavLabelActive : ''}`}
          onClick={() => setActiveView('canonical-url')}
        >
          Canonical & URL
        </button>
      </nav>

      <Show when={activeView() === 'social-previews'}>
        <SocialPreviewsSection />
      </Show>
      <Show when={activeView() === 'serp-preview'}>
        <SerpPreviewSection />
      </Show>
      <Show when={activeView() === 'json-ld-preview'}>
        <JsonLdPreviewSection />
      </Show>
      <Show when={activeView() === 'heading-structure'}>
        <HeadingStructurePreviewSection />
      </Show>
      <Show when={activeView() === 'links-preview'}>
        <LinksPreviewSection />
      </Show>
      <Show when={activeView() === 'canonical-url'}>
        <CanonicalUrlPreviewSection />
      </Show>
    </MainPanel>
  )
}
