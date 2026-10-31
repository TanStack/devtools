import { describe, expect, it } from 'vitest'
import {
  activateTab,
  allGroups,
  appendPane,
  canSplit,
  closeGroup,
  closeTab,
  flattenTabs,
  insertionIndex,
  layoutRects,
  moveTab,
  nextGroupId,
  paneRects,
  repairLayout,
  resetSplit,
  resize,
  resizeFromPointer,
  singleGroup,
  splitAt,
  splitterHandles,
  stackInto,
  zoneAt,
} from './layout-tree'
import type { GroupNode, LayoutNode, SplitNode } from './layout-tree'

const group = (id: string, tabs: Array<string>, active = 0): GroupNode => ({
  kind: 'group',
  id,
  tabs,
  active,
})

const split = (
  dir: SplitNode['dir'],
  children: Array<LayoutNode>,
  sizes?: Array<number>,
): SplitNode => ({
  kind: 'split',
  dir,
  sizes: sizes ?? children.map(() => 1 / children.length),
  children,
})

const BOX = { w: 1000, h: 400 }

const isGroupNode = (node: LayoutNode) => node.kind === 'group'

/** Every invariant the module promises, asserted on a returned tree. */
const expectWellFormed = (tree: LayoutNode | null) => {
  if (tree === null) return
  const ids = flattenTabs(tree)
  expect(
    new Set(ids).size,
    `duplicate plugin id in ${JSON.stringify(tree)}`,
  ).toBe(ids.length)
  const groupIds = allGroups(tree).map((entry) => entry.id)
  expect(new Set(groupIds).size, 'duplicate group id').toBe(groupIds.length)

  const visit = (node: LayoutNode) => {
    if (node.kind === 'group') {
      expect(node.tabs.length).toBeGreaterThan(0)
      expect(node.active).toBeGreaterThanOrEqual(0)
      expect(node.active).toBeLessThan(node.tabs.length)
      return
    }
    expect(node.children.length).toBeGreaterThanOrEqual(2)
    expect(node.sizes).toHaveLength(node.children.length)
    expect(node.sizes.every((size) => size > 0)).toBe(true)
    expect(node.sizes.reduce((sum, size) => sum + size, 0)).toBeCloseTo(1, 10)
    // A same-direction split nested directly inside another is the same layout
    // written twice, and prune is supposed to have flattened it.
    for (const child of node.children) {
      if (child.kind === 'split') expect(child.dir).not.toBe(node.dir)
      visit(child)
    }
  }
  visit(tree)
}

describe('flattenTabs / lookups', () => {
  it('reads tabs left to right, top to bottom', () => {
    const tree = split('row', [
      group('g0', ['query', 'form']),
      split('col', [group('g1', ['router']), group('g2', ['a11y'])]),
    ])
    expect(flattenTabs(tree)).toEqual(['query', 'form', 'router', 'a11y'])
    expect(flattenTabs(null)).toEqual([])
  })

  it('derives the next group id from the ids in use, not a counter', () => {
    expect(nextGroupId(null)).toBe('g0')
    expect(nextGroupId(group('g0', ['a']))).toBe('g1')
    expect(
      nextGroupId(split('row', [group('g0', ['a']), group('g7', ['b'])])),
    ).toBe('g8')
    // Non-matching ids must not break the scan.
    expect(nextGroupId(group('custom', ['a']))).toBe('g0')
  })
})

describe('closeTab', () => {
  it('keeps the neighbour selected when an earlier tab goes', () => {
    const next = closeTab(group('g0', ['a', 'b', 'c'], 2), 'a')
    expect(next).toEqual(group('g0', ['b', 'c'], 1))
    expectWellFormed(next)
  })

  it('clamps active when the last tab goes', () => {
    const next = closeTab(group('g0', ['a', 'b'], 1), 'b')
    expect(next).toEqual(group('g0', ['a'], 0))
    expectWellFormed(next)
  })

  it('collapses the split when a group empties', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    const next = closeTab(tree, 'a')
    expect(next).toEqual(group('g1', ['b'], 0))
    expectWellFormed(next)
  })

  it('collapses two levels when a nested group empties', () => {
    const tree = split('row', [
      group('g0', ['a']),
      split('col', [group('g1', ['b']), group('g2', ['c'])]),
    ])
    // Removing b leaves the col split with one child, which unwraps to g2, and
    // the row split then holds g0 and g2.
    const next = closeTab(tree, 'b')
    expect(next).toEqual(split('row', [group('g0', ['a']), group('g2', ['c'])]))
    expectWellFormed(next)
  })

  it('returns null when the last tab anywhere goes', () => {
    expect(closeTab(group('g0', ['a']), 'a')).toBeNull()
    expect(closeTab(null, 'a')).toBeNull()
  })

  it('is a no-op for an unknown tab', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    expect(closeTab(tree, 'nope')).toEqual(tree)
  })

  it('preserves the surviving siblings share of the space', () => {
    const tree = split('row', [
      group('g0', ['a']),
      group('g1', ['b']),
      group('g2', ['c']),
    ])
    const next = closeTab(tree, 'b') as SplitNode
    expect(next.children).toHaveLength(2)
    expect(next.sizes.reduce((sum, size) => sum + size, 0)).toBeCloseTo(1, 10)
    expectWellFormed(next)
  })
})

