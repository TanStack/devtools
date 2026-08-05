import { Show, createSignal } from 'solid-js'
import { MainPanel } from '@tanstack/devtools-ui'
import { createStyles } from '../../styles/use-styles'
import {
  WorkbenchSecondaryTab,
  WorkbenchSecondaryTabs,
} from '../../components/workbench-secondary-tabs'
import { SocialPreviewsSection } from './social-previews'
import { SerpPreviewSection } from './serp-preview'

type SeoSubView = 'social-previews' | 'serp-preview'

export const SeoTab = () => {
  const [activeView, setActiveView] =
    createSignal<SeoSubView>('social-previews')
  const styles = createStyles()

  return (
    <div
      data-testid="seo-workspace"
      data-tsd-surface
      class={styles().seoWorkspace}
    >
      <WorkbenchSecondaryTabs ariaLabel="SEO sections">
        <WorkbenchSecondaryTab
          selected={activeView() === 'social-previews'}
          ariaCurrent={activeView() === 'social-previews' ? 'page' : undefined}
          onClick={() => setActiveView('social-previews')}
        >
          Social previews
        </WorkbenchSecondaryTab>
        <WorkbenchSecondaryTab
          selected={activeView() === 'serp-preview'}
          ariaCurrent={activeView() === 'serp-preview' ? 'page' : undefined}
          onClick={() => setActiveView('serp-preview')}
        >
          SERP preview
        </WorkbenchSecondaryTab>
      </WorkbenchSecondaryTabs>

      <MainPanel withPadding class={styles().seoContent}>
        <Show when={activeView() === 'social-previews'}>
          <SocialPreviewsSection />
        </Show>
        <Show when={activeView() === 'serp-preview'}>
          <SerpPreviewSection />
        </Show>
      </MainPanel>
    </div>
  )
}
