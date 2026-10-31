import { describe, expect, it } from 'vitest'
import {
  getDevtoolsConnection,
  getDevtoolsFileId,
  setDevtoolsConnection,
  setDevtoolsFileId,
} from './connection'

describe('connection singleton', () => {
  it('returns sensible defaults before anything is set', () => {
    expect(getDevtoolsConnection()).toEqual({
      port: 4206,
      host: 'localhost',
      protocol: 'http',
    })
    expect(getDevtoolsFileId()).toBeNull()
  })
  it('round-trips connection and file id', () => {
    setDevtoolsConnection({ port: 5000, host: '0.0.0.0', protocol: 'https' })
    expect(getDevtoolsConnection()).toEqual({
      port: 5000,
      host: '0.0.0.0',
      protocol: 'https',
    })
    setDevtoolsFileId('/app/src/main.tsx')
    expect(getDevtoolsFileId()).toBe('/app/src/main.tsx')
  })
})
