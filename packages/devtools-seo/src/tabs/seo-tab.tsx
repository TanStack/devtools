import { Show, createSignal } from 'solid-js'
import { MainPanel } from '@tanstack/devtools-ui'
import { useSeoStyles } from '../utils/use-seo-styles'
import { SocialPreviewsSection } from './social-previews'
import { SerpPreviewSection } from './serp-preview'
import { JsonLdPreviewSection } from './json-ld-preview'
import { HeadingStructurePreviewSection } from './heading-structure-preview'
import { LinksPreviewSection } from './links-preview'
import { SeoOverviewSection } from './seo-overview'
import type { SeoDetailView } from '../utils/seo-section-summary'

type SeoSubView = 'overview' | SeoDetailView

export const SeoTab = () => {
  const [activeView, setActiveView] = createSignal<SeoSubView>('overview')
  const styles = useSeoStyles()

  return (
    <MainPanel withPadding>
      <nav
        class={styles().seoSubNav}
        aria-label="SEO sections"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeView() === 'overview'}
          class={`${styles().seoSubNavLabel} ${activeView() === 'overview' ? styles().seoSubNavLabelActive : ''}`}
          onClick={() => setActiveView('overview')}
        >
          SEO Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView() === 'heading-structure'}
          class={`${styles().seoSubNavLabel} ${activeView() === 'heading-structure' ? styles().seoSubNavLabelActive : ''}`}
          onClick={() => setActiveView('heading-structure')}
        >
          Heading Structure
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView() === 'links-preview'}
          class={`${styles().seoSubNavLabel} ${activeView() === 'links-preview' ? styles().seoSubNavLabelActive : ''}`}
          onClick={() => setActiveView('links-preview')}
        >
          Links Preview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView() === 'social-previews'}
          class={`${styles().seoSubNavLabel} ${activeView() === 'social-previews' ? styles().seoSubNavLabelActive : ''}`}
          onClick={() => setActiveView('social-previews')}
        >
          Social Previews
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView() === 'serp-preview'}
          class={`${styles().seoSubNavLabel} ${activeView() === 'serp-preview' ? styles().seoSubNavLabelActive : ''}`}
          onClick={() => setActiveView('serp-preview')}
        >
          SERP Preview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView() === 'json-ld-preview'}
          class={`${styles().seoSubNavLabel} ${activeView() === 'json-ld-preview' ? styles().seoSubNavLabelActive : ''}`}
          onClick={() => setActiveView('json-ld-preview')}
        >
          JSON-LD Preview
        </button>
      </nav>

      <Show when={activeView() === 'overview'}>
        <SeoOverviewSection goTo={(view) => setActiveView(view)} />
      </Show>
      <Show when={activeView() === 'heading-structure'}>
        <HeadingStructurePreviewSection />
      </Show>
      <Show when={activeView() === 'links-preview'}>
        <LinksPreviewSection />
      </Show>
      <Show when={activeView() === 'social-previews'}>
        <SocialPreviewsSection />
      </Show>
      <Show when={activeView() === 'serp-preview'}>
        <SerpPreviewSection />
      </Show>
      <Show when={activeView() === 'json-ld-preview'}>
        <JsonLdPreviewSection />
      </Show>
    </MainPanel>
  )
}
