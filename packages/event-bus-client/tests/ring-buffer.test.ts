// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { RingBuffer } from '../src/ring-buffer'

describe('RingBuffer', () => {
  it('should track added items via has()', () => {
    const buf = new RingBuffer(5)
    buf.add('a')
    expect(buf.has('a')).toBe(true)
    expect(buf.has('b')).toBe(false)
  })

  it('should evict oldest items when capacity is exceeded', () => {
    const buf = new RingBuffer(3)
    buf.add('a')
    buf.add('b')
    buf.add('c')
    buf.add('d') // evicts 'a'
    expect(buf.has('a')).toBe(false)
    expect(buf.has('b')).toBe(true)
    expect(buf.has('c')).toBe(true)
    expect(buf.has('d')).toBe(true)
  })

  it('should handle wrapping around the buffer', () => {
    const buf = new RingBuffer(2)
    buf.add('a')
    buf.add('b')
    buf.add('c') // evicts 'a'
    buf.add('d') // evicts 'b'
    expect(buf.has('a')).toBe(false)
    expect(buf.has('b')).toBe(false)
    expect(buf.has('c')).toBe(true)
    expect(buf.has('d')).toBe(true)
  })
})
