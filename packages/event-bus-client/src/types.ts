export interface TanStackDevtoolsEvent<
  TEventName extends string,
  TPayload = any,
> {
  type: TEventName
  payload: TPayload
  pluginId?: string // Optional pluginId to filter events by plugin
}

export type AllDevtoolsEvents<TEventMap extends Record<string, any>> = {
  [Key in keyof TEventMap & string]: TanStackDevtoolsEvent<Key, TEventMap[Key]>
}[keyof TEventMap & string]
