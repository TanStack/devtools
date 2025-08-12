import clientOnly from "./client-only";

export const TanstackDevtools = clientOnly(() =>
  import("./core").then((m) => m),
);
