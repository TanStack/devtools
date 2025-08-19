export const tryParseJson = <T>(json: string | null): T | undefined => {
  if (!json) return undefined
  try {
    return JSON.parse(json)
  } catch (_e) {
    return undefined
  }
}

export const uppercaseFirstLetter = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

export const getAllPermutations = <T extends any>(arr: Array<T>) => {
  const res: Array<Array<T>> = []

  function permutate(arr: Array<T>, start: number) {
    if (start === arr.length - 1) {
      res.push([...arr] as any)
      return
    }
    for (let i = start; i < arr.length; i++) {
      ;[arr[start], arr[i]] = [arr[i]!, arr[start]!]
      permutate(arr, start + 1)
      ;[arr[start], arr[i]] = [arr[i]!, arr[start]]
    }
  }
  permutate(arr, 0)

  return res
}
