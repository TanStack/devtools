import { describe, expect, it } from 'vitest'
import { forEachChild, walk } from './ast-utils'
import type { Node } from 'oxc-parser'

describe('forEachChild', () => {
  it('visits only direct typed children, skipping null and non-type values', () => {
    const childA = { type: 'ChildA', start: 0, end: 1 }
    const childB = { type: 'ChildB', start: 1, end: 2 }
    const nested = { type: 'Nested', start: 2, end: 3 }
    const root = {
      type: 'ForEachRoot',
      start: 0,
      end: 10,
      // array-valued key holding two typed children
      items: [childA, childB],
      // object-valued typed child
      body: nested,
      // null field: skipped
      optional: null,
      // primitive string value: not a child (and excluded from child keys)
      name: 'hello',
      // primitive number value: not a child
      count: 5,
    } as unknown as Node

    const visited: Array<Node> = []
    forEachChild(root, (child) => visited.push(child))

    expect(visited).toEqual([childA, childB, nested])
    expect(visited).toHaveLength(3)
  })

  it('skips non-object array items and array items without a type', () => {
    const real = { type: 'RealItem', start: 0, end: 1 }
    const root = {
      type: 'ForEachArrayRoot',
      start: 0,
      end: 10,
      items: [real, null, 'string-item', 42, { noType: true }],
    } as unknown as Node

    const visited: Array<Node> = []
    forEachChild(root, (child) => visited.push(child))

    expect(visited).toEqual([real])
  })
})

describe('walk', () => {
  it('visits every node depth-first with the correct parentNode', () => {
    const grandchild = { type: 'WalkGrandchild', start: 4, end: 5 }
    const childA = {
      type: 'WalkChildA',
      start: 1,
      end: 6,
      inner: grandchild,
    }
    const childB = { type: 'WalkChildB', start: 6, end: 7 }
    const root = {
      type: 'WalkRoot',
      start: 0,
      end: 10,
      children: [childA, childB],
    } as unknown as Node

    const visits: Array<{ node: Node; parent: Node | undefined }> = []
    walk(root, (node, parentNode) => {
      visits.push({ node, parent: parentNode })
    })

    // Depth-first order: root, childA, grandchild, childB
    expect(visits.map((v) => v.node.type)).toEqual([
      'WalkRoot',
      'WalkChildA',
      'WalkGrandchild',
      'WalkChildB',
    ])

    // Correct parent for each node
    expect(visits[0].parent).toBeUndefined()
    expect(visits[1].parent).toBe(root)
    expect(visits[2].parent).toBe(childA)
    expect(visits[3].parent).toBe(root)
  })

  it('passes the provided parentNode through to the root visit', () => {
    const fakeParent = { type: 'WalkExternalParent', start: 0, end: 1 } as unknown as Node
    const root = { type: 'WalkRootWithParent', start: 1, end: 2 } as unknown as Node

    const visits: Array<{ node: Node; parent: Node | undefined }> = []
    walk(
      root,
      (node, parentNode) => visits.push({ node, parent: parentNode }),
      fakeParent,
    )

    expect(visits).toHaveLength(1)
    expect(visits[0].node).toBe(root)
    expect(visits[0].parent).toBe(fakeParent)
  })
})
