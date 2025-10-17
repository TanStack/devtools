/**
 * Simple semver utilities for version comparison
 * Handles basic semver format: major.minor.patch
 */

interface ParsedVersion {
  major: number
  minor: number
  patch: number
  raw: string
}

/**
 * Parse a semver string into components
 */
export function parseVersion(version: string): ParsedVersion | null {
  if (!version) return null

  // Remove leading 'v', '^', '~', and any prerelease/build metadata
  const cleanVersion = version
    .replace(/^[v^~]/, '')
    .split('-')[0]
    ?.split('+')[0]

  if (!cleanVersion) return null

  const parts = cleanVersion.split('.')

  if (parts.length < 2) return null

  const major = parseInt(parts[0] ?? '0', 10)
  const minor = parseInt(parts[1] ?? '0', 10)
  const patch = parseInt(parts[2] ?? '0', 10)

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    return null
  }

  return {
    major,
    minor,
    patch,
    raw: version,
  }
}

/**
 * Compare two versions
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1: ParsedVersion, v2: ParsedVersion): number {
  if (v1.major !== v2.major) return v1.major - v2.major
  if (v1.minor !== v2.minor) return v1.minor - v2.minor
  return v1.patch - v2.patch
}

/**
 * Check if a version satisfies a minimum requirement
 */
export function satisfiesMinVersion(
  currentVersion: string,
  minVersion: string,
): boolean {
  const current = parseVersion(currentVersion)
  const min = parseVersion(minVersion)

  if (!current || !min) return true // If we can't parse, assume it's OK

  return compareVersions(current, min) >= 0
}

/**
 * Check if a version is below a maximum requirement
 */
export function satisfiesMaxVersion(
  currentVersion: string,
  maxVersion: string,
): boolean {
  const current = parseVersion(currentVersion)
  const max = parseVersion(maxVersion)

  if (!current || !max) return true

  return compareVersions(current, max) <= 0
}

/**
 * Check if a version satisfies both min and max requirements
 */
export function satisfiesVersionRange(
  currentVersion: string,
  minVersion?: string,
  maxVersion?: string,
): { satisfied: boolean; reason?: string } {
  if (!minVersion && !maxVersion) {
    return { satisfied: true }
  }

  if (minVersion && !satisfiesMinVersion(currentVersion, minVersion)) {
    return {
      satisfied: false,
      reason: `Requires v${minVersion} or higher (current: v${currentVersion})`,
    }
  }

  if (maxVersion && !satisfiesMaxVersion(currentVersion, maxVersion)) {
    return {
      satisfied: false,
      reason: `Requires v${maxVersion} or lower (current: v${currentVersion})`,
    }
  }

  return { satisfied: true }
}
