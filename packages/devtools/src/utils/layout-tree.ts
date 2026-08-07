/**
 * The plugin workspace layout, as a tree of splits and tab groups, plus every
 * operation that can change it.
 *
 * Everything here is pure and imports nothing: no DOM, no Solid, no store. That
 * is deliberate. jsdom has no layout engine, so `getBoundingClientRect` returns
 * zeros and rect maths verified through the DOM would only be verifying its own
 * mocks. Keeping the maths here means it is exhaustively testable, and it keeps
 * the components free of layout logic.
 *
 * Invariants every returned tree upholds:
 *  1. a group has at least one tab
 *  2. a split has at least two children
 *  3. `sizes.length === children.length`, every size > 0, and they sum to 1
 *  4. `active` indexes a real tab
 *  5. a plugin id appears at most once in the tree
 */

/** Where on a pane a drop landed. `center` stacks, the four edges split. */
export type DropZone = 'left' | 'right' | 'top' | 'bottom' | 'center'

export type Size = { w: number; h: number }
export type Rect = { left: number; top: number; width: number; height: number }

export type GroupNode = {
  kind: 'group'
  id: string
  /** Plugin ids, in tab order. Never empty. */
  tabs: Array<string>
  /** Index into `tabs` of the visible one. */
  active: number
}

export type SplitNode = {
  kind: 'split'
  /** `row` lays children out left to right, `col` top to bottom. */
  dir: 'row' | 'col'
  /** Fractions summing to 1, one per child. */
  sizes: Array<number>
  children: Array<LayoutNode>
}

export type LayoutNode = GroupNode | SplitNode

/** Path from the root to a node, as the child index taken at each split. */
export type Path = Array<number>

const EPSILON = 1e-9

/**
 * Depth ceiling when reading a layout out of storage. Nine panes cannot nest
 * deeper than nine, so anything past this is either corrupt or a self-
 * referencing object, and recursing into it would blow the stack.
 */
const MAX_STORED_DEPTH = 32

export const isGroup = (node: LayoutNode): node is GroupNode =>
  node.kind === 'group'

export const isSplit = (node: LayoutNode): node is SplitNode =>
  node.kind === 'split'

/** Every plugin id in visual order: left to right, top to bottom. */
export const flattenTabs = (tree: LayoutNode | null): Array<string> =>
  tree === null
    ? []
    : isGroup(tree)
      ? [...tree.tabs]
      : tree.children.flatMap(flattenTabs)

export const allGroups = (tree: LayoutNode | null): Array<GroupNode> =>
  tree === null ? [] : isGroup(tree) ? [tree] : tree.children.flatMap(allGroups)

export const findGroupOfTab = (
  tree: LayoutNode | null,
  tabId: string,
): GroupNode | null =>
  allGroups(tree).find((group) => group.tabs.includes(tabId)) ?? null

export const findGroupById = (
  tree: LayoutNode | null,
  groupId: string,
): GroupNode | null =>
  allGroups(tree).find((group) => group.id === groupId) ?? null

/**
 * A group id no other group is using. Derived from the ids already in the tree
 * rather than a counter or a random value, so the same inputs always give the
 * same output and tests stay readable.
 */
export const nextGroupId = (tree: LayoutNode | null): string => {
  let highest = -1
  for (const group of allGroups(tree)) {
    const match = /^g(\d+)$/.exec(group.id)
    if (match) highest = Math.max(highest, Number(match[1]))
  }
  return `g${highest + 1}`
}

export const singleGroup = (
  tabs: Array<string>,
  id = 'g0',
): LayoutNode | null =>
  tabs.length === 0 ? null : { kind: 'group', id, tabs: [...tabs], active: 0 }

/** Scale a list of weights so it sums to 1. Falls back to equal shares. */
const normalise = (sizes: Array<number>, count: number): Array<number> => {
  const usable =
    sizes.length === count && sizes.every((n) => Number.isFinite(n) && n > 0)
      ? sizes
      : Array.from({ length: count }, () => 1)
  const total = usable.reduce((sum, n) => sum + n, 0)
  return total > EPSILON
    ? usable.map((n) => n / total)
    : Array.from({ length: count }, () => 1 / count)
}

