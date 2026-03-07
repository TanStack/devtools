import {
  Section,
  SectionDescription,
  SectionIcon,
  SectionTitle,
} from '@tanstack/devtools-ui'
import { PageSearch } from '@tanstack/devtools-ui/icons'

const DUMMY_SERP = {
  title: 'Example Page Title - Your Site Name',
  description:
    'This is a short meta description that shows how your page might appear in Google search results. Keep it under 160 characters.',
  url: 'https://example.com/page-path',
}

export function SerpPreviewSection(props: { noTitle?: boolean } = {}) {
  return (
    <Section>
      {!props.noTitle && (
        <SectionTitle>
          <SectionIcon>
            <PageSearch />
          </SectionIcon>
          SERP Preview
        </SectionTitle>
      )}
      <SectionDescription>
        See how your title tag and meta description to see your website's SERP
        snippet preview in Google search results.
      </SectionDescription>
      <div>
        <p>{DUMMY_SERP.title}</p>
        <p>{DUMMY_SERP.description}</p>
        <p>{DUMMY_SERP.url}</p>
      </div>
    </Section>
  )
}
