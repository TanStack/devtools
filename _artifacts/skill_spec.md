# TanStack Devtools — Skill Spec

TanStack Devtools is a framework-agnostic toolkit for building custom devtools panels via a plugin system with typed event communication. It provides the shell UI, event transport, framework adapters, and build tooling so library authors can focus on their debugging UI while end-app developers get a unified devtools experience across React, Vue, Solid, and Preact.

## Domains

| Domain | Description | Skills |
| --- | --- | --- |
| Setting up devtools | Installing, configuring, and mounting devtools in an app | app-setup |
| Building plugins | Creating custom plugins: event clients, panels, marketplace | plugin-panel-development, marketplace-publishing |
| Event communication | Typed event system for plugin data flow | event-client-creation, bidirectional-communication |
| Framework adaptation | Per-framework adapters using factory functions | framework-adapters |
| Build and production | Vite plugin features and production concerns | vite-plugin, production-setup |
| Library instrumentation | Strategic event emission placement in codebases | strategic-instrumentation |

## Skill Inventory

| Skill | Type | Domain | What it covers | Failure modes |
| --- | --- | --- | --- | --- |
| app-setup | core | setup | TanStackDevtools component, plugins prop, config, framework adapters | 4 |
| vite-plugin | core | build-production | Source injection, console piping, enhanced logs, production stripping, server bus | 5 |
| event-client-creation | core | event-communication | EventClient class, event maps, connection lifecycle, namespacing | 7 |
| strategic-instrumentation | core | instrumentation | Finding critical emission points, consolidation, performance | 3 |
| plugin-panel-development | core | plugin-development | Panel components, event listening, theming, devtools-ui | 7 |
| framework-adapters | framework | framework-adaptation | createReactPlugin, createSolidPlugin, createVuePlugin, NoOp variants | 4 |
| bidirectional-communication | core | event-communication | Commands, state editing, time-travel, structuredClone | 3 |
| production-setup | lifecycle | build-production | removeDevtoolsOnBuild, conditional imports, NoOp patterns | 3 |
| marketplace-publishing | lifecycle | plugin-development | PluginMetadata, registry format, auto-install config | 3 |

## Failure Mode Inventory

### app-setup (4 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | --- | --- | --- | --- |
| 1 | Vite plugin not placed first in plugins array | HIGH | docs/vite-plugin.md | vite-plugin |
| 2 | Vue plugin uses render instead of component | CRITICAL | docs/framework/vue/adapter.md | framework-adapters |
| 3 | Installing as regular dep for dev-only use | MEDIUM | docs/installation.md | — |
| 4 | Mounting TanStackDevtools in SSR without client guard | HIGH | packages/devtools/src/core.ts | — |

### vite-plugin (5 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | --- | --- | --- | --- |
| 1 | Expecting Vite plugin features in production | MEDIUM | packages/devtools-vite/src/plugin.ts | — |
| 2 | Not placing devtools() first in Vite plugins | HIGH | docs/vite-plugin.md | app-setup |
| 3 | Source injection on spread props elements | MEDIUM | packages/devtools-vite/src/inject-source.ts | — |
| 4 | Using devtools-vite with non-Vite bundlers | HIGH | packages/devtools-vite/package.json | — |
| 5 | Event bus port conflict in multi-project setups | MEDIUM | packages/event-bus/src/server/server.ts | — |

### event-client-creation (7 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | --- | --- | --- | --- |
| 1 | Including pluginId prefix in event names | CRITICAL | packages/event-bus-client/src/plugin.ts | — |
| 2 | Creating multiple EventClient instances per plugin | CRITICAL | docs/building-custom-plugins.md | — |
| 3 | Non-unique pluginId causing event collisions | CRITICAL | maintainer interview | — |
| 4 | Not realizing events drop after 5 failed retries | HIGH | packages/event-bus-client/src/plugin.ts | — |
| 5 | Listening before emitting and expecting connection | HIGH | packages/event-bus-client/src/plugin.ts | — |
| 6 | Using non-serializable payloads | HIGH | packages/event-bus/src/utils/json.ts | bidirectional-communication |
| 7 | Not stripping EventClient emit calls for production | HIGH | maintainer interview | production-setup |

### strategic-instrumentation (3 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | --- | --- | --- | --- |
| 1 | Emitting too many granular events | HIGH | maintainer interview | — |
| 2 | Emitting in hot loops without debouncing | HIGH | docs/bidirectional-communication.md | — |
| 3 | Not emitting at architecture boundaries | MEDIUM | maintainer interview | — |

### plugin-panel-development (7 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | --- | --- | --- | --- |
| 1 | Not cleaning up event listeners | CRITICAL | docs/building-custom-plugins.md | — |
| 2 | Oversubscribing to events in multiple places | HIGH | maintainer interview | — |
| 3 | Hardcoding repeated event payload fields | MEDIUM | maintainer interview | strategic-instrumentation |
| 4 | Ignoring theme prop in panel component | MEDIUM | docs/plugin-lifecycle.md | — |
| 5 | Not knowing max 3 active plugins limit | MEDIUM | packages/devtools/src/utils/get-default-active-plugins.ts | — |
| 6 | Using raw DOM manipulation instead of framework portals | MEDIUM | docs/plugin-lifecycle.md | — |
| 7 | Not keeping devtools packages at latest versions | MEDIUM | maintainer interview | app-setup |