const split = (
  dir: SplitNode['dir'],
  children: Array<LayoutNode>,
  sizes?: Array<number>,
): SplitNode => ({
  kind: 'split',
  dir,
  sizes: normalise(sizes ?? [], children.length),
  children,
})

/**
 * Restore invariants 1-4 bottom up: drop empty groups, unwrap single-child
 * splits, flatten a split directly inside a same-direction split, and clamp
 * `active`. Returns null when nothing is left.
 */
const prune = (node: LayoutNode | null): LayoutNode | null => {
  if (node === null) return null

  if (isGroup(node)) {
    if (node.tabs.length === 0) return null
    const active = Math.min(Math.max(node.active, 0), node.tabs.length - 1)
    return active === node.active ? node : { ...node, active }
  }

  const kept: Array<LayoutNode> = []
  const keptSizes: Array<number> = []
  node.children.forEach((child, index) => {
    const pruned = prune(child)
    if (pruned === null) return
    // A same-direction split nested directly inside this one is the same layout
    // written two ways; splicing it in keeps depth (and gutter count) honest.
    if (isSplit(pruned) && pruned.dir === node.dir) {
      const share = node.sizes[index] ?? 1 / node.children.length
      pruned.children.forEach((grandchild, inner) => {
        kept.push(grandchild)
        keptSizes.push(share * (pruned.sizes[inner] ?? 0))
      })
      return
    }
    kept.push(pruned)
    keptSizes.push(node.sizes[index] ?? 1 / node.children.length)
  })

  if (kept.length === 0) return null
  if (kept.length === 1) return kept[0]!
  return split(node.dir, kept, keptSizes)
}

/** Remove a tab wherever it is, then restore invariants. */
export const closeTab = (
  tree: LayoutNode | null,
  tabId: string,
): LayoutNode | null => {
  const strip = (node: LayoutNode): LayoutNode => {
    if (isGroup(node)) {
      const index = node.tabs.indexOf(tabId)
      if (index === -1) return node
      const tabs = node.tabs.filter((id) => id !== tabId)
      // Keep the neighbour that took its place selected, as an editor would.
      const active = node.active > index ? node.active - 1 : node.active
      return { ...node, tabs, active }
    }
    return { ...node, children: node.children.map(strip) }
  }
  return tree === null ? null : prune(strip(tree))
}

/** Remove a whole group and everything in it. */
export const closeGroup = (
  tree: LayoutNode | null,
  groupId: string,
): LayoutNode | null => {
  const group = findGroupById(tree, groupId)
  if (group === null) return tree
  return group.tabs.reduce<LayoutNode | null>(
    (acc, tabId) => closeTab(acc, tabId),
    tree,
  )
}

/**
 * Replace a group's tab order wholesale, keeping the same tab selected.
 *
 * This is the seam a sortable tab bar reports into: it hands back the new order
 * and this writes it to the tree, which stays the source of truth. Ids that are
 * not already in the group are ignored — a transfer is `moveTab`, not this.
 */
export const setTabs = (
  tree: LayoutNode | null,
  groupId: string,
  tabIds: Array<string>,
): LayoutNode | null => {
  const group = findGroupById(tree, groupId)
  if (tree === null || group === null) return tree
  const existing = new Set(group.tabs)
  const seen = new Set<string>()
  const reordered = tabIds.filter((id) => {
    if (!existing.has(id) || seen.has(id)) return false
    seen.add(id)
    return true
  })
  // Anything the caller dropped stays, appended, so a partial report cannot
  // silently close a pane.
  const tabs = [...reordered, ...group.tabs.filter((id) => !seen.has(id))]
  if (tabs.length === 0) return tree
  const activeId = group.tabs[group.active]
  const active = Math.max(
    tabs.findIndex((id) => id === activeId),
    0,
  )

  const visit = (node: LayoutNode): LayoutNode => {
    if (isGroup(node)) {
      return node.id === groupId ? { ...node, tabs, active } : node
    }
    return { ...node, children: node.children.map(visit) }
  }
  return visit(tree)
}

