/** @jsxImportSource solid-js */

import { AllyProvider } from '../contexts/allyContext'
import { Shell } from './Shell'

export default function Devtools() {
  return (
    <AllyProvider>
      <Shell />
    </AllyProvider>
  )
}
