import { exec, execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { devtoolsEventClient } from '@tanstack/devtools-client'
import chalk from 'chalk'
import { readPackageJson, tryParseJson } from './utils'
import { injectPluginIntoFile } from './inject-plugin'
import type { OutdatedDeps } from '@tanstack/devtools-client'

/**
 * Gets the outdated command for the detected package manager
 */
const getOutdatedCommand = (packageManager: string): string => {
  switch (packageManager) {
    case 'yarn':
      return 'yarn outdated --json'
    case 'pnpm':
      return 'pnpm outdated --format json'
    case 'bun':
      return 'bun outdated --json'
    case 'npm':
    default:
      return 'npm outdated --json'
  }
}

/**
 * Adds a plugin to the devtools configuration file
 */
export const addPluginToDevtools = (
  devtoolsFileId: string | null,
  packageName: string,
  pluginName: string,
  pluginImport?: { importName: string; type: 'jsx' | 'function' },
): { success: boolean; error?: string } => {
  // Check if we found the devtools file
  if (!devtoolsFileId) {
    const error = 'Devtools file not found'
    console.log(
      chalk.yellowBright(
        `[@tanstack/devtools-vite] Could not add plugin. ${error}.`,
      ),
    )
    return { success: false, error }
  }

  // Inject the plugin into the file
  const result = injectPluginIntoFile(devtoolsFileId, {
    packageName,
    pluginName,
    pluginImport,
  })

  if (result.success) {
    console.log(
      chalk.greenBright(
        `[@tanstack/devtools-vite] Successfully added ${packageName} to devtools!`,
      ),
    )
  } else {
    console.log(
      chalk.yellowBright(
        `[@tanstack/devtools-vite] Could not add plugin: ${result.error}`,
      ),
    )
  }

  return result
}
/**
 * Gets the install command and its arguments for the detected package manager
 */
const getInstallCommand = (
  packageManager: string,
  packageName: string,
): [string, Array<string>] => {
  switch (packageManager) {
    case 'yarn':
      return ['yarn', ['add', '-D', packageName]]
    case 'pnpm':
      return ['pnpm', ['add', '-D', packageName]]
    case 'bun':
      return ['bun', ['add', '-D', packageName]]
    case 'npm':
    default:
      return ['npm', ['install', '-D', packageName]]
  }
}

/**
 * An npm package name with an optional version, like `@scope/name@^1.2.3`.
 * The name comes from an unauthenticated event bus message, so the pattern
 * allows no shell syntax and no leading `-` (a CLI flag).
 */
const PACKAGE_SPEC = /^(@[a-z0-9][\w.~-]*\/)?[a-z0-9][\w.~-]*(@[\w.^~+-]+)?$/i

export const installPackage = async (
  packageName: string,
): Promise<{
  success: boolean
  error?: string
}> => {
  if (!PACKAGE_SPEC.test(packageName)) {
    const error = `Invalid package name: ${JSON.stringify(packageName)}`
    console.error(chalk.redBright(`[@tanstack/devtools-vite] ${error}`))
    return { success: false, error }
  }

  return new Promise((resolve) => {
    const packageManager = detectPackageManager()
    const [command, args] = getInstallCommand(packageManager, packageName)

    console.log(
      chalk.blueBright(
        `[@tanstack/devtools-vite] Installing ${packageName}...`,
      ),
    )

    const onDone = async (installError: Error | null) => {
      if (installError) {
        console.error(
          chalk.redBright(
            `[@tanstack/devtools-vite] Failed to install ${packageName}:`,
          ),
          installError.message,
        )
        resolve({
          success: false,
          error: installError.message,
        })
        return
      }

      console.log(
        chalk.greenBright(
          `[@tanstack/devtools-vite] Successfully installed ${packageName}`,
        ),
      )

      // Read the updated package.json and emit the event
      const updatedPackageJson = await readPackageJson()
      devtoolsEventClient.emit('package-json-updated', {
        packageJson: updatedPackageJson,
      })

      resolve({ success: true })
    }

    // Package managers are `.cmd` shims on Windows, which start only through
    // a shell. PACKAGE_SPEC keeps shell syntax out of the command there.
    if (process.platform === 'win32') {
      exec([command, ...args].join(' '), onDone)
    } else {
      execFile(command, args, onDone)
    }
  })
}

/**
 * Detects the package manager used in the project by checking for lock files
 */
const detectPackageManager = (): 'npm' | 'yarn' | 'pnpm' | 'bun' => {
  const cwd = process.cwd()

  // Check for lock files in order of specificity
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) {
    return 'bun'
  }
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }
  if (existsSync(join(cwd, 'yarn.lock'))) {
    return 'yarn'
  }
  if (existsSync(join(cwd, 'package-lock.json'))) {
    return 'npm'
  }

  // Default to pnpm if no lock file is found
  return 'pnpm'
}

export const emitOutdatedDeps = async () => {
  return await new Promise<OutdatedDeps | null>((resolve) => {
    const packageManager = detectPackageManager()
    const outdatedCommand = getOutdatedCommand(packageManager)

    exec(outdatedCommand, (_, stdout) => {
      // outdated commands exit with code 1 if there are outdated packages, but still output valid JSON
      if (stdout) {
        const newOutdatedDeps = tryParseJson<OutdatedDeps>(stdout)
        if (!newOutdatedDeps) {
          return
        }
        devtoolsEventClient.emit('outdated-deps-read', {
          outdatedDeps: newOutdatedDeps,
        })
        resolve(newOutdatedDeps)
      }
    })
  })
}
