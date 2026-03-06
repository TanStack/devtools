export const tryParseJson = <T>(json: string | null): T | undefined => {
  if (!json) return undefined
  try {
    return JSON.parse(json)
  } catch (_e) {
    return undefined
  }
}