describe('closeGroup', () => {
  it('removes every tab in the group and prunes', () => {
    const tree = split('row', [group('g0', ['a', 'b']), group('g1', ['c'])])
    const next = closeGroup(tree, 'g0')
    expect(next).toEqual(group('g1', ['c'], 0))
    expectWellFormed(next)
  })

  it('is a no-op for an unknown group', () => {
    const tree = group('g0', ['a'])
    expect(closeGroup(tree, 'gX')).toEqual(tree)
  })
})

describe('activateTab', () => {
  it('selects without moving', () => {
    const next = activateTab(group('g0', ['a', 'b', 'c']), 'c')
    expect(next).toEqual(group('g0', ['a', 'b', 'c'], 2))
  })

  it('ignores an unknown tab', () => {
    const tree = group('g0', ['a'])
    expect(activateTab(tree, 'zzz')).toEqual(tree)
  })
})

describe('moveTab', () => {
  it('reorders within one group', () => {
    const next = moveTab(group('g0', ['a', 'b', 'c']), 'a', 'g0', 2)
    expect(next).toEqual(group('g0', ['b', 'c', 'a'], 2))
    expectWellFormed(next)
  })

  it('moves between groups and selects it at the destination', () => {
    const tree = split('row', [group('g0', ['a', 'b']), group('g1', ['c'])])
    const next = moveTab(tree, 'a', 'g1', 0)
    expect(next).toEqual(
      split('row', [group('g0', ['b']), group('g1', ['a', 'c'], 0)]),
    )
    expectWellFormed(next)
  })

  it('collapses the source group when it empties', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    const next = moveTab(tree, 'a', 'g1', 1)
    expect(next).toEqual(group('g1', ['b', 'a'], 1))
    expectWellFormed(next)
  })

  it('clamps an out-of-range index instead of creating a hole', () => {
    expect(moveTab(group('g0', ['a', 'b']), 'a', 'g0', 99)).toEqual(
      group('g0', ['b', 'a'], 1),
    )
    expect(moveTab(group('g0', ['a', 'b']), 'b', 'g0', -5)).toEqual(
      group('g0', ['b', 'a'], 0),
    )
  })

  it('never duplicates the tab it moved', () => {
    const tree = split('row', [group('g0', ['a', 'b']), group('g1', ['c'])])
    const next = moveTab(tree, 'b', 'g1', 0)
    expect(flattenTabs(next).filter((id) => id === 'b')).toHaveLength(1)
    expectWellFormed(next)
  })

  it('is a no-op for an unknown group or tab', () => {
    const tree = group('g0', ['a'])
    expect(moveTab(tree, 'a', 'gX', 0)).toEqual(tree)
    expect(moveTab(tree, 'zz', 'g0', 0)).toEqual(group('g0', ['zz', 'a'], 0))
  })
})

describe('stackInto', () => {
  it('appends and selects', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    const next = stackInto(tree, 'g0', 'b')
    expect(next).toEqual(group('g0', ['a', 'b'], 1))
    expectWellFormed(next)
  })
})

