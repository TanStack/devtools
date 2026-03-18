import type { Node } from 'oxc-parser'

export function isNode(value: unknown): value is Node {
  return typeof value === 'object' && value !== null && 'type' in value
}

/**
 * Cache of keys that hold child nodes (objects/arrays) per AST node type.
 * Since oxc-parser produces AST via JSON.parse, every instance of a given
 * node type has the same set of keys, so we only need to discover them once.
 */
const childKeysCache = new Map<string, Array<string>>()

function getChildKeys(node: Node): Array<string> {
  let keys = childKeysCache.get(node.type)
  if (keys) return keys

  keys = []
  for (const key in node) {
    if (key === 'type' || key === 'start' || key === 'end') continue
    // typeof null === 'object', so nullable node fields get cached too
    if (typeof (node as any)[key] === 'object') {
      keys.push(key)
    }
  }
  childKeysCache.set(node.type, keys)
  return keys
}

/**
 * Iterate over the direct child nodes of an AST node.
 * Uses a per-type cache of which keys hold child nodes to avoid
 * allocating Object.entries() arrays on every call.
 */
export function forEachChild(node: Node, callback: (child: Node) => void) {
  const keys = getChildKeys(node)
  for (const key of keys) {
    const value = (node as any)[key]
    if (value === null) continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'object' && item !== null && 'type' in item) {
          callback(item)
        }
      }
    } else if ('type' in value) {
      callback(value as Node)
    }
  }
}

/**
 * Recursively walk AST nodes, calling `visitor` for each node with a `type`.
 */
export function walk(node: Node, visitor: (node: Node) => void) {
  visitor(node)
  forEachChild(node, (child) => walk(child, visitor))
}
