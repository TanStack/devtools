import { Show, createSignal } from 'solid-js'
import { MainPanel } from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import { SocialPreviewsSection } from './social-previews'
import { SerpPreviewSection } from './serp-preview'

type SeoSubView = 'social-previews' | 'serp-preview'

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
      </nav>

      <Show when={activeView() === 'social-previews'}>
        <SocialPreviewsSection />
      </Show>
      <Show when={activeView() === 'serp-preview'}>
        <SerpPreviewSection />
      </Show>
    </MainPanel>
  )
}