describe('splitAt', () => {
  it('puts the new group on the dropped side', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    const right = splitAt(tree, 'g0', 'right', 'b') as SplitNode
    expect(flattenTabs(right)).toEqual(['a', 'b'])
    expect((right.children[0] as GroupNode).tabs).toEqual(['a'])
    expectWellFormed(right)

    const left = splitAt(tree, 'g1', 'left', 'a') as SplitNode
    expect(flattenTabs(left)).toEqual(['a', 'b'])
    expectWellFormed(left)
  })

  it('splits on the correct axis', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    // g0 is inside a row split, so a vertical split nests a col beneath it.
    const below = splitAt(tree, 'g0', 'bottom', 'b') as SplitNode
    expect(below.dir).toBe('col')
    expectWellFormed(below)
  })

  it('treats center as a stack', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    expect(splitAt(tree, 'g0', 'center', 'b')).toEqual(
      group('g0', ['a', 'b'], 1),
    )
  })

  it('refuses to split a group by its own only tab', () => {
    // Dragging a lone tab onto its own pane edge would otherwise put it beside
    // itself, or delete it outright.
    const tree = group('g0', ['a'])
    expect(splitAt(tree, 'g0', 'right', 'a')).toEqual(tree)
    expect(flattenTabs(splitAt(tree, 'g0', 'right', 'a'))).toEqual(['a'])
  })

  it('splits a group out of one of its own tabs when it has several', () => {
    const next = splitAt(group('g0', ['a', 'b']), 'g0', 'right', 'b')
    expect(flattenTabs(next)).toEqual(['a', 'b'])
    expect(allGroups(next)).toHaveLength(2)
    expectWellFormed(next)
  })

  it('seeds a tree from nothing', () => {
    expect(splitAt(null, 'g0', 'right', 'a')).toEqual(group('g0', ['a'], 0))
  })

  it('gives the new group an unused id', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    const next = splitAt(tree, 'g0', 'right', 'c')
    const ids = allGroups(next).map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
    expectWellFormed(next)
  })

  it('is a no-op for an unknown group', () => {
    const tree = group('g0', ['a'])
    expect(splitAt(tree, 'gX', 'right', 'b')).toEqual(tree)
  })
})

describe('resize', () => {
  it('moves budget across one gutter and leaves the rest alone', () => {
    const tree = split(
      'row',
      [group('g0', ['a']), group('g1', ['b']), group('g2', ['c'])],
      [0.4, 0.4, 0.2],
    )
    const next = resize(tree, [], 0, 0.1) as SplitNode
    expect(next.sizes[0]).toBeCloseTo(0.5, 10)
    expect(next.sizes[1]).toBeCloseTo(0.3, 10)
    expect(next.sizes[2]).toBeCloseTo(0.2, 10)
    expectWellFormed(next)
  })

  it('conserves the total', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    for (const delta of [0.3, -0.45, 5, -5]) {
      const next = resize(tree, [], 0, delta) as SplitNode
      expect(next.sizes.reduce((sum, size) => sum + size, 0)).toBeCloseTo(1, 10)
    }
  })

  it('clamps at the minimum instead of collapsing a pane', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    const next = resize(tree, [], 0, 0.9, 0.2) as SplitNode
    expect(next.sizes[0]).toBeCloseTo(0.8, 10)
    expect(next.sizes[1]).toBeCloseTo(0.2, 10)
  })

  it('falls back to an even share when the minimum cannot fit twice', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    const next = resize(tree, [], 0, 1, 0.9) as SplitNode
    expect(next.sizes[0]).toBeCloseTo(0.5, 10)
    expect(next.sizes[1]).toBeCloseTo(0.5, 10)
  })

  it('resizes a nested split by path', () => {
    const tree = split('row', [
      group('g0', ['a']),
      split('col', [group('g1', ['b']), group('g2', ['c'])]),
    ])
    const next = resize(tree, [1], 0, 0.2) as SplitNode
    const inner = next.children[1] as SplitNode
    expect(inner.sizes[0]).toBeCloseTo(0.7, 10)
    expect(inner.sizes[1]).toBeCloseTo(0.3, 10)
    // The outer split is untouched.
    expect(next.sizes[0]).toBeCloseTo(0.5, 10)
    expectWellFormed(next)
  })

  it('is a no-op for a bad path or gutter', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    expect(resize(tree, [9], 0, 0.1)).toEqual(tree)
    expect(resize(tree, [], 5, 0.1)).toEqual(tree)
    expect(resize(tree, [], 0, 0)).toEqual(tree)
    expect(resize(group('g0', ['a']), [], 0, 0.1)).toEqual(group('g0', ['a']))
  })
})

