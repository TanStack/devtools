import * as Client from './plugin'

class MockClass {
  on(_: string, __: (...args: Array<any>) => void) {
    // No-op in production
  }
  onAll(_: (...args: Array<any>) => void) {
    // No-op in production
  }
  onAllPluginEvents(_: (...args: Array<any>) => void) {
    // No-op in production
  }
  emit(_: string, ...__: Array<any>) {
    // No-op in production
  }
  getPluginId() {
    // No-op in production
  }
}

export const EventClient: (typeof Client)['EventClient'] =
  process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test'
    ? (MockClass as any)
    : Client.EventClient
