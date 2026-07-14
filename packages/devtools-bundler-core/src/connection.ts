export type DevtoolsConnection = {
  port: number
  host: string
  protocol: 'http' | 'https'
}

let connection: DevtoolsConnection = {
  port: 4206,
  host: 'localhost',
  protocol: 'http',
}
let devtoolsFileId: string | null = null

export const setDevtoolsConnection = (c: DevtoolsConnection) => {
  connection = c
}
export const getDevtoolsConnection = (): DevtoolsConnection => connection
export const setDevtoolsFileId = (id: string | null) => {
  devtoolsFileId = id
}
export const getDevtoolsFileId = (): string | null => devtoolsFileId

/**
 * Origin of the bundler dev server (e.g. rspack-dev-server). This is where the
 * `__tsd/*` middleware endpoints are mounted, and it is DISTINCT from the event
 * bus connection above (which the devtools client connects to on port 4206).
 * The dev-server origin is used to build the absolute `/__tsd/open-source` URL
 * baked into enhanced console logs and the SSR-side `/__tsd/console-pipe/server`
 * POST target.
 */
export type DevServerOrigin = {
  port: number
  host: string
  protocol: 'http' | 'https'
}
let devServerOrigin: DevServerOrigin | null = null
export const setDevServerOrigin = (o: DevServerOrigin) => {
  devServerOrigin = o
}
export const getDevServerOrigin = (): DevServerOrigin | null => devServerOrigin