describe('resetSplit', () => {
  it('evens out an unequal pair', () => {
    const tree = split(
      'row',
      [group('g0', ['a']), group('g1', ['b'])],
      [0.7, 0.3],
    )
    const next = resetSplit(tree, [], 0) as SplitNode
    expect(next.sizes[0]).toBeCloseTo(0.5, 10)
    expect(next.sizes[1]).toBeCloseTo(0.5, 10)
    expectWellFormed(next)
  })

  it('only touches the gutter pair, leaving the rest alone', () => {
    const tree = split(
      'row',
      [group('g0', ['a']), group('g1', ['b']), group('g2', ['c'])],
      [0.1, 0.7, 0.2],
    )
    const next = resetSplit(tree, [], 0) as SplitNode
    expect(next.sizes[0]).toBeCloseTo(0.4, 10)
    expect(next.sizes[1]).toBeCloseTo(0.4, 10)
    expect(next.sizes[2]).toBeCloseTo(0.2, 10)
    expectWellFormed(next)
  })

  it('resets a nested split by path', () => {
    const tree = split('row', [
      group('g0', ['a']),
      split('col', [group('g1', ['b']), group('g2', ['c'])], [0.8, 0.2]),
    ])
    const next = resetSplit(tree, [1], 0) as SplitNode
    const inner = next.children[1] as SplitNode
    expect(inner.sizes[0]).toBeCloseTo(0.5, 10)
    expect(inner.sizes[1]).toBeCloseTo(0.5, 10)
    // The outer split is untouched.
    expect(next.sizes[0]).toBeCloseTo(0.5, 10)
    expectWellFormed(next)
  })

  it('is a no-op when the pair is already even', () => {
    const tree = split(
      'row',
      [group('g0', ['a']), group('g1', ['b'])],
      [0.5, 0.5],
    )
    expect(resetSplit(tree, [], 0)).toEqual(tree)
  })

  it('is a no-op for a bad path or gutter', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    expect(resetSplit(tree, [9], 0)).toEqual(tree)
    expect(resetSplit(tree, [], 5)).toEqual(tree)
    expect(resetSplit(group('g0', ['a']), [], 0)).toEqual(group('g0', ['a']))
    expect(resetSplit(null, [], 0)).toBeNull()
  })
})

describe('resizeFromPointer', () => {
  it('applies total mouse travel to the snapshot so later moves do not compound', () => {
    const tree = split(
      'row',
      [group('g0', ['a']), group('g1', ['b'])],
      [0.5, 0.5],
    )
    const extent = 1000
    const at20 = resizeFromPointer(tree, [], 0, 20, extent) as SplitNode
    const at40 = resizeFromPointer(tree, [], 0, 40, extent) as SplitNode
    expect(at20.sizes[0]).toBeCloseTo(0.52, 10)
    expect(at40.sizes[0]).toBeCloseTo(0.54, 10)
    // Feeding the live tree a total delta (the old drag loop) overshoots:
    // 0.5 + 0.02, then that result + 0.04 = 0.56.
    const compounded = resizeFromPointer(at20, [], 0, 40, extent) as SplitNode
    expect(compounded.sizes[0]).toBeCloseTo(0.56, 10)
  })

  it('is a no-op when the split has no measurable extent', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    expect(resizeFromPointer(tree, [], 0, 20, 0)).toEqual(tree)
  })
})

describe('layoutRects', () => {
  it('fills the box with one group', () => {
    expect(layoutRects(group('g0', ['a']), BOX)).toEqual({
      g0: { left: 0, top: 0, width: 1000, height: 400 },
    })
  })

  it('divides a row by weight', () => {
    const tree = split(
      'row',
      [group('g0', ['a']), group('g1', ['b'])],
      [0.6, 0.4],
    )
    expect(layoutRects(tree, BOX)).toEqual({
      g0: { left: 0, top: 0, width: 600, height: 400 },
      g1: { left: 600, top: 0, width: 400, height: 400 },
    })
  })

  it('divides a column by weight', () => {
    const tree = split('col', [group('g0', ['a']), group('g1', ['b'])])
    expect(layoutRects(tree, BOX)).toEqual({
      g0: { left: 0, top: 0, width: 1000, height: 200 },
      g1: { left: 0, top: 200, width: 1000, height: 200 },
    })
  })

  it('subtracts gutters from the available extent', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    const rects = layoutRects(tree, BOX, 8)
    expect(rects.g0).toEqual({ left: 0, top: 0, width: 496, height: 400 })
    expect(rects.g1).toEqual({ left: 504, top: 0, width: 496, height: 400 })
    // The two panes plus the gutter account for the whole box.
    expect(rects.g0!.width + 8 + rects.g1!.width).toBe(BOX.w)
  })

  it('handles nesting', () => {
    const tree = split('row', [
      group('g0', ['a']),
      split('col', [group('g1', ['b']), group('g2', ['c'])]),
    ])
    expect(layoutRects(tree, BOX)).toEqual({
      g0: { left: 0, top: 0, width: 500, height: 400 },
      g1: { left: 500, top: 0, width: 500, height: 200 },
      g2: { left: 500, top: 200, width: 500, height: 200 },
    })
  })

  it('gives every tab in a group the group rect', () => {
    const tree = split('row', [group('g0', ['a', 'b']), group('g1', ['c'])])
    const rects = paneRects(tree, BOX)
    expect(rects.a).toEqual(rects.b)
    expect(rects.a).toEqual({ left: 0, top: 0, width: 500, height: 400 })
    expect(rects.c!.left).toBe(500)
  })

  it('returns nothing for an empty tree', () => {
    expect(layoutRects(null, BOX)).toEqual({})
    expect(paneRects(null, BOX)).toEqual({})
  })
})

