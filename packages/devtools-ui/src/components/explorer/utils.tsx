import { serialize } from 'superjson'
import { createSignal, onCleanup, onMount } from 'solid-js'

/**
 * Displays a string regardless the type of the data
 * @param {unknown} value Value to be stringified
 * @param {boolean} beautify Formats json to multiline
 */
export const displayValue = (value: unknown, beautify: boolean = false) => {
  const { json } = serialize(value)

  return JSON.stringify(json, null, beautify ? 2 : undefined)
}

export const convertRemToPixels = (rem: number) => {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

export const getPreferredColorScheme = () => {
  const [colorScheme, setColorScheme] = createSignal<'light' | 'dark'>('dark')

  onMount(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    setColorScheme(query.matches ? 'dark' : 'light')
    const listener = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? 'dark' : 'light')
    }
    query.addEventListener('change', listener)
    onCleanup(() => query.removeEventListener('change', listener))
  })

  return colorScheme
}

/**
 * updates nested data by path
 *
 * @param {unknown} oldData Data to be updated
 * @param {Array<string>} updatePath Path to the data to be updated
 * @param {unknown} value New value
 */
export const updateNestedDataByPath = (
  oldData: unknown,
  updatePath: Array<string>,
  value: unknown,
): any => {
  if (updatePath.length === 0) {
    return value
  }

  if (oldData instanceof Map) {
    const newData = new Map(oldData)

    if (updatePath.length === 1) {
      newData.set(updatePath[0], value)
      return newData
    }

    const [head, ...tail] = updatePath
    newData.set(head, updateNestedDataByPath(newData.get(head), tail, value))
    return newData
  }

  if (oldData instanceof Set) {
    const setAsArray = updateNestedDataByPath(
      Array.from(oldData),
      updatePath,
      value,
    )

    return new Set(setAsArray)
  }

  if (Array.isArray(oldData)) {
    const newData = [...oldData]

    if (updatePath.length === 1) {
      // @ts-expect-error
      newData[updatePath[0]] = value
      return newData
    }

    const [head, ...tail] = updatePath
    // @ts-expect-error
    newData[head] = updateNestedDataByPath(newData[head], tail, value)

    return newData
  }

  if (oldData instanceof Object) {
    const newData = { ...oldData }

    if (updatePath.length === 1) {
      // @ts-expect-error
      newData[updatePath[0]] = value
      return newData
    }

    const [head, ...tail] = updatePath
    // @ts-expect-error
    newData[head] = updateNestedDataByPath(newData[head], tail, value)

    return newData
  }

  return oldData
}

/**
 * Deletes nested data by path
 *
 * @param {unknown} oldData Data to be updated
 * @param {Array<string>} deletePath Path to the data to be deleted
 * @returns newData without the deleted items by path
 */
export const deleteNestedDataByPath = (
  oldData: unknown,
  deletePath: Array<string>,
): any => {
  if (oldData instanceof Map) {
    const newData = new Map(oldData)

    if (deletePath.length === 1) {
      newData.delete(deletePath[0])
      return newData
    }

    const [head, ...tail] = deletePath
    newData.set(head, deleteNestedDataByPath(newData.get(head), tail))
    return newData
  }

  if (oldData instanceof Set) {
    const setAsArray = deleteNestedDataByPath(Array.from(oldData), deletePath)
    return new Set(setAsArray)
  }

  if (Array.isArray(oldData)) {
    const newData = [...oldData]

    if (deletePath.length === 1) {
      return newData.filter((_, idx) => idx.toString() !== deletePath[0])
    }

    const [head, ...tail] = deletePath

    // @ts-expect-error
    newData[head] = deleteNestedDataByPath(newData[head], tail)

    return newData
  }

  if (oldData instanceof Object) {
    const newData = { ...oldData }

    if (deletePath.length === 1) {
      // @ts-expect-error
      delete newData[deletePath[0]]
      return newData
    }

    const [head, ...tail] = deletePath
    // @ts-expect-error
    newData[head] = deleteNestedDataByPath(newData[head], tail)

    return newData
  }

  return oldData
}

// Sets up the goober stylesheet
// Adds a nonce to the style tag if needed
export const setupStyleSheet = (nonce?: string, target?: ShadowRoot) => {
  if (!nonce) return
  const styleExists =
    document.querySelector('#_goober') || target?.querySelector('#_goober')

  if (styleExists) return
  const styleTag = document.createElement('style')
  const textNode = document.createTextNode('')
  styleTag.appendChild(textNode)
  styleTag.id = '_goober'
  styleTag.setAttribute('nonce', nonce)
  if (target) {
    target.appendChild(styleTag)
  } else {
    document.head.appendChild(styleTag)
  }
}