/** Show a tab that is already open, without moving it. */
export const activateTab = (
  tree: LayoutNode | null,
  tabId: string,
): LayoutNode | null => {
  if (tree === null) return null
  const visit = (node: LayoutNode): LayoutNode => {
    if (isGroup(node)) {
      const index = node.tabs.indexOf(tabId)
      return index === -1 || index === node.active
        ? node
        : { ...node, active: index }
    }
    return { ...node, children: node.children.map(visit) }
  }
  return visit(tree)
}

/**
 * Put `tabId` into `groupId` at `index`, removing it from wherever it was. Used
 * for reordering inside one group and for moving between groups; they are the
 * same operation with a different target.
 */
export const moveTab = (
  tree: LayoutNode | null,
  tabId: string,
  groupId: string,
  index: number,
): LayoutNode | null => {
  if (tree === null) return null
  const target = findGroupById(tree, groupId)
  if (target === null) return tree

  const source = findGroupOfTab(tree, tabId)
  // Moving within one group is a reorder, so compute the destination against
  // the list as it looks with the tab already lifted out.
  const withoutTab = source === null ? tree : (closeTab(tree, tabId) ?? null)
  // Closing the tab may have pruned the target group out of existence, which
  // happens when it was that group's only tab. Then there is nothing to move.
  if (withoutTab === null) return singleGroup([tabId], groupId)
  if (findGroupById(withoutTab, groupId) === null) return tree

  const insert = (node: LayoutNode): LayoutNode => {
    if (isGroup(node)) {
      if (node.id !== groupId) return node
      const at = Math.min(Math.max(index, 0), node.tabs.length)
      const tabs = [...node.tabs.slice(0, at), tabId, ...node.tabs.slice(at)]
      return { ...node, tabs, active: at }
    }
    return { ...node, children: node.children.map(insert) }
  }
  return prune(insert(withoutTab))
}

/** Add a tab to a group as a new stacked tab, and select it. */
export const stackInto = (
  tree: LayoutNode | null,
  groupId: string,
  tabId: string,
): LayoutNode | null => {
  const group = findGroupById(tree, groupId)
  return group === null
    ? tree
    : moveTab(tree, tabId, groupId, group.tabs.length)
}

const zoneAxis = (zone: DropZone): SplitNode['dir'] =>
  zone === 'left' || zone === 'right' ? 'row' : 'col'

const zoneLeads = (zone: DropZone): boolean => zone === 'left' || zone === 'top'

/**
 * Split the group under `groupId`, putting `tabId` in a new group on the given
 * side. `center` is not a split; callers should use `stackInto` for that.
 */
export const splitAt = (
  tree: LayoutNode | null,
  groupId: string,
  zone: DropZone,
  tabId: string,
): LayoutNode | null => {
  if (tree === null) return singleGroup([tabId], 'g0')
  if (zone === 'center') return stackInto(tree, groupId, tabId)
  if (findGroupById(tree, groupId) === null) return tree

  // Lift the tab out first: it may currently live in the very group we are
  // about to split, and it must not end up on both sides.
  const lifted = closeTab(tree, tabId)
  if (lifted === null) return singleGroup([tabId], groupId)
  const host = findGroupById(lifted, groupId)
  // The group vanished when the dragged tab was its only occupant, so a split
  // would just be the tab beside itself.
  if (host === null) return tree

  const newGroup: GroupNode = {
    kind: 'group',
    id: nextGroupId(lifted),
    tabs: [tabId],
    active: 0,
  }
  const dir = zoneAxis(zone)

  const place = (node: LayoutNode): LayoutNode => {
    if (isGroup(node)) {
      if (node.id !== groupId) return node
      return split(dir, zoneLeads(zone) ? [newGroup, node] : [node, newGroup])
    }
    return { ...node, children: node.children.map(place) }
  }
  return prune(place(lifted))
}