describe('closing a pane gives its space back', () => {
  // The reported shape: one pane top-left, one bottom-left, one down the right.
  const topBottomLeftPlusRight = () =>
    split('row', [
      split('col', [group('g0', ['top']), group('g1', ['bottom'])]),
      group('g2', ['right']),
    ])

  it('expands the top-left pane to full height when the bottom-left closes', () => {
    const before = layoutRects(topBottomLeftPlusRight(), BOX)
    expect(before.g0!.height).toBeCloseTo(BOX.h / 2, 6)

    const after = closeTab(topBottomLeftPlusRight(), 'bottom')
    const rects = layoutRects(after, BOX)
    // The column is gone, so the survivor takes the whole left half.
    expect(rects.g0!.height).toBe(BOX.h)
    expect(rects.g0!.top).toBe(0)
    expect(rects.g0!.width).toBeCloseTo(BOX.w / 2, 6)
    // The right pane is untouched.
    expect(rects.g2!.height).toBe(BOX.h)
    expect(rects.g2!.width).toBeCloseTo(BOX.w / 2, 6)
    expectWellFormed(after)
  })

  it('expands the bottom-left pane when the top-left closes', () => {
    const after = closeTab(topBottomLeftPlusRight(), 'top')
    const rects = layoutRects(after, BOX)
    expect(rects.g1!.height).toBe(BOX.h)
    expect(rects.g1!.top).toBe(0)
    expectWellFormed(after)
  })

  it('leaves no empty split behind, whichever left pane goes', () => {
    for (const closing of ['top', 'bottom']) {
      const after = closeTab(topBottomLeftPlusRight(), closing)!
      expect(after.kind).toBe('split')
      expect((after as SplitNode).dir).toBe('row')
      expect((after as SplitNode).children).toHaveLength(2)
      // Every child is a plain group now: the column collapsed rather than
      // lingering with a single child.
      expect((after as SplitNode).children.every(isGroupNode)).toBe(true)
    }
  })

  it('shares the space out when one of three siblings closes', () => {
    const tree = split('row', [
      group('g0', ['a']),
      group('g1', ['b']),
      group('g2', ['c']),
    ])
    const after = closeTab(tree, 'b')
    const rects = layoutRects(after, BOX)
    expect((after as SplitNode).children).toHaveLength(2)
    expect(rects.g0!.width).toBeCloseTo(BOX.w / 2, 6)
    expect(rects.g2!.width).toBeCloseTo(BOX.w / 2, 6)
    // No gap where the middle pane used to be.
    expect(rects.g0!.left + rects.g0!.width).toBeCloseTo(rects.g2!.left, 6)
    expectWellFormed(after)
  })

  it('keeps a resized split proportional after a sibling closes', () => {
    // A user who dragged the gutter should not have the survivor land somewhere
    // arbitrary.
    const tree = split(
      'row',
      [
        split(
          'col',
          [group('g0', ['top']), group('g1', ['bottom'])],
          [0.8, 0.2],
        ),
        group('g2', ['right']),
      ],
      [0.3, 0.7],
    )
    const after = closeTab(tree, 'bottom')
    const rects = layoutRects(after, BOX)
    expect(rects.g0!.height).toBe(BOX.h)
    expect(rects.g0!.width).toBeCloseTo(BOX.w * 0.3, 6)
    expect(rects.g2!.width).toBeCloseTo(BOX.w * 0.7, 6)
    expectWellFormed(after)
  })

  it('does not collapse a group that still has another tab', () => {
    // Closing one of two stacked tabs leaves the group in place, at its own size.
    const tree = split('row', [
      split('col', [group('g0', ['top']), group('g1', ['b1', 'b2'])]),
      group('g2', ['right']),
    ])
    const after = closeTab(tree, 'b2')
    const rects = layoutRects(after, BOX)
    expect(rects.g0!.height).toBeCloseTo(BOX.h / 2, 6)
    expect(rects.g1!.height).toBeCloseTo(BOX.h / 2, 6)
    expectWellFormed(after)
  })
})

