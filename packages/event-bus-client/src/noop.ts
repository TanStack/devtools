import type { EventClient } from './plugin'
import type { AllDevtoolsEvents, TanStackDevtoolsEvent } from './types'

/** Maps a type to its public members only (drops `#private`/`private`). */
type PublicSurface<T> = { [K in keyof T]: T[K] }

/**
 * A no-op implementation of `EventClient` with an identical public API.
 *
 * The package root export resolves to this class outside of development (see
 * `index.ts`), so production bundlers can tree-shake the real client away.
 * Authors who want devtools events in production should import the real client
 * from `@tanstack/devtools-event-client/production` instead.
 */
export class EventClientNoOp<TEventMap extends Record<string, any>>
  implements PublicSurface<EventClient<TEventMap>>
{
  #pluginId: string

  constructor({
    pluginId,
  }: {
    pluginId: string
    debug?: boolean
    reconnectEveryMs?: number
    enabled?: boolean
  }) {
    this.#pluginId = pluginId
  }

  getPluginId() {
    return this.#pluginId
  }

  createEventPayload<TEvent extends keyof TEventMap & string>(
    eventSuffix: TEvent,
    payload: TEventMap[TEvent],
  ) {
    return {
      type: `${this.#pluginId}:${eventSuffix}`,
      payload,
      pluginId: this.#pluginId,
    }
  }

  emit<TEvent extends keyof TEventMap & string>(
    _eventSuffix: TEvent,
    _payload: TEventMap[TEvent],
  ): void {}

  on<TEvent extends keyof TEventMap & string>(
    _eventSuffix: TEvent,
    _cb: (event: TanStackDevtoolsEvent<TEvent, TEventMap[TEvent]>) => void,
    _options?: {
      withEventTarget?: boolean
    },
  ) {
    return () => {}
  }

  onAll(_cb: (event: TanStackDevtoolsEvent<string, any>) => void) {
    return () => {}
  }

  onAllPluginEvents(_cb: (event: AllDevtoolsEvents<TEventMap>) => void) {
    return () => {}
  }
}
