import { EventClient as EventClientImpl } from './plugin'
import { EventClientNoOp } from './noop'

/**
 * The real `EventClient` in development; a no-op everywhere else.
 *
 * Production bundlers replace `process.env.NODE_ENV` with a literal, fold this
 * ternary to `EventClientNoOp`, and tree-shake `./plugin` out of the bundle.
 * To keep the real client in production, import it from
 * `@tanstack/devtools-event-client/production` instead.
 */
const EventClient = (
  process.env.NODE_ENV !== 'development' ? EventClientNoOp : EventClientImpl
) as unknown as typeof EventClientImpl

type EventClient<TEventMap extends Record<string, any>> =
  EventClientImpl<TEventMap>

export { EventClient }