describe('appendPane', () => {
  it('seeds from nothing', () => {
    expect(appendPane(null, 'a')).toEqual(group('g0', ['a'], 0))
  })

  it('gives every pane an equal share as they are added', () => {
    let tree = appendPane(null, 'a')
    tree = appendPane(tree, 'b')
    expect((tree as SplitNode).sizes).toEqual([0.5, 0.5])

    tree = appendPane(tree, 'c')
    // The reason appendPane exists: splitting the last pane instead would give
    // 1/2, 1/4, 1/4, so panes opened side by side would not match.
    const sizes = (tree as SplitNode).sizes
    expect(sizes).toHaveLength(3)
    for (const size of sizes) expect(size).toBeCloseTo(1 / 3, 10)
    expect(flattenTabs(tree)).toEqual(['a', 'b', 'c'])
    expectWellFormed(tree)
  })

  it('extends the existing row rather than nesting', () => {
    const tree = appendPane(appendPane(appendPane(null, 'a'), 'b'), 'c')
    expect((tree as SplitNode).children.every(isGroupNode)).toBe(true)
  })

  it('never duplicates a pane that is already open', () => {
    const tree = appendPane(appendPane(null, 'a'), 'b')
    const again = appendPane(tree, 'a')
    expect(flattenTabs(again).filter((id) => id === 'a')).toHaveLength(1)
    expectWellFormed(again)
  })

  it('can stack a column instead', () => {
    const tree = appendPane(appendPane(null, 'a'), 'b', 'col')
    expect((tree as SplitNode).dir).toBe('col')
  })
})

describe('splitterHandles', () => {
  it('finds none in a lone group', () => {
    expect(splitterHandles(group('g0', ['a']), BOX, 6)).toEqual([])
    expect(splitterHandles(null, BOX, 6)).toEqual([])
  })

  it('places one gutter between two panes, filling the gap', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    const [handle] = splitterHandles(tree, BOX, 6)
    const rects = layoutRects(tree, BOX, 6)
    expect(handle!.dir).toBe('row')
    expect(handle!.gutterIndex).toBe(0)
    expect(handle!.path).toEqual([])
    // It sits exactly in the space layoutRects left between the two panes.
    expect(handle!.rect.left).toBe(rects.g0!.left + rects.g0!.width)
    expect(handle!.rect.width).toBe(6)
    expect(handle!.rect.left + handle!.rect.width).toBe(rects.g1!.left)
    expect(handle!.extent).toBe(BOX.w - 6)
  })

  it('spans the cross axis of a column split', () => {
    const tree = split('col', [group('g0', ['a']), group('g1', ['b'])])
    const [handle] = splitterHandles(tree, BOX, 6)
    expect(handle!.dir).toBe('col')
    expect(handle!.rect.width).toBe(BOX.w)
    expect(handle!.rect.height).toBe(6)
    expect(handle!.extent).toBe(BOX.h - 6)
  })

  it('gives n-1 gutters and paths into nested splits', () => {
    const tree = split('row', [
      group('g0', ['a']),
      group('g1', ['b']),
      split('col', [group('g2', ['c']), group('g3', ['d'])]),
    ])
    const handles = splitterHandles(tree, BOX, 6)
    // Two in the outer row, one in the nested column.
    expect(handles).toHaveLength(3)
    expect(handles.filter((h) => h.dir === 'row')).toHaveLength(2)
    const nested = handles.find((h) => h.dir === 'col')!
    expect(nested.path).toEqual([2])
    expect(nested.gutterIndex).toBe(0)
  })

  it('keeps gutters inside the box', () => {
    const tree = split('row', [
      group('g0', ['a']),
      group('g1', ['b']),
      group('g2', ['c']),
    ])
    for (const handle of splitterHandles(tree, BOX, 6)) {
      expect(handle.rect.left).toBeGreaterThanOrEqual(0)
      expect(handle.rect.left + handle.rect.width).toBeLessThanOrEqual(BOX.w)
    }
  })
})

describe('canSplit', () => {
  const min = { w: 280, h: 160 }

  it('allows a horizontal split with room', () => {
    expect(canSplit(group('g0', ['a']), 'g0', 'right', min, BOX)).toBe(true)
  })

  it('refuses a vertical split in a short workspace', () => {
    // 400 tall halves to 200, which clears 160; nesting again would not.
    const tree = split('col', [group('g0', ['a']), group('g1', ['b'])])
    expect(canSplit(tree, 'g0', 'bottom', min, BOX)).toBe(false)
  })

  it('refuses a horizontal split once panes are narrow', () => {
    const tree = split('row', [
      group('g0', ['a']),
      group('g1', ['b']),
      group('g2', ['c']),
    ])
    // Each pane is ~333 wide, so halving gives ~166, under the 280 minimum.
    expect(canSplit(tree, 'g0', 'right', min, BOX)).toBe(false)
  })

  it('always allows center, and refuses an unknown group', () => {
    expect(canSplit(group('g0', ['a']), 'g0', 'center', min, BOX)).toBe(true)
    expect(canSplit(group('g0', ['a']), 'gX', 'right', min, BOX)).toBe(false)
  })
})

