type IsAny<T> = 0 extends 1 & T ? true : false

type Clean<T> = Exclude<T, undefined | null>

type CollapsibleKeys<T, TPrefix extends string = ''> =
  IsAny<T> extends true
    ? TPrefix extends ''
      ? never
      : TPrefix
    : T extends ReadonlyArray<infer U>
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
  CollapsibleKeys<Clean<T>> extends infer P
    ? P extends string
      ? P
      : never
    : never
