import picomatch from 'picomatch'

export const matcher = (
  patterns: Array<string | RegExp>,
  str: string,
): boolean => {
  if (patterns.length === 0) {
    return false
  }
  const matchers = patterns.map((pattern) => {
    if (typeof pattern === 'string') {
      return picomatch(pattern)
    } else {
      return (s: string) => pattern.test(s)
    }
  })

  return matchers.some((isMatch) => isMatch(str))
}
