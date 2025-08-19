import * as Client from './plugin'

export const EventClient = process.env.NODE_ENV !== "development" ? class { } : Client.EventClient