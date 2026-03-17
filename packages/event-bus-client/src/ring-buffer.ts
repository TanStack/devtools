export class RingBuffer {
  #buffer: Array<string>
  #set: Set<string>
  #index = 0
  #capacity: number

  constructor(capacity: number) {
    this.#capacity = capacity
    this.#buffer = new Array(capacity).fill('')
    this.#set = new Set()
  }

  add(item: string) {
    const evicted = this.#buffer[this.#index]
    if (evicted) {
      this.#set.delete(evicted)
    }
    this.#buffer[this.#index] = item
    this.#set.add(item)
    this.#index = (this.#index + 1) % this.#capacity
  }

  has(item: string): boolean {
    return this.#set.has(item)
  }
}
