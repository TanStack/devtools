'use client'

import * as Devtools from "./devtools";

export const TanStackDevtools: (typeof Devtools)["TanStackDevtools"] =
  process.env.NODE_ENV !== "development" ?
    function () { return null; } : Devtools.TanStackDevtools;

export type { TanStackDevtoolsReactPlugin, TanStackDevtoolsReactInit } from './devtools'
