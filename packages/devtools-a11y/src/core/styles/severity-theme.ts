import { resolveSemanticTheme } from '@tanstack/devtools-ui/internal'

import type { StatusRole } from '@tanstack/devtools-ui/internal'
import type { TanStackDevtoolsTheme } from '@tanstack/devtools-ui'
import type { SeverityThreshold } from '../types/types'

const severity = {
  critical: { role: 'error', label: 'Critical', outline: '3px solid' },
  serious: { role: 'error', label: 'Serious', outline: '2px solid' },
  moderate: { role: 'warning', label: 'Moderate', outline: '2px solid' },
  minor: { role: 'info', label: 'Minor', outline: '2px dashed' },
} as const satisfies Record<
  SeverityThreshold,
  { role: StatusRole; label: string; outline: string }
>

export function getSeverityStyle(
  impact: SeverityThreshold,
  theme: TanStackDevtoolsTheme,
) {
  const definition = severity[impact]
  return {
    ...definition,
    colors: resolveSemanticTheme(theme).color.status[definition.role],
  }
}
