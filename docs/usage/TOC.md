# Table of Contents – IntervalManager Usage Guide

This is the main navigation page for IntervalManager documentation.  
All links are relative to the `docs/usage/` folder.

## Getting Started

- **[Quick Start](QUICKSTART.md)**  
  → 2-minute setup, first interval, basic controls, shortcut usage (`lib.interval.manager`)

- **[Installation](INSTALLATION.md)**  
  → File-based setup, m7-lib requirement, script tag vs module bundler, troubleshooting

- **[`Why not set interval?`](../WHY_NOT_SETINTERVAL.md)**
  → Really, give it a read. State machines, no lost intervals, no overflows and more.
  
## Examples & Patterns

- **[Examples Library](EXAMPLES_LIBRARY.md)**  
  → Real-world copy-paste examples: API polling, user presence heartbeat, idle detection, job queue, adaptive polling, one-shot delays, throttled logging

## Core API Reference

### Manager-Level API

- `new IntervalManager(opts?)`  
  Constructor & global options (`pauseWhenHidden`, `pauseWhenOffline`, `autoRemove`, `onEvent`, `clock`, `environment`)

- **Registration & Lookup**
  - `manager.register(config)` → create/replace interval
  - `manager.has(name)` → boolean existence check
  - `manager.get(name)` → get ManagedInterval instance
  - `manager.list()` → array of all interval names
  - `manager.snapshot([name])` → serializable state dump (all or one)

- **Lifecycle Control (single or all)**
  - `manager.start([name])` / `resume([name])`
  - `manager.pause([name])`
  - `manager.cancel([name])`
  - `manager.stopAll()`
  - `manager.dispose()`

- **Execution & Signaling**
  - `manager.runNow(name, [payload])` → manual trigger
  - `manager.signal(name, type, [payload])` → send signal to one
  - `manager.signalAll(type, [payload])` → broadcast to all
  - `manager.setWorkspace(name, workspace)` → inject/replace workspace object

- **Environment Management**
  - `manager.updateEnvironment({ visible?, online?, suspended? })`  
    → update visibility/online/suspension state → triggers auto-pause/resume

### Interval-Level API (via `manager.get(name)` or returned from `register`)

- **Lifecycle**
  - `interval.start([reason])`
  - `interval.pause([reason])`
  - `interval.cancel([reason])`
  - `interval.reset()` → clear counters/state but keep config

- **Execution**
  - `interval.runNow([payload], [reason])`
  - `interval.signal(type, [payload])`
  - `interval.reschedule(inMs)` → one-shot next-tick override

- **State & Introspection**
  - `interval.snapshot()` → serializable current state
  - `interval.isRunnable()` → boolean (running + environment + maxRuns check)

- **Context Helpers (inside `fn(ctx)`)**
  - `ctx.start() / pause() / cancel() / runNow() / reschedule()`
  - `ctx.signal(type, payload)`
  - `ctx.workspace` (mutable, persists across runs)
  - Read-only: `ctx.name`, `ctx.everyMs`, `ctx.runs`, `ctx.maxRuns`, `ctx.now`, `ctx.reason`, `ctx.lastError`, etc.

## Configuration Options Summary

### Manager Options
| Option              | Type     | Default | Description |
|---------------------|----------|---------|-------------|
| `autoRemove`        | boolean  | true    | Remove cancelled intervals from registry |
| `pauseWhenHidden`   | boolean  | true    | Auto-pause intervals when tab hidden |
| `pauseWhenOffline`  | boolean  | true    | Auto-pause when navigator.onLine === false |
| `onEvent`           | function | null    | Telemetry hook for all lifecycle events |
| `clock`             | object   | native  | Custom time/setTimeout (testing) |
| `environment`       | object   | {}      | Initial visible/online/suspended state |

### Interval Config (in `register()`)
| Field               | Type       | Default     | Description |
|---------------------|------------|-------------|-------------|
| `name`              | string     | required    | Unique identifier |
| `everyMs`           | number     | —           | Base interval (ms) |
| `fn`                | function   | required    | `(ctx) => {}` callback |
| `maxRuns`           | number     | 0 (∞)       | Max executions before auto-cancel |
| `priority`          | string     | 'normal'    | 'low'/'normal'/'high' (hint, not enforced yet) |
| `overlapPolicy`     | string     | 'coalesce'  | 'skip' / 'coalesce' / 'queue' (queue planned) |
| `errorPolicy`       | string     | 'continue'  | 'continue' / 'pause' / 'cancel' / 'backoff' |
| `runWhenHidden`     | boolean    | false       | Ignore visibility pause |
| `runWhenOffline`    | boolean    | false       | Ignore offline pause |
| `workspace`         | object     | {}          | Mutable state persisted across runs |

## Planned / Future Features (rough roadmap)

- True multi-pending queue for overlapPolicy='queue'
- Priority-based execution ordering (when multiple intervals fire simultaneously)
- Interval grouping / namespaces
- Persistence (e.g. localStorage snapshot/restore)
- npm package publication (@m7/interval)

## Related Documents

* [AI_DISCLOSURE.md](../AI_DISCLOSURE.md)  
* [USE_POLICY.md](../USE_POLICY.md)  
* [LICENSE.md](../../LICENSE.md)

Use the sidebar or links above to jump between sections.  
Happy building!
