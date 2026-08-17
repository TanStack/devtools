import { describe, expect, it } from 'vitest'
import {
  applyRenders,
  clearRenderStore,
  getRenderSnapshot,
  subscribeToRenderStore,
} from '../src/core/store'
import {
  MAX_RENDERS_PER_COMPONENT,
  UNKNOWN_COMPONENT_NAME,
} from '../src/core/types'
import type { Render } from '../src/core/types'

function render(
  partial: Partial<Render> & Pick<Render, 'componentName'>,
): Render {
  return {
    phase: 2,
    time: 1,
    count: 1,
    forget: false,
    changes: [],
    unnecessary: false,
    didCommit: true,
    fps: 60,
    ...partial,
  }
}

describe('render store', () => {
  it('aggregates count, time, unnecessary, and last fps by name', () => {
    clearRenderStore()
    applyRenders([
      render({
        componentName: 'Counter',
        count: 2,
        time: 3,
        unnecessary: true,
        fps: 55,
      }),
      render({
        componentName: 'Counter',
        count: 1,
        time: 4,
        unnecessary: false,
        fps: 50,
        changes: [
          {
            type: 1,
            name: 'value',
            value: 2,
            prevValue: 1,
          },
        ],
      }),
    ])

    expect(getRenderSnapshot()).toEqual([
      {
        name: 'Counter',
        renders: 3,
        timeMs: 7,
        unnecessary: 1,
        lastFps: 50,
        lastChanges: [
          {
            type: 1,
            name: 'value',
            value: 2,
            prevValue: 1,
          },
        ],
        lastRenders: expect.any(Array),
      },
    ])
    expect(getRenderSnapshot()[0]?.lastRenders).toHaveLength(2)
  })

  it('uses (unknown) when componentName is null', () => {
    clearRenderStore()
    applyRenders([render({ componentName: null })])
    expect(getRenderSnapshot()[0]?.name).toBe(UNKNOWN_COMPONENT_NAME)
  })

  it('does not add null time to timeMs', () => {
    clearRenderStore()
    applyRenders([render({ componentName: 'A', time: null, count: 1 })])
    expect(getRenderSnapshot()[0]?.timeMs).toBe(0)
  })

  it('clears the snapshot', () => {
    clearRenderStore()
    applyRenders([render({ componentName: 'A' })])
    clearRenderStore()
    expect(getRenderSnapshot()).toEqual([])
  })

  it('keeps at most 50 last renders per name', () => {
    clearRenderStore()
    applyRenders(
      Array.from({ length: MAX_RENDERS_PER_COMPONENT + 5 }, () =>
        render({ componentName: 'Busy', count: 1 }),
      ),
    )
    expect(getRenderSnapshot()[0]?.lastRenders).toHaveLength(
      MAX_RENDERS_PER_COMPONENT,
    )
    expect(getRenderSnapshot()[0]?.renders).toBe(MAX_RENDERS_PER_COMPONENT + 5)
  })

  it('notifies subscribers and unsubscribes', () => {
    clearRenderStore()
    const calls: Array<number> = []
    const stop = subscribeToRenderStore((rows) => {
      calls.push(rows.length)
    })
    applyRenders([render({ componentName: 'A' })])
    stop()
    applyRenders([render({ componentName: 'B' })])
    expect(calls).toEqual([1])
  })
})