/**
 * Add a pane alongside the existing ones, all sharing the space equally.
 *
 * This is what opening a plugin from the strip does, and it is deliberately not
 * `splitAt`: splitting the last pane halves *it*, so opening three would give
 * 1/2, 1/4, 1/4. Panes opened side by side should be the same size.
 */
export const appendPane = (
  tree: LayoutNode | null,
  tabId: string,
  dir: SplitNode['dir'] = 'row',
): LayoutNode | null => {
  if (tree === null) return singleGroup([tabId])
  const lifted = closeTab(tree, tabId)
  if (lifted === null) return singleGroup([tabId])

  const newGroup: GroupNode = {
    kind: 'group',
    id: nextGroupId(lifted),
    tabs: [tabId],
    active: 0,
  }
  const children =
    isSplit(lifted) && lifted.dir === dir
      ? [...lifted.children, newGroup]
      : [lifted, newGroup]
  // No sizes argument, so `normalise` gives every child an equal share.
  return prune(split(dir, children))
}

/** Locate a node by walking child indices from the root. */
export const nodeAtPath = (
  tree: LayoutNode | null,
  path: Path,
): LayoutNode | null => {
  let node = tree
  for (const index of path) {
    if (node === null || !isSplit(node)) return null
    node = node.children[index] ?? null
  }
  return node
}

/**
 * Move `delta` (a fraction of the split's main axis) across the gutter between
 * children `gutterIndex` and `gutterIndex + 1`. One grows by exactly what the
 * other loses, and neither drops below `minFraction`, so the total stays 1 and
 * no other pane in the split is disturbed.
 */
export const resize = (
  tree: LayoutNode | null,
  path: Path,
  gutterIndex: number,
  delta: number,
  minFraction = 0,
): LayoutNode | null => {
  const target = nodeAtPath(tree, path)
  if (tree === null || target === null || !isSplit(target)) return tree
  const before = target.sizes[gutterIndex]
  const after = target.sizes[gutterIndex + 1]
  if (before === undefined || after === undefined) return tree

  const budget = before + after
  // A min bigger than half the pair cannot be honoured for both, so fall back
  // to an even share instead of letting one side go negative.
  const min = Math.min(minFraction, budget / 2)
  const nextBefore = Math.min(Math.max(before + delta, min), budget - min)
  if (Math.abs(nextBefore - before) < EPSILON) return tree

  const sizes = [...target.sizes]
  sizes[gutterIndex] = nextBefore
  sizes[gutterIndex + 1] = budget - nextBefore

  const replace = (node: LayoutNode, depth: number): LayoutNode => {
    if (depth === path.length) return { ...(node as SplitNode), sizes }
    const index = path[depth]!
    const children = [...(node as SplitNode).children]
    children[index] = replace(children[index]!, depth + 1)
    return { ...(node as SplitNode), children }
  }
  return replace(tree, 0)
}

/**
 * Rect per group, from a walk of the tree. Tabs in the same group share its
 * rect because only the active one is displayed.
 */
export const layoutRects = (
  tree: LayoutNode | null,
  box: Size,
  gutter = 0,
): Record<string, Rect> => {
  const out: Record<string, Rect> = {}
  const walk = (node: LayoutNode, rect: Rect): void => {
    if (isGroup(node)) {
      out[node.id] = rect
      return
    }
    const horizontal = node.dir === 'row'
    const gutters = gutter * (node.children.length - 1)
    const available = Math.max(
      (horizontal ? rect.width : rect.height) - gutters,
      0,
    )
    let offset = horizontal ? rect.left : rect.top
    node.children.forEach((child, index) => {
      const extent = available * (node.sizes[index] ?? 0)
      walk(
        child,
        horizontal
          ? { left: offset, top: rect.top, width: extent, height: rect.height }
          : { left: rect.left, top: offset, width: rect.width, height: extent },
      )
      offset += extent + gutter
    })
  }
  if (tree !== null) {
    walk(tree, { left: 0, top: 0, width: box.w, height: box.h })
  }
  return out
}

