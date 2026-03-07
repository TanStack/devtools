import { MainPanel } from '@tanstack/devtools-ui'
import { SocialPreviewsSection } from './social-previews'

export const SeoTab = () => {
  return (
    <MainPanel withPadding>
      <SocialPreviewsSection />
    </MainPanel>
  )
}
