import { For, Show } from 'solid-js'
import { ChevronDownIcon } from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import { PluginCardComponent } from './plugin-card'
import type { Accessor } from 'solid-js'
import type { PluginCard, PluginSection } from './types'

interface PluginSectionComponentProps {
  section: PluginSection
  isCollapsed: Accessor<boolean>
  onToggleCollapse: () => void
  onCardAction: (card: PluginCard) => void
}

const StarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

export const PluginSectionComponent = (props: PluginSectionComponentProps) => {
  const styles = useStyles()

  return (
    <div class={styles().pluginMarketplaceSection}>
      <div
        class={styles().pluginMarketplaceSectionHeader}
        onClick={props.onToggleCollapse}
      >
        <div class={styles().pluginMarketplaceSectionHeaderLeft}>
          <div
            class={styles().pluginMarketplaceSectionChevron}
            classList={{
              [styles().pluginMarketplaceSectionChevronCollapsed]:
                props.isCollapsed(),
            }}
          >
            <ChevronDownIcon />
          </div>
          <h3 class={styles().pluginMarketplaceSectionTitle}>
            {props.section.displayName}
          </h3>
        </div>
      </div>

      <Show when={!props.isCollapsed()}>
        <Show when={props.section.id === 'featured'}>
          <div class={styles().pluginMarketplaceFeatureBanner}>
            <div class={styles().pluginMarketplaceFeatureBannerContent}>
              <h4 class={styles().pluginMarketplaceFeatureBannerTitle}>
                <span class={styles().pluginMarketplaceFeatureBannerIcon}>
                  <StarIcon />
                </span>
                Want to be featured here?
              </h4>
              <p class={styles().pluginMarketplaceFeatureBannerText}>
                If you've built a plugin for TanStack Devtools and would like to
                showcase it in the featured section, we'd love to hear from you!
                Reach out to us to discuss partnership opportunities.
              </p>
              <a
                href="mailto:partners+devtools@tanstack.com?subject=Featured%20Plugin%20Partnership%20Inquiry"
                class={styles().pluginMarketplaceFeatureBannerButton}
              >
                <span class={styles().pluginMarketplaceFeatureBannerButtonIcon}>
                  <MailIcon />
                </span>
                Contact Us
              </a>
            </div>
          </div>
        </Show>

        <div class={styles().pluginMarketplaceGrid}>
          <For each={props.section.cards}>
            {(card) => (
              <PluginCardComponent card={card} onAction={props.onCardAction} />
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