### framework-adapters (4 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | --- | --- | --- | --- |
| 1 | Using React JSX pattern in Vue adapter | CRITICAL | packages/devtools-utils/src/vue/plugin.ts | app-setup |
| 2 | Solid render prop not wrapped in function | CRITICAL | docs/framework/solid/adapter.md | — |
| 3 | Ignoring NoOp variant for production | HIGH | docs/devtools-utils.md | production-setup |
| 4 | Not passing theme prop to panel component | MEDIUM | packages/devtools-utils/src/react/plugin.tsx | — |

### bidirectional-communication (3 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | --- | --- | --- | --- |
| 1 | Not using structuredClone for snapshots | HIGH | docs/bidirectional-communication.md | — |
| 2 | Not distinguishing observation from command events | MEDIUM | docs/bidirectional-communication.md | — |
| 3 | Non-serializable payloads in cross-tab scenarios | HIGH | packages/event-bus/src/utils/json.ts | event-client-creation |

### production-setup (3 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | --- | --- | --- | --- |
| 1 | Keeping devtools in prod without disabling stripping | HIGH | docs/production.md | — |
| 2 | Not using /production sub-export | MEDIUM | docs/production.md | — |
| 3 | Non-Vite projects not excluding devtools manually | HIGH | docs/production.md | — |

### marketplace-publishing (3 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | --- | --- | --- | --- |
| 1 | Missing pluginImport metadata for auto-install | HIGH | docs/third-party-plugins.md | — |
| 2 | Not specifying requires.minVersion | MEDIUM | docs/third-party-plugins.md | — |
| 3 | Submitting without framework field | MEDIUM | docs/third-party-plugins.md | — |

## Tensions

| Tension | Skills | Agent implication |
| --- | --- | --- |
| Instrumentation completeness vs performance | strategic-instrumentation ↔ event-client-creation | Agent optimizing for debugging coverage emits in hot paths; agent optimizing for performance skips critical points |
| Development convenience vs production safety | app-setup ↔ production-setup | Agent installs as devDep with stripping; later production usage requires undoing those decisions |
| Framework-agnostic core vs framework ergonomics | framework-adapters ↔ plugin-panel-development | Agent trained on React uses render/JSX everywhere; Vue and Solid have different plugin definitions |

## Cross-References

| From | To | Reason |
| --- | --- | --- |
| app-setup | vite-plugin | Vite plugin adds enhanced features after basic setup |
| event-client-creation | strategic-instrumentation | Understanding event system informs where to emit |
| event-client-creation | plugin-panel-development | Client emits, panel listens — same event map |
| plugin-panel-development | framework-adapters | After building panel, wrap in framework adapters |
| framework-adapters | production-setup | NoOp variants are the primary tree-shaking mechanism |
| bidirectional-communication | event-client-creation | Bidirectional extends the base event system |
| vite-plugin | production-setup | Vite plugin handles production stripping defaults |
| plugin-panel-development | marketplace-publishing | After building plugin, publish to marketplace |
| strategic-instrumentation | bidirectional-communication | Emission points benefit from bidirectional patterns |

## Subsystems & Reference Candidates

| Skill | Subsystems | Reference candidates |
| --- | --- | --- |
| vite-plugin | Source injection, Console piping, Enhanced logging, Production stripping, Server event bus, Editor integration | Vite plugin options reference |
| framework-adapters | React adapter, Solid adapter, Vue adapter, Preact adapter | — |
| app-setup | — | Config options (position, hotkeys, theme, eventBus) |
| event-client-creation | — | EventClient constructor options, connection lifecycle states |

## Remaining Gaps

All gaps resolved during maintainer interview:
- PiP window mode has zero impact on plugin development
- No formal testing patterns exist; EventClient works standalone for same-page communication
- No performance benchmarks; guidance is to prototype freely, reduce for production
- Telemetry patterns to be derived from source code analysis

## Recommended Skill File Structure

- **Core skills:** app-setup, event-client-creation, strategic-instrumentation, plugin-panel-development, bidirectional-communication
- **Framework skills:** framework-adapters (covers all four frameworks with subsystem files)
- **Lifecycle skills:** production-setup, marketplace-publishing
- **Composition skills:** none needed (devtools is the composition primitive itself)
- **Reference files:** vite-plugin (6 subsystems with distinct config surfaces)

## Composition Opportunities

| Library | Integration points | Composition skill needed? |
| --- | --- | --- |
| TanStack Query | Query devtools panel plugin | No — TanStack Query ships its own devtools panel |
| TanStack Router | Router devtools panel plugin | No — TanStack Router ships its own devtools panel |
| TanStack Form | Form devtools panel plugin | No — TanStack Form ships its own devtools panel |
| Vite | Build tooling integration | No — covered by vite-plugin skill |
| Any state/data library | EventClient instrumentation | Yes — strategic-instrumentation skill |
