type CollapsibleKeys<T, TPrefix extends string = ''> =
  T extends ReadonlyArray<infer U>
    ?
        | (TPrefix extends '' ? '' : TPrefix)
        | CollapsibleKeys<U, `${TPrefix}[${number}]`>
    : T extends object
      ?
          | (TPrefix extends '' ? '' : TPrefix)
          | {
              [K in Extract<keyof T, string>]: CollapsibleKeys<
                T[K],
                TPrefix extends '' ? `${K}` : `${TPrefix}.${K}`
              >
            }[Extract<keyof T, string>]
      : never

export type CollapsiblePaths<T> =
  CollapsibleKeys<T> extends string ? CollapsibleKeys<T> : never