describe('selecting a stacked tab', () => {
  it('only changes which tab is active, never the structure', () => {
    // Two panes merged into one group, then each tab selected in turn. The tree
    // must stay a single group: selecting is not a rearrangement.
    const merged = stackInto(
      split('row', [group('g0', ['a']), group('g1', ['b'])]),
      'g0',
      'b',
    )
    expect(merged).toEqual(group('g0', ['a', 'b'], 1))

    const backToA = activateTab(merged, 'a')
    expect(backToA).toEqual(group('g0', ['a', 'b'], 0))
    expect(allGroups(backToA)).toHaveLength(1)

    const backToB = activateTab(backToA, 'b')
    expect(backToB).toEqual(group('g0', ['a', 'b'], 1))
    expect(allGroups(backToB)).toHaveLength(1)
    expectWellFormed(backToB)
  })
})

describe('zoneAt', () => {
  const rect = { left: 0, top: 0, width: 400, height: 200 }

  it('picks the nearest edge inside the band', () => {
    expect(zoneAt({ x: 10, y: 100 }, rect)).toBe('left')
    expect(zoneAt({ x: 390, y: 100 }, rect)).toBe('right')
    expect(zoneAt({ x: 200, y: 5 }, rect)).toBe('top')
    expect(zoneAt({ x: 200, y: 195 }, rect)).toBe('bottom')
  })

  it('picks center away from the edges', () => {
    expect(zoneAt({ x: 200, y: 100 }, rect)).toBe('center')
  })

  it('respects the rect offset', () => {
    const offset = { left: 500, top: 200, width: 400, height: 200 }
    expect(zoneAt({ x: 510, y: 300 }, offset)).toBe('left')
    expect(zoneAt({ x: 700, y: 300 }, offset)).toBe('center')
  })

  it('does not divide by zero on a collapsed rect', () => {
    expect(
      zoneAt({ x: 0, y: 0 }, { left: 0, top: 0, width: 0, height: 0 }),
    ).toBe('center')
  })
})

describe('insertionIndex', () => {
  const tabs = [
    { left: 0, top: 0, width: 100, height: 30 },
    { left: 100, top: 0, width: 100, height: 30 },
    { left: 200, top: 0, width: 100, height: 30 },
  ]

  it('inserts before a tab in its first half', () => {
    expect(insertionIndex(10, tabs)).toBe(0)
    expect(insertionIndex(120, tabs)).toBe(1)
  })

  it('inserts after a tab in its second half', () => {
    expect(insertionIndex(80, tabs)).toBe(1)
    expect(insertionIndex(180, tabs)).toBe(2)
  })

  it('appends past the end and handles an empty bar', () => {
    expect(insertionIndex(999, tabs)).toBe(3)
    expect(insertionIndex(0, [])).toBe(0)
  })
})

