import { AllyProvider } from '../contexts/allyContext'
import type { A11yPluginOptions } from '../types'

interface A11yDevtoolsProps {
  options?: A11yPluginOptions
  /** Theme passed from TanStack Devtools */
  theme?: 'light' | 'dark'
}

export default function Devtools(props: A11yDevtoolsProps) {
  return (
    <AllyProvider options={props.options}>
      <A11yDevtoolsPanel theme={props.theme} />
    </AllyProvider>
  )
}
