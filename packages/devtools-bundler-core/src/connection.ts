export type DevtoolsConnection = { port: number; host: string; protocol: 'http' | 'https' }

let connection: DevtoolsConnection = { port: 4206, host: 'localhost', protocol: 'http' }
let devtoolsFileId: string | null = null

export const setDevtoolsConnection = (c: DevtoolsConnection) => { connection = c }
export const getDevtoolsConnection = (): DevtoolsConnection => connection
export const setDevtoolsFileId = (id: string | null) => { devtoolsFileId = id }
export const getDevtoolsFileId = (): string | null => devtoolsFileId
