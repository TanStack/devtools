import { For, Show } from 'solid-js'
import {
  Button,
  CheckCircleIcon,
  ExternalLinkIcon,
  PackageIcon,
  XCircleIcon,
} from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import {
  getBadgeClass,
  getBadgeText,
  getButtonText,
  getButtonVariant,
} from './card-utils'
import type { PluginCard } from './types'

interface PluginCardComponentProps {
  card: PluginCard
  onAction: (card: PluginCard) => void
}

export const PluginCardComponent = (props: PluginCardComponentProps) => {
  const styles = useStyles()
  const { card } = props

  return (
    <div
      class={styles().pluginMarketplaceCard}
      classList={{
        [styles().pluginMarketplaceCardDisabled]:
          !card.isCurrentFramework && card.actionType !== 'already-installed',
        [styles().pluginMarketplaceCardFeatured]:
          !!card.metadata?.featured && card.actionType !== 'already-installed',
        [styles().pluginMarketplaceCardActive]:
          card.actionType === 'already-installed',
      }}
      style={{ position: 'relative' }}
    >
      {/* New Banner */}
      <Show when={card.metadata?.isNew}>
        <div class={styles().pluginMarketplaceNewBanner}>New</div>
      </Show>

      <span class={getBadgeClass(card, styles)}>{getBadgeText(card)}</span>
      <div
        class={styles().pluginMarketplaceCardIcon}
        classList={{
          'custom-logo': !!card.metadata?.logoUrl,
        }}
      >
        <Show when={card.metadata?.logoUrl} fallback={<PackageIcon />}>
          <img
            src={card.metadata?.logoUrl}
            alt={card.metadata?.title || card.devtoolsPackage}
            class={styles().pluginMarketplaceCardImage}
          />
        </Show>
      </div>
      <div class={styles().pluginMarketplaceCardHeader}>
        <h3 class={styles().pluginMarketplaceCardTitle}>
          {card.metadata?.title || card.devtoolsPackage}
        </h3>
        <p class={styles().pluginMarketplaceCardPackageBadge}>
          {card.devtoolsPackage}
        </p>
        <p class={styles().pluginMarketplaceCardDescriptionText}>
          {card.actionType === 'requires-package'
            ? `Requires ${card.requiredPackageName}`
            : card.actionType === 'wrong-framework'
              ? `For different framework projects`
              : card.actionType === 'already-installed'
                ? `Active in your devtools`
                : card.actionType === 'version-mismatch'
                  ? card.versionInfo?.reason || 'Version incompatible'
                  : card.metadata?.description ||
                    `For ${card.requiredPackageName}`}
        </p>
        <Show when={card.versionInfo}>
          <p class={styles().pluginMarketplaceCardVersionInfo}>
            <Show
              when={card.versionInfo?.satisfied}
              fallback={
                <span class={styles().pluginMarketplaceCardVersionUnsatisfied}>
                  ⚠️ v{card.versionInfo?.current} • Requires v
                  {card.versionInfo?.required}+
                </span>
              }
            >
              <span class={styles().pluginMarketplaceCardVersionSatisfied}>
                ✓ v{card.versionInfo?.current} • Min v
                {card.versionInfo?.required}
              </span>
            </Show>
          </p>
        </Show>
        <Show when={card.metadata?.docsUrl}>
          <a
            href={card.metadata?.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            class={styles().pluginMarketplaceCardDocsLink}
          >
            Documentation <ExternalLinkIcon />
          </a>
        </Show>

        {/* Tags */}
        <Show when={card.metadata?.tags && card.metadata.tags.length > 0}>
          <div class={styles().pluginMarketplaceCardTags}>
            <For each={card.metadata?.tags}>
              {(tag) => (
                <span class={styles().pluginMarketplaceCardTag}>{tag}</span>
              )}
            </For>
          </div>
        </Show>
      </div>
      <Show
        when={card.status === 'idle'}
        fallback={
          <div class={styles().pluginMarketplaceCardStatus}>
            <Show when={card.status === 'installing'}>
              <div class={styles().pluginMarketplaceCardSpinner} />
              <span class={styles().pluginMarketplaceCardStatusText}>
                Installing...
              </span>
            </Show>
            <Show when={card.status === 'success'}>
              <CheckCircleIcon />
              <span class={styles().pluginMarketplaceCardStatusText}>
                Installed!
              </span>
            </Show>
            <Show when={card.status === 'error'}>
              <XCircleIcon />
              <span class={styles().pluginMarketplaceCardStatusTextError}>
                {card.error || 'Failed to install'}
              </span>
            </Show>
          </div>
        }
      >
        <Button
          variant={getButtonVariant(card)}
          onClick={() => props.onAction(card)}
          disabled={
            card.status !== 'idle' ||
            card.actionType === 'requires-package' ||
            card.actionType === 'wrong-framework' ||
            card.actionType === 'already-installed' ||
            card.actionType === 'version-mismatch'
          }
          class={
            card.actionType === 'already-installed'
              ? styles().pluginMarketplaceButtonInstalled
              : ''
          }
        >
          {getButtonText(card)}
        </Button>
      </Show>
    </div>
  )
}
