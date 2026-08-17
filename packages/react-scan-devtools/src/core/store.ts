import { MAX_RENDERS_PER_COMPONENT, UNKNOWN_COMPONENT_NAME } from './types'
import type { Change, ComponentRenderStats, Render } from './types'

const statsByName = new Map<string, ComponentRenderStats>()
const listeners = new Set<(rows: Array<ComponentRenderStats>) => void>()

function snapshot(): Array<ComponentRenderStats> {
  return Array.from(statsByName.values()).map((row) => ({
    ...row,
    lastChanges: [...row.lastChanges],
    lastRenders: [...row.lastRenders],
  }))
}

function emit() {
  const rows = snapshot()
  for (const listener of listeners) {
    listener(rows)
  }
}

export function getRenderSnapshot(): Array<ComponentRenderStats> {
  return snapshot()
}

export function subscribeToRenderStore(
  listener: (rows: Array<ComponentRenderStats>) => void,
): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function clearRenderStore() {
  statsByName.clear()
  emit()
}

export function applyRenders(renders: Array<Render>) {
  for (const item of renders) {
    const name = item.componentName ?? UNKNOWN_COMPONENT_NAME
    const current = statsByName.get(name) ?? {
      name,
      renders: 0,
      timeMs: 0,
      unnecessary: 0,
      lastFps: null,
      lastChanges: [] as Array<Change>,
      lastRenders: [] as Array<Render>,
    }

    const lastRenders = [...current.lastRenders, item].slice(
      -MAX_RENDERS_PER_COMPONENT,
    )

    statsByName.set(name, {
      name,
      renders: current.renders + item.count,
      timeMs: current.timeMs + (item.time ?? 0),
      unnecessary: current.unnecessary + (item.unnecessary === true ? 1 : 0),
      lastFps: item.fps,
      lastChanges: item.changes,
      lastRenders,
    })
  }
  emit()
}