/** One draggable gutter: where it sits and which sizes it moves. */
export type SplitterHandle = {
  /** Path to the split this gutter belongs to. */
  path: Path
  /** Gutter between children `gutterIndex` and `gutterIndex + 1`. */
  gutterIndex: number
  dir: SplitNode['dir']
  rect: Rect
  /**
   * The split's usable extent along its own axis, in px, excluding gutters.
   * Converts a pointer delta into a size fraction.
   */
  extent: number
}

/** Every gutter in the tree, positioned in the same space as the pane rects. */
export const splitterHandles = (
  tree: LayoutNode | null,
  box: Size,
  gutter = 0,
): Array<SplitterHandle> => {
  const handles: Array<SplitterHandle> = []
  const walk = (node: LayoutNode, rect: Rect, path: Path): void => {
    if (isGroup(node)) return
    const horizontal = node.dir === 'row'
    const gutters = gutter * (node.children.length - 1)
    const available = Math.max(
      (horizontal ? rect.width : rect.height) - gutters,
      0,
    )
    let offset = horizontal ? rect.left : rect.top
    node.children.forEach((child, index) => {
      const extent = available * (node.sizes[index] ?? 0)
      const childRect: Rect = horizontal
        ? { left: offset, top: rect.top, width: extent, height: rect.height }
        : { left: rect.left, top: offset, width: rect.width, height: extent }
      walk(child, childRect, [...path, index])
      offset += extent
      if (index < node.children.length - 1) {
        handles.push({
          path,
          gutterIndex: index,
          dir: node.dir,
          extent: available,
          rect: horizontal
            ? {
                left: offset,
                top: rect.top,
                width: gutter,
                height: rect.height,
              }
            : {
                left: rect.left,
                top: offset,
                width: rect.width,
                height: gutter,
              },
        })
        offset += gutter
      }
    })
  }
  if (tree !== null) {
    walk(tree, { left: 0, top: 0, width: box.w, height: box.h }, [])
  }
  return handles
}

/** Rect per plugin id, which is what the panes are keyed by. */
export const paneRects = (
  tree: LayoutNode | null,
  box: Size,
  gutter = 0,
): Record<string, Rect> => {
  const byGroup = layoutRects(tree, box, gutter)
  const out: Record<string, Rect> = {}
  for (const group of allGroups(tree)) {
    const rect = byGroup[group.id]
    if (rect) for (const tabId of group.tabs) out[tabId] = rect
  }
  return out
}

/**
 * Whether splitting a group leaves both halves at least `min`. The workspace is
 * short, so a split that would produce an unreadable cell is refused and the
 * caller stacks instead.
 */
export const canSplit = (
  tree: LayoutNode | null,
  groupId: string,
  zone: DropZone,
  min: Size,
  box: Size,
  gutter = 0,
): boolean => {
  if (zone === 'center') return true
  const rect = layoutRects(tree, box, gutter)[groupId]
  if (!rect) return false
  return zoneAxis(zone) === 'row'
    ? (rect.width - gutter) / 2 >= min.w
    : (rect.height - gutter) / 2 >= min.h
}

/** Which zone a pointer at `point` is in, given the pane's rect. */
export const zoneAt = (
  point: { x: number; y: number },
  rect: Rect,
  edge = 0.25,
): DropZone => {
  const x = rect.width > 0 ? (point.x - rect.left) / rect.width : 0.5
  const y = rect.height > 0 ? (point.y - rect.top) / rect.height : 0.5
  const distances: Array<[DropZone, number]> = [
    ['left', x],
    ['right', 1 - x],
    ['top', y],
    ['bottom', 1 - y],
  ]
  const [zone, distance] = distances.reduce((best, entry) =>
    entry[1] < best[1] ? entry : best,
  )
  return distance <= edge ? zone : 'center'
}

