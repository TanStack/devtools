/**
 * Stub for solid-js/web that provides all needed exports.
 * This is needed because @tanstack/devtools-utils and @tanstack/ai-devtools-core
 * import client-only functions from solid-js/web that don't exist in the SSR bundle.
 *
 * We provide no-op implementations for all the functions that may be imported.
 */

// Client-only exports that don't exist in solid-js/web server bundle
export const use = () => {}
export const setStyleProperty = () => {}
export const delegateEvents = () => {}

// Re-export commonly used solid-js/web functions as no-ops for SSR
export const render = () => {}
export const hydrate = () => {}
export const Portal = () => null
export const Dynamic = () => null
export const createComponent = (Comp: any, props: any) => {
  if (typeof Comp === 'function') {
    return Comp(props)
  }
  return null
}
export const template = () => () => null
export const insert = () => {}
export const spread = () => {}
export const memo = (fn: any) => fn
export const effect = () => {}
export const className = () => {}
export const setAttribute = () => {}
export const style = () => {}
export const classList = () => {}
export const addEventListener = () => {}
export const Suspense = (props: any) => props.children
export const SuspenseList = (props: any) => props.children
export const Switch = () => null
export const Match = () => null
export const Show = (props: any) => props.children
export const For = () => null
export const Index = () => null
export const ErrorBoundary = (props: any) => props.children
export const getOwner = () => null
export const runWithOwner = (owner: any, fn: any) => fn()
export const getHydrationKey = () => ''
export const isServer = true
export const HydrationScript = () => null
export const NoHydration = (props: any) => props.children
export const Assets = () => null
export const generateHydrationScript = () => ''
export const ssr = () => ''
export const ssrHydrationKey = () => ''
export const ssrAttribute = () => ''
export const ssrClassList = () => ''
export const ssrStyle = () => ''
export const ssrSpread = () => ''
export const escape = (s: any) => s
export const resolveSSRNode = (node: any) => node

// Additional exports that may be needed
export const mergeProps = (...sources: any[]) => Object.assign({}, ...sources)
export const splitProps = (props: any, ...keys: any[]) => {
  const descriptors = Object.getOwnPropertyDescriptors(props)
  const result: any[] = []
  for (const keyList of keys) {
    const picked: any = {}
    for (const key of keyList) {
      if (key in descriptors) {
        Object.defineProperty(picked, key, descriptors[key])
        delete descriptors[key]
      }
    }
    result.push(picked)
  }
  const rest: any = {}
  for (const key in descriptors) {
    Object.defineProperty(rest, key, descriptors[key])
  }
  result.push(rest)
  return result
}
export const createSignal = (value: any) => [() => value, () => {}]
export const createEffect = () => {}
export const createMemo = (fn: any) => fn
export const createResource = () => [() => undefined, { loading: false }]
export const createRoot = (fn: any) => fn(() => {})
export const batch = (fn: any) => fn()
export const untrack = (fn: any) => fn()
export const on = () => () => {}
export const onMount = () => {}
export const onCleanup = () => {}
export const onError = () => {}
export const children = (fn: any) => fn
export const lazy = (fn: any) => fn
export const createContext = () => ({})
export const useContext = () => ({})
export const getListener = () => null
export const enableExternalSource = () => {}
export const DEV = undefined
export const $DEVCOMP = undefined
export const $PROXY = Symbol('proxy')
export const $TRACK = Symbol('track')