describe('repairLayout', () => {
  const known = new Set(['a', 'b', 'c'])

  it('passes a valid tree through', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['b'])])
    expect(repairLayout(tree, known)).toEqual(tree)
  })

  it('prunes unknown plugin ids and collapses what empties', () => {
    const tree = split('row', [group('g0', ['gone']), group('g1', ['b'])])
    const repaired = repairLayout(tree, known)
    expect(repaired).toEqual(group('g1', ['b'], 0))
    expectWellFormed(repaired)
  })

  it('drops a duplicated plugin id, keeping the first', () => {
    const tree = split('row', [group('g0', ['a']), group('g1', ['a', 'b'])])
    const repaired = repairLayout(tree, known)
    expect(flattenTabs(repaired)).toEqual(['a', 'b'])
    expectWellFormed(repaired)
  })

  it('renormalises sizes that do not sum to 1', () => {
    const tree = split(
      'row',
      [group('g0', ['a']), group('g1', ['b'])],
      [10, 30],
    )
    const repaired = repairLayout(tree, known) as SplitNode
    expect(repaired.sizes[0]).toBeCloseTo(0.25, 10)
    expect(repaired.sizes[1]).toBeCloseTo(0.75, 10)
    expectWellFormed(repaired)
  })

  it('replaces missing or non-numeric sizes with equal shares', () => {
    for (const sizes of [undefined, 'nope', [1], [0, 0]]) {
      const repaired = repairLayout(
        {
          kind: 'split',
          dir: 'row',
          sizes,
          children: [group('g0', ['a']), group('g1', ['b'])],
        },
        known,
      ) as SplitNode
      expect(repaired.sizes).toHaveLength(2)
      expect(repaired.sizes[0]).toBeCloseTo(0.5, 10)
      expectWellFormed(repaired)
    }
  })

  it('clamps an out-of-range active index', () => {
    expect(repairLayout(group('g0', ['a', 'b'], 99), known)).toEqual(
      group('g0', ['a', 'b'], 1),
    )
    expect(repairLayout(group('g0', ['a', 'b'], -3), known)).toEqual(
      group('g0', ['a', 'b'], 0),
    )
  })

  it('gives duplicated group ids a fresh one', () => {
    const tree = split('row', [group('dup', ['a']), group('dup', ['b'])])
    const repaired = repairLayout(tree, known)
    const ids = allGroups(repaired).map((entry) => entry.id)
    expect(new Set(ids).size).toBe(2)
    expectWellFormed(repaired)
  })

  it('salvages plugin ids from an unrecognisable shape', () => {
    // The arrangement is lost, but the plugins that were open stay open.
    const repaired = repairLayout(
      { totally: 'wrong', but: ['a', { nested: 'c' }, 'unknown'] },
      known,
    )
    expect(flattenTabs(repaired)).toEqual(['a', 'c'])
    expectWellFormed(repaired)
  })

  it('never throws on hostile input', () => {
    const cycle: Record<string, unknown> = { kind: 'split', dir: 'row' }
    cycle.children = [cycle]
    for (const raw of [
      null,
      undefined,
      0,
      'string',
      [],
      {},
      { kind: 'group' },
      { kind: 'group', id: 'g0', tabs: 'not-an-array' },
      { kind: 'split', dir: 'sideways', children: [] },
      { kind: 'split', dir: 'row', children: [null, 3, 'x'] },
      cycle,
    ]) {
      expect(() => repairLayout(raw, known)).not.toThrow()
      expectWellFormed(repairLayout(raw, known))
    }
  })

  it('returns null when nothing is salvageable', () => {
    expect(
      repairLayout({ kind: 'group', id: 'g0', tabs: ['zzz'] }, known),
    ).toBeNull()
    expect(repairLayout(null, known)).toBeNull()
  })
})

describe('migration from activePlugins', () => {
  it('becomes one group in the stored order', () => {
    expect(singleGroup(['a', 'b', 'c'])).toEqual(
      group('g0', ['a', 'b', 'c'], 0),
    )
  })

  it('is null for no open plugins', () => {
    expect(singleGroup([])).toBeNull()
  })

  it('round-trips through flattenTabs, which is what activePlugins becomes', () => {
    const stored = ['query', 'router', 'a11y']
    expect(flattenTabs(singleGroup(stored))).toEqual(stored)
  })
})

describe('sequences of operations keep the tree well formed', () => {
  it('survives building up to nine panes and tearing them down', () => {
    const ids = Array.from({ length: 9 }, (_, index) => `p${index}`)
    let tree = singleGroup([ids[0]!])
    expectWellFormed(tree)

    // Alternate splitting right and bottom, and stack a couple, so the tree
    // ends up genuinely mixed rather than a single row.
    const zones = [
      'right',
      'bottom',
      'center',
      'right',
      'bottom',
      'right',
      'center',
      'bottom',
    ] as const
    ids.slice(1).forEach((id, index) => {
      const target = allGroups(tree)[index % allGroups(tree).length]!
      const zone = zones[index]!
      tree =
        zone === 'center'
          ? stackInto(tree, target.id, id)
          : splitAt(tree, target.id, zone, id)
      expectWellFormed(tree)
    })
    expect(flattenTabs(tree).sort()).toEqual([...ids].sort())

    // Rects must tile the box without overlapping, at every stage.
    const rects = Object.values(layoutRects(tree, BOX))
    const area = rects.reduce((sum, r) => sum + r.width * r.height, 0)
    expect(area).toBeCloseTo(BOX.w * BOX.h, 4)

    for (const id of ids) {
      tree = closeTab(tree, id)
      expectWellFormed(tree)
    }
    expect(tree).toBeNull()
  })

  it('survives repeated moves between every pair of groups', () => {
    let tree: LayoutNode | null = split('row', [
      group('g0', ['a', 'b']),
      split('col', [group('g1', ['c']), group('g2', ['d'])]),
    ])
    for (const tabId of ['a', 'b', 'c', 'd']) {
      for (const target of allGroups(tree)) {
        const moved = moveTab(tree, tabId, target.id, 0)
        expectWellFormed(moved)
        expect(flattenTabs(moved).sort()).toEqual(['a', 'b', 'c', 'd'])
        tree = moved
      }
    }
  })
})