/** Insertion index for a tab dropped at `x` over a row of tab rects. */
export const insertionIndex = (x: number, tabs: Array<Rect>): number => {
  let index = 0
  for (const rect of tabs) {
    if (x < rect.left + rect.width / 2) break
    index += 1
  }
  return index
}

const isRawGroup = (value: Record<string, unknown>): boolean =>
  value.kind === 'group' &&
  typeof value.id === 'string' &&
  Array.isArray(value.tabs) &&
  value.tabs.every((tab) => typeof tab === 'string')

const isRawSplit = (value: Record<string, unknown>): boolean =>
  value.kind === 'split' &&
  (value.dir === 'row' || value.dir === 'col') &&
  Array.isArray(value.children)

/**
 * Turn whatever was in storage into a tree that upholds every invariant, or
 * null. Never throws: a malformed layout is a data problem, the same as the
 * unknown plugin ids that are already pruned on load, and it must not stop the
 * panel from opening. Storage *access* errors still propagate to the caller.
 */
export const repairLayout = (
  raw: unknown,
  known: ReadonlySet<string>,
): LayoutNode | null => {
  const seen = new Set<string>()

  const rebuild = (value: unknown, depth = 0): LayoutNode | null => {
    if (depth > MAX_STORED_DEPTH) return null
    if (typeof value !== 'object' || value === null) return null
    const record = value as Record<string, unknown>

    if (isRawGroup(record)) {
      const tabs = (record.tabs as Array<string>).filter((tab) => {
        if (!known.has(tab) || seen.has(tab)) return false
        seen.add(tab)
        return true
      })
      if (tabs.length === 0) return null
      const active =
        typeof record.active === 'number' && Number.isInteger(record.active)
          ? Math.min(Math.max(record.active, 0), tabs.length - 1)
          : 0
      return { kind: 'group', id: String(record.id), tabs, active }
    }

    if (isRawSplit(record)) {
      const children = (record.children as Array<unknown>)
        .map((child) => rebuild(child, depth + 1))
        .filter((child): child is LayoutNode => child !== null)
      if (children.length === 0) return null
      const rawSizes = Array.isArray(record.sizes)
        ? (record.sizes as Array<unknown>).filter(
            (size): size is number => typeof size === 'number',
          )
        : []
      return split(record.dir as SplitNode['dir'], children, rawSizes)
    }

    return null
  }

  const rebuilt = prune(rebuild(raw))
  if (rebuilt !== null) return dedupeIds(rebuilt)

  // Unsalvageable shape. Recover whatever plugin ids are in there so a bad
  // write costs the arrangement but not the open plugins.
  const salvaged = collectKnownIds(raw, known)
  return singleGroup(salvaged)
}

/** Every string in `raw` that names a known plugin, in encounter order. */
const collectKnownIds = (
  raw: unknown,
  known: ReadonlySet<string>,
): Array<string> => {
  const found: Array<string> = []
  const seen = new Set<string>()
  // Storage can hold a self-referencing object, so remember what has been
  // visited rather than trusting the shape to be a tree.
  const visited = new WeakSet<object>()
  const walk = (value: unknown): void => {
    if (typeof value === 'string') {
      if (known.has(value) && !seen.has(value)) {
        seen.add(value)
        found.push(value)
      }
      return
    }
    if (typeof value !== 'object' || value === null) return
    if (visited.has(value)) return
    visited.add(value)
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    Object.values(value).forEach(walk)
  }
  walk(raw)
  return found
}

/** Give any groups that share an id a fresh one, so lookups stay unambiguous. */
const dedupeIds = (tree: LayoutNode): LayoutNode => {
  const used = new Set<string>()
  let counter = 0
  const visit = (node: LayoutNode): LayoutNode => {
    if (isGroup(node)) {
      if (!used.has(node.id)) {
        used.add(node.id)
        return node
      }
      let id = `g${counter++}`
      while (used.has(id)) id = `g${counter++}`
      used.add(id)
      return { ...node, id }
    }
    return { ...node, children: node.children.map(visit) }
  }
  return visit(tree)
}
