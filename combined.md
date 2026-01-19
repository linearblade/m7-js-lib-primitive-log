

# --- begin: docs/AI_DISCLOSURE.md ---

# ⚙️ AI Disclosure Statement

This project incorporates the assistance of artificial intelligence tools in a supporting role to accelerate development and reduce repetitive labor.

Specifically, AI was used to:

* 🛠️ **Accelerate the creation of repetitive or boilerplate files**, such as configuration definitions and lookup logic.
* ✍️ **Improve documentation clarity**, formatting, and flow for both technical and general audiences.
* 🧠 **Act as a second set of eyes** for small but crucial errors — such as pointer handling, memory safety, and edge-case checks.
* 🌈 **Suggest enhancements** like emoji-infused logging to improve readability and human-friendly debug output.

---

## 🧑‍💻 Emoji Philosophy

I **like emoji**. They're easy for me to scan and read while debugging. Emoji make logs more human-friendly and give structure to otherwise noisy output.

Future versions may include a **configurable emoji-less mode** for those who prefer minimalism or need plaintext compatibility.

And hey — if you don't like them, the wonders of open source mean you're free to **delete them all**. 😄

---

## 🔧 Human-Directed Engineering

All core architecture, flow design, function strategy, and overall system engineering are **authored and owned by the developer**. AI was not used to generate the software's original design, security model, or protocol logic.

Every AI-assisted suggestion was critically reviewed, tested, and integrated under human judgment.

---

## 🤝 Philosophy

AI tools were used in the same spirit as modern compilers, linters, or search engines — as **assistants, not authors**. All decisions, final code, and system behavior remain the responsibility and intellectual output of the developer.


# --- end: docs/AI_DISCLOSURE.md ---



# --- begin: docs/api/AUTO.md ---

# auto.js Integration Reference

`auto.js` is an **optional** convenience layer that registers IntervalManager into the `m7-lib` global (`window.lib`) so you can create managers via a short, ergonomic shortcut:

```js
const manager = new lib.interval.manager();
```

If you do **not** include `auto.js`, you can still use the library normally via imports / script tags:

```js
const manager = new IntervalManager();
```

---

## What `auto.js` does

When loaded, `auto.js`:

1. Ensures the `lib.interval` namespace exists on `window.lib`
2. Registers a factory function (constructor wrapper) at:

   * `lib.interval.manager`
3. Optionally exposes the `ManagedInterval` and/or `IntervalManager` constructors under `lib.interval` (depending on how you choose to export)

The intent is:

* **Zero-config convenience** for browser script-tag usage
* **Consistent discovery surface** under `lib.interval.*`

---

## Requirements

* `m7-lib` **v0.98+** must be loaded first
* `auto.js` must be loaded **after** `m7-lib` and after the IntervalManager source files

Recommended script order:

```html
<!-- Load m7-lib (module or classic build) -->
<script src="/lib/m7-lib.min.js"></script>

<!-- Then load auto.js as a module -->
<script type="module" src="/lib/interval/auto.js"></script>
```

---

## Usage

### Basic

```js
const manager = new lib.interval.manager({
  pauseWhenHidden: true,
  pauseWhenOffline: true,
  autoRemove: true
});
```

From here, usage is identical to the standard API:

```js
manager.register({
  name: 'clock',
  everyMs: 1000,
  fn: (ctx) => console.log('tick', ctx.runs)
});

manager.start('clock');
```

---

## Troubleshooting

| Symptom                                  | Likely Cause                            | Fix                                       |
| ---------------------------------------- | --------------------------------------- | ----------------------------------------- |
| `lib is undefined`                       | `m7-lib` not loaded, or loaded too late | Load `m7-lib` first                       |
| `lib.hash.set is not a function`         | Wrong `m7-lib` version                  | Use `m7-lib` ≥ 0.98                       |
| `lib.interval` missing                   | `auto.js` not included                  | Add `auto.js` after IntervalManager files |
| `lib.interval.manager is not a function` | Script order issue                      | Ensure `auto.js` loads last               |

---

## Notes

* `auto.js` is intentionally small and should remain dependency-light.
* In module/bundler environments, you typically do **not** need `auto.js`.

---

## Related Docs

* **Installation** → [`INSTALLATION.md`](../usage/INSTALLATION.md)
* **Quick Start** → [`QUICKSTART.md`](../usage/QUICKSTART.md)
* **IntervalManager API** → [`INTERVAL_MANAGER.md`](./INTERVAL_MANAGER.md)
* **ManagedInterval API** → [`MANAGED_INTERVAL.md`](./MANAGED_INTERVAL.md)


# --- end: docs/api/AUTO.md ---



# --- begin: docs/api/INDEX.md ---

# API Documentation

This section contains the spec-style API references for the IntervalManager system.

If you’re new, start with **Quick Start** first:

* [`QUICKSTART.md`](../usage/QUICKSTART.md)

---

## Core APIs

* **IntervalManager** → [`INTERVAL_MANAGER.md`](./INTERVAL_MANAGER.md)

  * Register and manage named intervals
  * Bulk lifecycle control and environment gating
  * Telemetry hooks and snapshots

* **ManagedInterval** → [`MANAGED_INTERVAL.md`](./MANAGED_INTERVAL.md)

* Per-interval configuration and execution engine
  * Overlap policies (`skip`, `coalesce`, `queue`)
  * Error policies (`continue`, `pause`, `cancel`, `backoff`)
  * Signals, stepping, rescheduling, workspace

---

## API Contracts (LLM / Tooling)

These documents define **public, source-independent API contracts** intended for
LLMs, tooling, and integration systems that must rely on *behavioral guarantees*
rather than implementation details.

- **Interval API Contract (LLM-safe)** → [`INTERVAL_API_CONTRACT.md`](./INTERVAL_API_CONTRACT.md)
  - docs/api/INTERVAL_API_CONTRACT.md

---

## Integration

* **auto.js** → [`AUTO.md`](./AUTO.md)

  * Installs `lib.interval.manager()` into `m7-lib`
  * Requires only `m7-lib` + `auto.js` (module)

---

## Usage Docs

* **Installation** → [`INSTALLATION.md`](../usage/INSTALLATION.md)
* **Quick Start** → [`QUICKSTART.md`](../usage/QUICKSTART.md)
* **Examples Library** → [`EXAMPLES_LIBRARY.md`](../usage/EXAMPLES_LIBRARY.md)
* **Usage Guide / TOC** → [`TOC.md`](../usage/TOC.md)


# --- end: docs/api/INDEX.md ---



# --- begin: docs/api/INTERVAL_API_CONTRACT.md ---

# Interval API Contract (m7-js-lib-interval)

> **You may paste this file directly into another project so that an LLM knows how to correctly use the software.**
> This document defines the *public API contract only*. It intentionally omits implementation details and source code.
>
> Anything not explicitly specified here must be treated as **undefined behavior**.

---

## Scope

This contract defines the **public, stable interface** for **m7-js-lib-interval**, including:

* `IntervalManager` (central registry and lifecycle controller)
* `ManagedInterval` (per-interval execution engine)
* `auto.js` integration (optional browser convenience layer)

The goal is to allow correct integration and reasoning **without reading source code**.

---

## Core Concepts

### Interval lifecycle states

* **running** — eligible to schedule and execute work
* **paused** — retains state/config, no scheduling
* **cancelled** — permanently stopped; cannot be restarted

### Environment gating (manager-level)

* `visible: boolean` — whether the app/tab should be treated as visible
* `online: boolean` — whether the app should be treated as online
* `suspended: boolean` — global hard stop (highest priority)

### Policies (interval-level)

* **overlapPolicy** — behavior when a tick occurs while a run is inflight

  * `skip` | `coalesce` | `queue`
* **errorPolicy** — behavior when `fn(ctx)` throws or rejects

  * `continue` | `pause` | `cancel` | `backoff`

---

## Module Exports

### Standard usage

* `IntervalManager` (named export)
* `ManagedInterval` (named export)

### auto.js integration exports

* `IntervalManager`, `ManagedInterval` (named exports)
* `manager` alias → `IntervalManager`
* `interval` alias → `ManagedInterval`
* default export → `{ manager: IntervalManager, interval: ManagedInterval }`

---

## auto.js Integration Contract

### Purpose

When loaded in a browser environment with **m7-lib**, `auto.js` registers:

* `lib.interval.manager` → constructor for `IntervalManager`
* `lib.interval.interval` → constructor for `ManagedInterval`

### Preconditions

* Runs in a browser environment
* `window.lib` must exist
* `lib.hash.set` must be available

### Failure behavior

If any precondition is missing, `auto.js` throws an Error at load time.

---

# IntervalManager API

## Construction

### `new IntervalManager(opts?)`

#### Options

* `autoRemove: boolean` (default `true`)
* `pauseWhenHidden: boolean` (default `true`)
* `pauseWhenOffline: boolean` (default `true`)
* `onEvent: function | null` (default `null`)
* `clock: { now(), setTimeout(fn, ms), clearTimeout(id) } | null`
* `environment: { visible?, online?, suspended? }`

### Manager guarantees

* Maintains a registry of named intervals
* Enforces environment policy after start/resume and environment updates
* Once disposed, all control and mutation APIs throw; lookup and introspection APIs (`get`, `has`, `list`, `snapshot`) remain callable but operate on an empty registry.

---

## Registration & Lookup

### `manager.register(config) → ManagedInterval`

Registers or replaces a named interval.

**Required config**:

* `name: string`
* `fn: function(ctx)`

**Replacement invariant**:

* Existing interval with the same name is cancelled with reason `"replaced"`

---

### `manager.get(name) → ManagedInterval | null`

### `manager.has(name) → boolean`

### `manager.list() → string[]`

### `manager.snapshot(name?) → object | null`

Returns serializable snapshot(s) of interval state.

---

## Lifecycle Control

### `manager.start(name?)`

Starts one interval or all.

* Always followed by environment policy enforcement

### `manager.resume(name?)`

Alias of `start()`.

### `manager.pause(name?)`

Pauses interval(s) without destroying state.

### `manager.cancel(name?)`

Cancels interval(s) permanently.

### `manager.stopAll()`

Cancels all intervals with reason `"stopAll"`.
Manager remains usable.

### `manager.dispose()`

* Cancels all intervals with reason `"dispose"`
* Clears registry
* Permanently disables manager

---

## Execution & Signaling

### `manager.runNow(name, payload?)`

Requests an immediate execution attempt.

* Obeys overlap and environment rules

### `manager.step(name, reason?)`

Attempts exactly one run for the named interval (obeys environment gating), then ensures pause.

### `manager.signal(name, type, payload?)`

### `manager.signalAll(type, payload?)`

### `manager.setWorkspace(name, workspace)`

Replaces an interval's workspace object.
Throws if `workspace` is not an object.

---

## Environment Management

### `manager.updateEnvironment({ visible?, online?, suspended? })`

Policy order:

1. `suspended` — hard pause
2. `visible === false` — pause unless `runWhenHidden`
3. `online === false` — pause unless `runWhenOffline`

Resumes occur only if current environment allows execution.

---

## Telemetry (`onEvent`)

If provided, `onEvent(event)` receives structured lifecycle events.

Common event types:

* `register`, `start`, `pause`, `resume`, `cancel`
* `runNow`, `step`
* `environment`
* `maxRuns`, `remove`, `dispose`, `error`

Telemetry errors are swallowed and must not affect execution.

---

# ManagedInterval API

Instances are normally created via `manager.register(config)`.

---

## Configuration Schema

### Required

* `name: string`
* `fn: function(ctx)`

### Timing

* `everyMs: number` *(optional; default `1000`)*

Timing guarantees:

* `everyMs` is clamped to **≥ 1ms**
* if omitted or invalid, defaults to **1000ms**

### Optional

* `maxRuns: number` (default `0` = unlimited)
* `priority: 'low' | 'normal' | 'high'`
* `overlapPolicy: 'skip' | 'coalesce' | 'queue'`
* `maxQueue: number | null | undefined`
* `queueErrorPolicy: 'clear' | 'preserve' | 'cap' | 'dropOne'`
* `errorPolicy: 'continue' | 'pause' | 'cancel' | 'backoff'`
* `workspace: object`
* `runWhenHidden: boolean`
* `runWhenOffline: boolean`
* `onConstruct: function | null`
* `constructErrorPolicy: 'pause' | 'retry' | 'cancel'`
* `onDestroy: function | null`

---

## Interval Lifecycle Methods

### `interval.start(reason?)`

* Idempotent
* No-op if cancelled or manager disposed
* Obeys environment gating

### `interval.pause(reason?)`

### `interval.cancel(reason?)`

* Idempotent
* Invokes `onDestroy` at most once

### `interval.reset()`

Resets counters and transient execution state.

Does not change lifecycle status **except** that if the interval is currently running and environment policy blocks execution, the interval may transition to `paused`.

---

## Execution Methods

### `interval.runNow(payload?, reason?)`

* Requests immediate run attempt
* Applies overlap policy if inflight

### `interval.step(reason?)`

Attempts exactly one run (obeys environment gating).

Always pauses after completion.

### `interval.reschedule(inMs)`

One-shot override for the next scheduling delay.

---

## Signaling

### `interval.signal(type, payload?)`

* Stores signal for next tick
* Built-in control signals: `pause`, `cancel`, `start`, `resume`, `reset`, `runNow`

---

## Introspection

### `interval.snapshot() → object`

Returns a serializable snapshot of interval state.

### `interval.isRunnable() → boolean`

Returns true if the interval is eligible to execute work **or accept a pending run** under current conditions (environment gating, lifecycle status, and `maxRuns`).

* If a run is inflight, this may still return true when `overlapPolicy` allows pending work (`coalesce` or `queue`).

---

## Execution Context (`ctx`)

Provided to `fn(ctx)`.

Includes:

* Identity: `name`
* Timing: `now`, `startedAt`, `lastRunAt`, `nextRunAt`
* Counters: `runs`, `maxRuns`
* Metadata: `reason`, `lastReason`, `lastError`
* Workspace: `workspace`
* Read-only config hints: `everyMs`, `overlapPolicy`, `errorPolicy`, `priority`

> **Note:** Signals are consumed as control inputs before `fn(ctx)` runs. Therefore, a previously sent signal is **not guaranteed** to be visible inside `fn(ctx)` as `ctx.lastSignal`.

### Convenience controls on `ctx`

* `ctx.start()` / `ctx.pause()` / `ctx.cancel()`
* `ctx.runNow()` / `ctx.reschedule(inMs)`
* `ctx.signal(type, payload?)`

---

## Decision Object Contract

`fn(ctx)` may return:

* `{ action: 'pause' }`
* `{ action: 'cancel' }`
* `{ action: 'reschedule', inMs: number }`
* `{ action: 'continue' }` (or unknown → no-op)

---

## Cross-Cutting Invariants

* Registering the same name replaces safely
* Telemetry must never break execution
* Environment gating is always enforced after start/resume
* `step()` is single-run then pause
* Snapshots are JSON-serializable

---

## Integration Guidance for LLMs

* Treat this system as a **black-box scheduler**
* Rely only on APIs, guarantees, and invariants defined here
* If behavior is not specified, it must be treated as unknown

---

**End of Contract**


# --- end: docs/api/INTERVAL_API_CONTRACT.md ---



# --- begin: docs/api/INTERVAL_MANAGER.md ---

 -------------------------------------------------------------------- |
 | `autoRemove`       | boolean  | `true`  | Automatically remove cancelled/completed intervals from the registry |
 | `pauseWhenHidden`  | boolean  | `true`  | Auto-pause intervals when document becomes hidden                    |
 | `pauseWhenOffline` | boolean  | `true`  | Auto-pause intervals when browser goes offline                       |
 | `onEvent`          | function | `null`  | Telemetry hook for lifecycle and execution events                    |
 | `clock`            | object   | native  | Custom clock abstraction (testing / simulation)                      |
 | `environment`      | object   | `{}`    | Initial environment state (`visible`, `online`, `suspended`)         |

Example:

```js
const manager = new IntervalManager({
  pauseWhenHidden: true,
    pauseWhenOffline: true,
      autoRemove: true,
        onEvent: (ev) => console.debug('interval event', ev)
	});
	```

---

## Registration & Lookup

### `manager.register(config)`

Registers a new interval or replaces an existing one with the same name.

```js
const interval = manager.register({
  name: 'heartbeat',
    everyMs: 5000,
      fn: (ctx) => { /* work */ }
      });
      ```

* If an interval with the same name already exists, it is **cancelled and replaced**
* Returns the created `ManagedInterval` instance
* Does **not** automatically start the interval

See: **[ManagedInterval configuration](./MANAGED_INTERVAL.md)** for full config schema.


---

### `manager.has(name)`

```js
manager.has('heartbeat') → boolean
```

Returns `true` if an interval with the given name exists.

---

### `manager.get(name)`

```js
manager.get('heartbeat') → ManagedInterval | null
```

Returns the interval instance, or `null` if not found.

---

### `manager.list()`

```js
manager.list() → string[]
```

Returns an array of all registered interval names.

---

### `manager.snapshot(name?)`

```js
manager.snapshot()        // all intervals
manager.snapshot('clock') // single interval
```

Returns a **serializable snapshot** of current interval state:

* Status
* Counters
* Timing metadata
* Last error
* Environment gating status

Useful for debugging, telemetry, or persistence.

---

## Lifecycle Control

All lifecycle methods accept an optional `name`.
If omitted, the action applies to **all intervals**.

---

### `manager.start(name?)`

Starts or resumes an interval.

```js
manager.start('heartbeat');
manager.start(); // start all
```

Notes:

* Starting an already running interval is a no-op
* Starting respects environment gating

---

### `manager.resume(name?)`

Alias of `start()`.

---

### `manager.pause(name?)`

Pauses an interval without destroying it.

```js
manager.pause('heartbeat');
```

Paused intervals:

* Retain state
* Do not schedule ticks
* May be resumed later

---

### `manager.cancel(name?)`

Cancels an interval permanently.

```js
manager.cancel('heartbeat');
```

Effects:

* Stops scheduling
* Invokes `onDestroy` hook (once)
* Removes interval from registry if `autoRemove === true`

---

### `manager.stopAll()`

```js
manager.stopAll();
```

Stops all intervals immediately.

Semantics:

* Equivalent to cancelling all intervals with reason **`"stopAll"`**
* Unlike `dispose()`, the manager remains usable afterward (you may register/start new intervals)

---

---

### `manager.dispose()`

```js
manager.dispose();
```

Destroys the manager entirely:

* Cancels all intervals (reason: `"dispose"`)
* Clears the registry
* Marks the manager as disposed

After disposal, most public APIs will throw if called.

Use this during a

---

## Execution & Signaling

### `manager.step(name, reason?)`

Executes exactly one run for an interval (debug / stepping).

```js
manager.step('heartbeat');
manager.step('heartbeat', 'debug step');
```

Notes:

* Delegates to `ManagedInterval.step(reason)`
* Intended for debugging and controlled single-run execution
* Overlap and environment gating rules are enforced by the interval

---

### `manager.runNow(name, payload?)`

Triggers an immediate execution attempt of an interval.

```js
manager.runNow('heartbeat');
```

Notes:

* Delegates to `ManagedInterval.runNow(payload, 'runNow')`
* Does **not** count toward `runs` / `maxRuns`
* Obeys overlap policies (`skip` / `coalesce` / `queue`)
* Obeys environment gating (it will not force execution while blocked)
* `payload` is currently **reserved for future use** (accepted but not consumed by the current engine)

---

---

### `manager.signal(name, type, payload?)`

Sends a signal to a specific interval.

```js
manager.signal('worker', 'refresh');
```

Signals:

* Are delivered immediately or on next run
* Are available via `ctx.lastSignal`

---

### `manager.signalAll(type, payload?)`

Broadcasts a signal to all intervals.

---

### `manager.setWorkspace(name, workspace)`

Replaces an interval’s workspace object.

```js
manager.setWorkspace('job', { retries: 0 });
```

---

## Environment Management

### `manager.updateEnvironment(state)`

Updates the global environment state.

```js
manager.updateEnvironment({
  visible: false,
    online: true,
      suspended: false
      });
      ```

Supported flags:

* `visible` — document visibility
* `online` — network connectivity
* `suspended` — manual suspension flag

Effects:

* Triggers auto-pause or auto-resume
* Individual intervals may override via config (`runWhenHidden`, `runWhenOffline`)

---

## Telemetry (`onEvent`)

If provided, `onEvent` receives structured lifecycle events such as:

* interval registered / replaced
* start / pause / resume / cancel
* execution begin / end
* error encountered
* environment-induced pause

Shape is intentionally flexible to allow logging, analytics, or dev tooling.

---

## Related Docs

* **ManagedInterval API** → [`MANAGED_INTERVAL.md`](./MANAGED_INTERVAL.md)
* **Usage & Examples** → [`EXAMPLES_LIBRARY.md`](../usage/EXAMPLES_LIBRARY.md)
* **Quick Start** → [`QUICKSTART.md`](../usage/QUICKSTART.md)


# --- end: docs/api/INTERVAL_MANAGER.md ---



# --- begin: docs/api/MANAGED_INTERVAL.md ---

# ManagedInterval API Reference

`ManagedInterval` represents a single named, managed interval registered under an `IntervalManager`.

It owns:

* Per-interval configuration (timing, overlap policy, error policy, environment overrides)
* Lifecycle state (running / paused / cancelled)
* Execution of your callback with a standardized context (`fn(ctx)`)
* Overlap semantics (`skip` / `coalesce` / `queue`)
* Error handling semantics (`continue` / `pause` / `cancel` / `backoff`)
* Optional one-time hooks (`onConstruct`, `onDestroy`)

> In normal usage you do not `new ManagedInterval()` directly — you get an instance from `manager.register(config)`.

---

## Creation

### Via manager

```js
const interval = manager.register({
  name: 'heartbeat',
  everyMs: 5000,
  fn: (ctx) => console.log('tick', ctx.runs)
});
```

### Constructor (advanced)

```js
const interval = new ManagedInterval(manager, config)
```

This is primarily useful for testing or custom integrations.

---

## Configuration

### Required fields

| Field     | Type     | Description                                         |
| --------- | -------- | --------------------------------------------------- |
| `name`    | string   | Unique identifier within the manager                |
| `everyMs` | number   | Base interval period in milliseconds                |
| `fn`      | function | Callback invoked as `fn(ctx)`; may be sync or async |

### Optional fields

| Field                  | Type                          | Default    | Description                                                                                                                  |              |                                                           |                                                                    |
| ---------------------- | ----------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------- | ------------------------------------------------------------------ |
| `maxRuns`              | number                        | `0`        | Max executions; `0` means unlimited                                                                                          |              |                                                           |                                                                    |
| `priority`             | `'low'                        | 'normal'   | 'high'`                                                                                                                      | `'normal'`   | Hint only (ordering not enforced yet)                     |                                                                    |
| `overlapPolicy`        | `'skip'                       | 'coalesce' | 'queue'`                                                                                                                     | `'coalesce'` | Behavior when a tick occurs while another run is inflight |                                                                    |
| `maxQueue`             | `number \| null \| undefined` | `100`      | Queue cap (only used when `overlapPolicy==='queue'`): `null/undefined` → 100; `0`/`Infinity` → unbounded; negative/NaN → 100 |              |                                                           |                                                                    |
| `queueErrorPolicy`     | `'clear'                      | 'preserve' | 'cap'                                                                                                                        | 'dropOne'`   | `'clear'`                                                 | What happens to queued backlog when a run errors (queue mode only) |
| `errorPolicy`          | `'continue'                   | 'pause'    | 'cancel'                                                                                                                     | 'backoff'`   | `'continue'`                                              | What to do when `fn(ctx)` throws or rejects                        |
| `workspace`            | object                        | `{}`       | Mutable state persisted across runs (available as `ctx.workspace`)                                                           |              |                                                           |                                                                    |
| `runWhenHidden`        | boolean                       | `false`    | Allow runs while manager environment is not visible                                                                          |              |                                                           |                                                                    |
| `runWhenOffline`       | boolean                       | `false`    | Allow runs while manager environment is offline                                                                              |              |                                                           |                                                                    |
| `onConstruct`          | function                      | `null`     | One-time initialization hook (sync or async)                                                                                 |              |                                                           |                                                                    |
| `constructErrorPolicy` | `'pause'                      | 'retry'    | 'cancel'`                                                                                                                    | `'pause'`    | Behavior when `onConstruct` fails                         |                                                                    |
| `onDestroy`            | function                      | `null`     | One-time teardown hook invoked on cancel (sync or async)                                                                     |              |                                                           |                                                                    |

> Note: `maxQueue` is normalized internally and defaults to `100` via `DEFAULT_MAX_QUEUE`.

### Timing notes

* `everyMs` is normalized to **at least 1ms**, and defaults to **1000ms** if omitted.

---

## Lifecycle

### `interval.start(reason?)`

Starts or resumes the interval.

```js
interval.start();
interval.start('resume after login');
```

Semantics:

* Idempotent: calling while already running is a no-op
* No-op if cancelled or if the manager is disposed
* Obeys environment gating (hidden/offline/suspended) unless overridden by `runWhenHidden` / `runWhenOffline`

---

### `interval.pause(reason?)`

Pauses the interval (non-destructive).

```js
interval.pause();
interval.pause('user navigated away');
```

Semantics:

* Clears any scheduled timer
* Keeps state and configuration intact

---

### `interval.cancel(reason?)`

Cancels the interval permanently.

```js
interval.cancel();
interval.cancel('feature disabled');
```

Semantics:

* Idempotent
* Invokes `onDestroy(ctx, reason)` at most once (errors never prevent cancellation)
* Clears timers and prevents future ticks
* Manager may auto-remove it from the registry (`autoRemove`)

---

### `interval.reset()`

Resets counters and transient execution state without changing lifecycle status.

```js
interval.reset();
```

Resets:

* `runs`, `startedAt`, `lastRunAt`, `nextRunAt`
* `lastError`, `lastSignal`, `lastReason`
* `inflight`, `pending`, `queueCount`, `backoffMs`
* internal step / constructor bookkeeping (`_stepOnce`, `_hasConstructRun`)

Allows `onConstruct` to run again on the next eligible tick/start.

If the interval was running, it schedules the next tick ASAP (subject to environment gating).

---

## Execution

### `interval.runNow(payload?, reason?)`

Requests an immediate run.

```js
interval.runNow();
interval.runNow(null, 'manual');
```

Semantics:

* Obeys environment gating (will not force execution while blocked)
* If paused: transitions to running and schedules ASAP
* If inflight: applies overlap policy:

  * `skip` → drop
  * `coalesce` → set `pending=true`
  * `queue` → increment `queueCount` up to `maxQueue` (or unbounded)

Notes:

* `payload` is currently **reserved for future use** (accepted but not consumed)

---

### `interval.step(reason?)`

Executes exactly one run, then ensures the interval is paused after completion.

```js
interval.step();
interval.step('debug');
```

Semantics:

* Obeys environment gating
* If inflight: does not start a second execution; instead guarantees a pause once inflight completes
* Drain-first (preserving backlog as much as possible):

  * `queue` → consumes **one** queued unit before stepping
  * `coalesce` → consumes the pending unit before stepping
* Always pauses after completion (success or error)
* **Does not auto-drain queue/pending after the stepped run** (step mode wins over normal drain logic)

---

## Scheduling helpers

### `interval.reschedule(inMs)`

One-shot override for the *next scheduling delay*.

```js
interval.reschedule(15_000); // apply 15s delay on the next schedule
```

Semantics:

* Sets a one-time delay override (`backoffMs`) consumed by the scheduler on the next scheduling decision
* Safe to call during execution
* If `status === 'running'` and `!inflight`, it clears the existing timer and schedules a **0ms** timer tick (no synchronous execution) so the new delay can be applied promptly

---

## Signaling

### `interval.signal(type, payload?)`

Stores a signal for the next tick and emits optional manager telemetry.

```js
interval.signal('refresh');
interval.signal('pause');
```

What is stored:

* `interval.lastSignal = { type, payload, at }`
* `interval.lastReason` is also set to `signal:<type>` (for readability)

Built-in control signals handled by the engine (once per tick):

* `pause` → pauses the interval
* `cancel` → cancels the interval
* `start` / `resume` → starts the interval
* `reset` → resets state
* `runNow` → schedules an ASAP run (without forcing execution through gating)

Other signal types are simply recorded and exposed in the context.

---

## Introspection

### `interval.snapshot()`

Returns a serializable snapshot of current state.

Includes:

* Config hints (`everyMs`, `maxRuns`, `overlapPolicy`, `errorPolicy`, `priority`)
* Lifecycle state (`status`, `runs`, timestamps)
* Execution/meta (`inflight`, `pending`, `queueCount`, `lastReason`, `lastError`, `lastSignal`)
* Scheduling override (`backoffMs`)

---

### `interval.isRunnable()`

```js
interval.isRunnable() → boolean
```

Returns `true` if the interval is eligible to execute work.

Checks:

* `status === 'running'`
* Manager not suspended
* Environment gating allows execution (unless overridden)
* Max runs not reached
* If inflight: returns `true` only when the overlap policy can accept more work (`coalesce` / `queue`)

---

## Execution context (`ctx`)

Your callback is invoked as:

```js
fn: (ctx) => {
  // ...
}
```

The context includes:

### Identity & timing

* `ctx.name`
* `ctx.now`
* `ctx.startedAt`
* `ctx.lastRunAt`
* `ctx.nextRunAt`

### Counters

* `ctx.runs`
* `ctx.maxRuns`

### Metadata

* `ctx.reason` (timer/manual/signal/etc)
* `ctx.lastReason`
* `ctx.lastError`
* `ctx.lastSignal`

### Workspace

* `ctx.workspace` (mutable; persisted across runs)

### Interval hints (read-only config)

* `ctx.everyMs`
* `ctx.overlapPolicy`
* `ctx.errorPolicy`
* `ctx.priority`

### Convenience controls

* `ctx.start(reason?)`
* `ctx.pause(reason?)`
* `ctx.cancel(reason?)`
* `ctx.runNow(payload?, reason?)`
* `ctx.reschedule(inMs)`
* `ctx.signal(type, payload?)`

---

## Returning decisions from `fn(ctx)`

`fn(ctx)` may return (or resolve to) a **decision object** that the engine applies after a successful run:

```js
fn: (ctx) => {
  if (shouldStop()) return { action: 'pause' };
  if (shouldEnd())  return { action: 'cancel' };
  if (shouldWait()) return { action: 'reschedule', inMs: 10_000 };
  return { action: 'continue' };
}
```

Supported decisions:

* `{ action: 'pause' }` → pauses (reason: `decision`)
* `{ action: 'cancel' }` → cancels (reason: `decision`)
* `{ action: 'reschedule', inMs: number }` → applies a one-shot scheduling delay
* `{ action: 'continue' }` (or unknown) → no-op

---

## Overlap policies (quick mental model)

### `skip`

If a tick happens while a run is inflight, drop it.

### `coalesce`

If ticks happen while inflight, remember **exactly one** pending run.

### `queue`

If ticks happen while inflight, queue multiple runs (`queueCount`) up to `maxQueue`.

> In queue mode, queued runs drain **one at a time** ASAP after a completion.

---

## Error policies

When `fn(ctx)` throws or rejects:

* `continue` → record error and keep scheduling
* `pause` → pause the interval
* `cancel` → cancel the interval
* `backoff` → apply exponential delay growth (capped by manager option `backoffCapMs`, default cap: **60s**)

Queue-specific on-error handling (only when `overlapPolicy==='queue'` and `queueCount > 0`):

* `clear` (default) → drop entire queue
* `preserve` → keep queue
* `cap` → clamp queue to 1
* `dropOne` → decrement queue by 1

---

## Related Docs

* **IntervalManager API** → [`INTERVAL_MANAGER.md`](./INTERVAL_MANAGER.md)
* **Usage & Examples** → [`EXAMPLES_LIBRARY.md`](../usage/EXAMPLES_LIBRARY.md)
* **Quick Start** → [`QUICKSTART.md`](../usage/QUICKSTART.md)


# --- end: docs/api/MANAGED_INTERVAL.md ---



# --- begin: docs/usage/EXAMPLES_LIBRARY.md ---

# Examples Library – IntervalManager

This document collects practical, real-world-ish patterns you can copy-paste and adapt.  
All examples assume you already have a running `IntervalManager` instance called `manager`.

```js
// Common setup (used in most examples below)
const manager = new IntervalManager({
  pauseWhenHidden: true,
  pauseWhenOffline: true,
  autoRemove: true
});
```

## 1. Periodic API Polling with Exponential Backoff on Failure

```js
manager.register({
  name: 'fetch-user-balance',
  everyMs: 30000,                     // poll every 30 seconds normally
  errorPolicy: 'backoff',             // auto-backoff on errors
  runWhenHidden: false,
  runWhenOffline: false,
  workspace: {
    lastBalance: null,
    consecutiveFailures: 0
  },
  fn: async (ctx) => {
    try {
      const response = await fetch('/api/user/balance', { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      ctx.workspace.lastBalance = data.balance;
      ctx.workspace.consecutiveFailures = 0;

      console.log(`Balance updated: ${data.balance}`);
      
      // Optional: act on big changes
      if (data.balance > 10000) {
        ctx.signal('high-balance-alert', { balance: data.balance });
      }
    } catch (err) {
      ctx.workspace.consecutiveFailures++;
      console.warn(`Balance fetch failed (${ctx.workspace.consecutiveFailures}x)`, err);
      // Let errorPolicy='backoff' handle delay increase
    }
  }
});

manager.start('fetch-user-balance');
```

## 2. User Activity Heartbeat (only when tab is active)

```js
manager.register({
  name: 'user-presence',
  everyMs: 60000,                     // report every minute
  runWhenHidden: false,               // pause when tab is backgrounded
  runWhenOffline: false,
  fn: (ctx) => {
    // You might send to analytics, update "last seen", etc.
    fetch('/api/heartbeat', {
      method: 'POST',
      keepalive: true,
      body: JSON.stringify({ ts: ctx.now })
    }).catch(() => {}); // silent fail — don't break the interval

    console.debug('[presence] User is here');
  }
});

manager.start('user-presence');
```

## 3. Throttled Console Logging (dev/debug mode only)

```js
if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
  manager.register({
    name: 'verbose-log-throttle',
    everyMs: 4500,                    // max ~1 log every 4.5 seconds
    overlapPolicy: 'skip',            // drop extra calls during inflight
    fn: (ctx) => {
      console.groupCollapsed(`Verbose tick #${ctx.runs}`);
      console.log('Current route:', window.location.pathname);
      console.log('Memory usage:', performance.memory?.usedJSHeapSize);
      console.groupEnd();
    }
  });

  manager.start('verbose-log-throttle');
}
```

## 4. Idle Timeout Detector + Auto-Logout

```js
manager.register({
  name: 'idle-detector',
  everyMs: 15000,                     // check every 15 seconds
  workspace: { lastActivity: Date.now() },
  fn: (ctx) => {
    const idleMs = ctx.now - ctx.workspace.lastActivity;
    
    if (idleMs > 5 * 60 * 1000) {     // 5 minutes idle
      console.warn('User idle too long → logging out');
      // window.location = '/logout';   // or show modal, etc.
      ctx.cancel('idle timeout reached');
    }
  }
});

// Update last activity on user events
function updateActivity() {
  const interval = manager.get('idle-detector');
  if (interval) {
    interval.workspace.lastActivity = Date.now();
  }
}

['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
  document.addEventListener(evt, updateActivity, { passive: true });
});

manager.start('idle-detector');
```

## 5. Rate-Limited Job Queue (process one item every few seconds)

```js
// Assume you have a queue somewhere
const jobQueue = []; // push jobs with { id, fn }

manager.register({
  name: 'job-processor',
  everyMs: 4000,                      // process one job every 4 seconds
  overlapPolicy: 'skip',
  fn: (ctx) => {
    if (jobQueue.length === 0) return;

    const job = jobQueue.shift();
    console.log(`Processing job ${job.id}`);

    try {
      job.fn();
      console.log(`Job ${job.id} completed`);
    } catch (err) {
      console.error(`Job ${job.id} failed`, err);
      // Optional: re-queue or move to dead-letter
    }
  }
});

manager.start('job-processor');

// Usage elsewhere:
jobQueue.push({
  id: 'send-welcome-email-123',
  fn: () => { /* send email logic */ }
});
```

## 6. One-Time Delayed Notification (fire once after delay)

```js
manager.register({
  name: 'welcome-notification',
  everyMs: 8000,                      // will only run once
  maxRuns: 1,
  fn: (ctx) => {
    alert('Welcome back! You have 3 new messages.');
    // or show toast, etc.
  }
});

manager.start('welcome-notification');
```

## 7. Dynamic Interval Rescheduling (adaptive polling)

```js
manager.register({
  name: 'adaptive-price-check',
  everyMs: 60000,                     // start at 1 min
  fn: (ctx) => {
    // Pseudo-code: check market volatility
    const volatility = Math.random();   // imagine real metric

    if (volatility > 0.8) {
      // high volatility → check more often
      ctx.reschedule(15000);            // next run in 15 seconds
      console.log('High volatility → polling faster');
    } else if (volatility < 0.2) {
      // calm → slow down
      ctx.reschedule(120000);           // next in 2 minutes
      console.log('Market calm → slowing down');
    }
  }
});

manager.start('adaptive-price-check');


## Related Docs

- [Quick Start](./QUICKSTART.md)
- [Installation](./INSTALLATION.md)
- [API Docs](../api/INDEX.md)


# --- end: docs/usage/EXAMPLES_LIBRARY.md ---



# --- begin: docs/usage/INSTALLATION.md ---

# Installation – IntervalManager

IntervalManager is currently distributed as plain JavaScript files (not yet published to npm or any package registry).

There are **two supported installation modes**:

1. **Recommended**: `auto.js` integration with **m7-lib** (simplest for browser usage)
2. **Manual / Module** usage without `auto.js` (bundlers, tests, advanced setups)

---

## Prerequisites

* **m7-lib** version **0.98 or higher**
  Required *only* when using `auto.js`. IntervalManager uses `lib.hash.set` to register itself into `window.lib`.

* Modern browser environment (Chrome 90+, Firefox 85+, Safari 14.1+, Edge 90+ recommended)

---

## Option A – Recommended (auto.js)

This is the simplest and preferred setup if you are already using **m7-lib**.

### 1. Project structure (example)

```
your-project/
├── lib/
│   ├── m7-lib.min.js               ← m7-lib v0.98+
│   └── interval/
│       └── auto.js                 ← installs IntervalManager automatically
├── index.html
└── main.js
```

> You do **not** need to copy or load `IntervalManager.js` or `ManagedInterval.js` manually when using `auto.js`.

---

### 2. HTML setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My App</title>
</head>
<body>

  <!-- Load m7-lib (classic or module build) -->
  <script src="/lib/m7-lib.min.js"></script>

  <!-- Install IntervalManager into window.lib -->
  <script type="module" src="/lib/interval/auto.js"></script>

  <!-- Your application code -->
  <script src="/main.js"></script>
</body>
</html>
```

This installs the following API:

```js
lib.interval.manager   // IntervalManager factory
```

Usage in `main.js`:

```js
const manager = new lib.interval.manager({
  pauseWhenHidden: true,
  pauseWhenOffline: true
});
```

---

## Option B – Manual / Module Usage (no auto.js)

Use this approach for bundlers, tests, or environments without `m7-lib`.

### 1. Copy files

```
lib/interval/
├── IntervalManager.js
├── ManagedInterval.js
└── (optional index.js)
```

### 2. Import directly

```js
import { IntervalManager } from './lib/interval/IntervalManager.js';

const manager = new IntervalManager({
  pauseWhenHidden: true,
  autoRemove: true
});
```

> `m7-lib` is **not required** in this mode.

---

## Troubleshooting

| Symptom                                  | Likely Cause                                   | Fix                                |
| ---------------------------------------- | ---------------------------------------------- | ---------------------------------- |
| `lib.hash.set is not a function`         | Wrong `m7-lib` version                         | Use `m7-lib` ≥ 0.98                |
| `lib.interval` is undefined              | `auto.js` not loaded or loaded before `m7-lib` | Ensure `m7-lib` loads first        |
| `lib.interval.manager is not a function` | `auto.js` not executed as module               | Use `<script type="module">`       |
| Intervals don’t pause when hidden        | Manager or interval override                   | Ensure `pauseWhenHidden !== false` |
| Unexpected interval execution            | `runWhenHidden` / `runWhenOffline` overrides   | Check per-interval config          |

---

## TypeScript users (optional)

No official `.d.ts` files are provided yet.

Minimal workaround:

```ts
declare module './lib/interval/IntervalManager.js' {
  export class IntervalManager {}
  export class ManagedInterval {}
}
```

Alternatively, rely on JSDoc + editor inference.

---

## Future npm support

When published (e.g. `@m7/interval`):

```bash
npm install @m7/interval
```

```js
import { IntervalManager } from '@m7/interval';
```

---

## Related Docs

- **Quick Start** → [`QUICKSTART.md`](./QUICKSTART.md)
- **Examples** → [`EXAMPLES_LIBRARY.md`](./EXAMPLES_LIBRARY.md)
- **API Docs** → [`INDEX.md`](../api/INDEX.md)


# --- end: docs/usage/INSTALLATION.md ---



# --- begin: docs/usage/QUICKSTART.md ---

# Quick Start – IntervalManager

This guide gets you running your first managed interval in under 2 minutes.

## 1. Project Setup (one-time)

Make sure m7-lib ≥ v0.98 is loaded **before** IntervalManager files.

```html
<!-- Load m7-lib first (required) -->
<script src="/path/to/m7-lib-v0.98.min.js"></script>

<!-- Then load IntervalManager files -->
<script src="/path/to/interval/ManagedInterval.js"></script>
<script src="/path/to/interval/IntervalManager.js"></script>

<!-- Recommended: include auto.js for the nice shortcut -->
<script src="/path/to/interval/auto.js"></script>
```

After including `auto.js`, you can use the convenient shortcut:

```js
const manager = new lib.interval.manager();
```

Alternatively, use standard imports (module environments):

```js
import { IntervalManager } from './lib/interval/IntervalManager.js';
const manager = new IntervalManager();
```

## 2. Create & Start a Simple Interval

```javascript
// Option A: Using the lib.interval shortcut (requires auto.js)
const manager = new lib.interval.manager({
  pauseWhenHidden: true,
  pauseWhenOffline: true
});

// Option B: Standard way (works with or without auto.js)
const manager = new IntervalManager({
  pauseWhenHidden: true,
  pauseWhenOffline: true
});

// Register a simple interval
manager.register({
  name: 'clock',
  everyMs: 1000,                  // every second
  runWhenHidden: false,           // pause when tab is not visible
  fn: (ctx) => {
    console.log(`Tick #${ctx.runs}  —  ${new Date().toLocaleTimeString()}`);
    
    // Optional: auto-stop after 8 ticks
    if (ctx.runs >= 8) {
      ctx.cancel('demo finished');
    }
  }
});

// Start it
manager.start('clock');
```

Expected console output:
```
Tick #1  —  14:35:22
Tick #2  —  14:35:23
...
Tick #8  —  14:35:29
```

## 3. Quick Control Examples

### Pause, resume, manual run
```js
manager.pause('clock');         // stop ticking
manager.resume('clock');        // or manager.start('clock')
manager.runNow('clock');        // execute the function right now
```

### Using workspace to keep state
```js
manager.register({
  name: 'counter',
  everyMs: 2500,
  workspace: { value: 0 },
  fn: (ctx) => {
    ctx.workspace.value += 1;
    console.log(`Counter → ${ctx.workspace.value}`);
    if (ctx.workspace.value >= 5) ctx.cancel();
  }
});

manager.start('counter');
```

### Handling errors with backoff
```js
manager.register({
  name: 'risky-task',
  everyMs: 3000,
  errorPolicy: 'backoff',       // automatically increases delay after errors
  fn: (ctx) => {
    if (Math.random() > 0.6) {
      throw new Error('Random failure');
    }
    console.log('Task succeeded');
  }
});

manager.start('risky-task');
```

## 4. Cleanup

```js
// Stop one interval
manager.cancel('clock');

// Stop everything
manager.stopAll();

// Destroy the manager completely (cancels all timers)
manager.dispose();
```

## Next Steps

- Want more realistic examples? → [EXAMPLES_LIBRARY.md](./EXAMPLES_LIBRARY.md)  
  (periodic API polling, user-activity heartbeats, rate-limited jobs, etc.)
- Detailed installation notes & troubleshooting → [INSTALLATION.md](./INSTALLATION.md)
- Full method reference & configuration options → [TOC.md](./TOC.md)

Happy interval managing!



# --- end: docs/usage/QUICKSTART.md ---



# --- begin: docs/usage/TOC.md ---

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


# --- end: docs/usage/TOC.md ---



# --- begin: docs/USE_POLICY.md ---

# 📘 m7-lib-interval Use Policy

This document outlines how you may use m7-lib-interval under the **Moderate Team License (MTL-10)** and what is expected of you as a user.

---

## ✅ Free Use — What You Can Do

You may use m7-lib-interval **for free** if you fall under any of the following categories:

* **Individuals** using it for personal projects, learning, or experimentation
* **Academic institutions or researchers** using it for teaching, papers, or labs
* **Nonprofits and NGOs** using it internally without revenue generation
* **Startups or companies** with **10 or fewer users** of m7-lib-interval internally

  * This includes development, deployment, and operational use

There is **no cost, license key, or approval required** for these use cases.

---

## 🚫 Commercial Restrictions

m7-lib-interval **may not be used** in the following ways without a paid commercial license:

* As part of a **commercial product** that is sold, licensed, or monetized
* Embedded within a platform, device, or SaaS product offered to customers
* Internally at companies with **more than 10 users** working with m7-lib-interval
* As a hosted service, API, or backend component for commercial delivery
* In resale, sublicensing, or redistribution as part of paid offerings

---

## 🔒 Definitions

* **User**: Anyone who installs, configures, modifies, integrates, or interacts with m7-lib-interval as part of their role.
* **Commercial use**: Use in a context intended for revenue generation or business advantage (e.g. SaaS, enterprise ops, service platforms).

---

## 💼 Licensing for Larger or Commercial Use

If your company, product, or service falls outside the free use scope:

📩 **Contact us at \[[legal@m7.org](mailto:legal@m7.org)]** to arrange a commercial license.

Licensing is flexible and supports:

* Enterprise support and maintenance
* Extended deployment rights
* Integration into proprietary systems
* Long-term updates and private features

---

## 🤝 Community Guidelines

* Contributions are welcome under a Contributor License Agreement (CLA)
* Respect user limits — we reserve the right to audit compliance
* We appreciate feedback and security reports via \[[security@m7.org](mailto:security@m7.org)]

---

## 📝 Summary

| Use Case                            | Allowed?      |
| ----------------------------------- | ------------- |
| Hobby / personal projects           | ✅ Yes         |
| Research or academic use            | ✅ Yes         |
| Internal team use (≤ 10 people)     | ✅ Yes         |
| SaaS / resale / commercial platform | ❌ License req |
| Internal use by >10 users           | ❌ License req |

---

This policy supplements the terms in `LICENSE.md` and helps clarify user expectations.


# --- end: docs/USE_POLICY.md ---



# --- begin: docs/WHY_NOT_SETINTERVAL.md ---

# Why IntervalManager (instead of `setInterval`)?

`setInterval` is fine for simple demos.

But in real applications, repeating work tends to collide with:

* async functions that take longer than the interval
* intermittent network failures
* background tabs and sleeping devices
* multiple independent timers fighting for attention
* lack of centralized visibility (what is running, why, and for how long?)

IntervalManager exists to make recurring work **predictable, observable, and controllable**.

---

## The core problem: `setInterval` has no lifecycle model

With `setInterval`, you get one primitive:

```js
const id = setInterval(fn, 1000);
```

You do *not* get:

* a name
* a registry
* a state machine (running/paused/cancelled)
* a consistent way to pause based on environment
* built-in concurrency handling for async work
* backoff for failures
* structured telemetry

Most real apps end up reinventing these pieces—usually in inconsistent ways.

---

## 1) Overlap and async: the "double-run" bug

If your interval work is async and sometimes takes longer than the interval duration, `setInterval` will happily fire again while the previous run is still inflight.

That can create:

* duplicated requests
* race conditions
* corrupt shared state
* cascading load under slow conditions

### With `setInterval`

```js
setInterval(async () => {
  await fetch('/api/poll');
}, 1000);
```

If the network stalls for 3 seconds, you can get **3 concurrent runs**.

### With IntervalManager

You pick an overlap policy:

* `skip` → drop ticks while inflight
* `coalesce` → collapse multiple ticks into **one** follow-up run
* `queue` → retain multiple ticks up to a cap

This turns a chaotic concurrency situation into an explicit choice.

---

## 2) Environment awareness: stop working when it doesn’t matter

Modern browsers throttle background tabs. Devices go to sleep. Connectivity drops.

With `setInterval`, your timer doesn’t know (or care):

* whether the tab is visible
* whether the device is offline
* whether your app is in a suspended state

So you waste work—or worse, you behave unpredictably.

### IntervalManager makes environment gating first-class

At the manager level you can say:

* pause when hidden
* pause when offline
* pause when suspended

And per interval you can override:

* `runWhenHidden: true`
* `runWhenOffline: true`

So your app behaves intentionally rather than incidentally.

---

## 3) Failure handling: backoff is not optional in production

Real tasks fail.

With `setInterval`, a failed request just fails—then the timer fires again anyway.

This can create:

* repeated hammering of a failing endpoint
* wasted battery
* amplified outages

### IntervalManager includes an error policy

You can configure:

* `continue` (default) → keep going
* `pause` → stop until resumed
* `cancel` → permanent shutdown
* `backoff` → increase delay after failures, then recover after a success

Backoff is a first-class behavior instead of something you bolt on later.

---

## 4) Observability: "what’s running right now?"

When a system has multiple timers, debugging becomes a guessing game:

* Which timer is still active?
* Which one is stuck?
* Why did it stop?
* How many times has it run?
* When will it run next?

### IntervalManager provides a registry and snapshots

* `manager.list()` → which intervals exist
* `manager.snapshot()` → serializable runtime state
* `onEvent` hook → structured lifecycle events

You can log, inspect, and reason about recurring work as a system.

---

## 5) Lifecycle: start/pause/resume/cancel as explicit operations

`setInterval` gives you:

* start
* stop

Everything else (pause, resume, step, run once, cancel permanently) is a custom pattern.

IntervalManager adds explicit lifecycle controls:

* `start()` / `resume()`
* `pause()`
* `cancel()`
* `stopAll()`
* `dispose()`

Plus development/debug helpers:

* `runNow()`
* `step()`

---

## The mental model

If `setInterval` is a raw timer primitive,
IntervalManager is a *small scheduler* with:

* named tasks
* policy surfaces (overlap, error, environment)
* introspection
* safe teardown

That’s why it exists.

---

## When you *should* still use `setInterval`

Use `setInterval` when:

* the work is tiny and synchronous
* overlap can’t happen
* you don’t care about visibility/offline behavior
* you don’t need debugging or observability

In other words: small scripts, demos, throwaways.

---

## Where to go next

* **Quick Start** → [`QUICKSTART.md`](./usage/QUICKSTART.md)
* **Examples Library** → [`EXAMPLES_LIBRARY.md`](./usage/EXAMPLES_LIBRARY.md)
* **API Docs** → [`INDEX.md`](./api/INDEX.md)


# --- end: docs/WHY_NOT_SETINTERVAL.md ---



# --- begin: LICENSE.md ---

Moderate Team Source-Available License (MTL-10)

Version 1.0 – May 2025Copyright (c) 2025 m7.org

1. Purpose

This license allows use of the software for both non-commercial and limited commercial purposes by small to moderate-sized teams. It preserves freedom for individuals and small businesses, while reserving large-scale commercial rights to the Licensor.

2. Grant of Use

You are granted a non-exclusive, worldwide, royalty-free license to use, modify, and redistribute the Software, subject to the following terms:

You may use the Software for any purpose, including commercial purposes, only if your organization or team consists of no more than 10 total users of the Software.

A “user” is defined as any person who develops with, maintains, integrates, deploys, or operates the Software.

You may modify and redistribute the Software under the same terms, but must retain this license in all distributed copies.

3. Restrictions

If your organization exceeds 10 users of the Software, you must obtain a commercial license from the Licensor.

You may not offer the Software as a hosted service, software-as-a-service (SaaS), or part of a commercial product intended for resale or third-party consumption, regardless of team size.

You may not sublicense, relicense, or alter the terms of this license.

4. Attribution and Notices

You must include this license text and a copyright notice in all copies or substantial portions of the Software.

You must clearly indicate any modifications made to the original Software.

5. No Warranty

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY.

6. Contact for Commercial Licensing

If your use case exceeds the permitted team size, or involves resale, SaaS, hosting, or enterprise deployment:

📧 Contact: legal@m7.org

Commercial licensing is available and encouraged for qualified use cases.

# --- end: LICENSE.md ---



# --- begin: README.md ---

# Interval Manager

> A **policy-driven async scheduler** for environments where `setInterval` is not safe.

This project exists because **`setInterval` breaks down the moment real-world constraints appear**: async work, overlapping executions, background tabs, offline states, and error handling.

This is **not** a drop-in timer wrapper. It is a systems-level primitive designed to make recurring async work *correct by default*.

---

## Why this exists

If you have ever:

* Had async interval callbacks overlap and corrupt state
* Watched intervals silently die after an exception
* Needed to pause background work when a tab is hidden
* Wanted cancellation *with a reason*, not just a boolean
* Needed backpressure instead of runaway execution

Then you have already discovered the limits of `setInterval`.

This library solves those problems explicitly.

---

## What this library guarantees

* Interval callbacks **never overlap** unless explicitly allowed
* Errors are handled deterministically via **error policies**
* Cancellation always occurs **with a reason**
* Environment changes (hidden / offline / suspended) are enforced consistently
* Internal failures never crash the scheduler
* Observability hooks never interfere with execution

These guarantees are enforced by design, not convention.

---

## Quick example (safe by default)

```js
import { IntervalManager } from 'interval-manager';

const manager = new IntervalManager();

manager.register({
  name: 'health-check',
  everyMs: 1000,
  fn: async () => {
    await fetch('/health');
  }
});
```

**By default this interval:**

* Will never overlap executions
* Will pause when the environment is hidden
* Will not silently die on error
* Can be cancelled with an explicit reason

No extra configuration required.

---

## Core concepts

### IntervalManager

A registry and policy engine responsible for:

* Interval lifecycle management
* Environment enforcement
* Centralized cancellation
* Observability hooks

Think of it as the **control plane**.

### ManagedInterval

A single scheduled task with:

* Overlap policy (`skip`, `coalesce`, `queue`)
* Error policy (`continue`, `pause`, `cancel`, `backoff`)
* Explicit lifecycle state
* Deterministic execution semantics

Think of it as the **execution plane**.

---

## Policies, not flags

This library is intentionally **policy-driven**.

Instead of ad-hoc booleans, you declare intent:

```js
manager.register({
  name: 'sync',
  everyMs: 2000,
  overlap: 'queue',
  maxQueue: 5,
  onError: 'backoff',
  fn: async () => {
    await syncData();
  }
});
```

Policies compose cleanly and behave predictably.

---

## Environment-aware by design

The manager can respond to environment signals such as:

* visibility changes
* offline state
* explicit suspension

```js
manager.updateEnvironment({ visible: false });
```

Intervals are paused and resumed **deterministically**, without losing state or corrupting execution order.

---

## Observability without interference

All lifecycle events emit structured telemetry:

```js
const manager = new IntervalManager({
  onEvent(event) {
    console.log(event.type, event.reason);
  }
});
```

Telemetry errors are swallowed by design. Observability can never destabilize execution.

---

## Features

* Centralized registry for named intervals
* Per-interval policies: overlap (`skip` / `coalesce` / `queue`), error handling (`continue` / `pause` / `cancel` / `backoff`)
* Deterministic lifecycle: start, pause, resume, cancel, dispose
* Environment-aware execution (visibility, offline, suspension)
* Manual triggering (`runNow`) and single-step execution (`step`)
* Mutable per-interval workspace
* Queue limits and backpressure
* Optional custom clock injection (testing / simulation)
* Structured lifecycle telemetry
* Optional auto-removal of completed or cancelled intervals

---

## What this library does *not* do

This project is intentionally scoped.

It does **not**:

* Act as a cron scheduler
* Persist tasks across reloads
* Coordinate across processes or machines
* Attempt to replace job queues or workflow engines

It solves one problem well: **correct recurring async execution in hostile environments**.

---

## Installation

This package is **not yet available via npm or yarn**.

### Recommended (auto.js)

If you are already using **m7-lib**, the simplest setup is:

```html
<script src="/path/to/m7-lib.min.js"></script>
<script type="module" src="/path/to/interval/auto.js"></script>
```

This installs:

```js
lib.interval.manager   // IntervalManager factory
```

### Manual / Module usage

```js
import { IntervalManager } from './lib/interval/IntervalManager.js';
```

> `m7-lib` (v0.98+) is required **only** when using `auto.js`.

---

## Documentation

Start here if you want to understand *how the system behaves*, not just how to call it.

* **Quick Start** → [`docs/usage/QUICKSTART.md`](docs/usage/QUICKSTART.md)
* **Why not setInterval?** → [`docs/WHY_NOT_SETINTERVAL.md`](docs/WHY_NOT_SETINTERVAL.md)
* **Examples Library** → [`docs/usage/EXAMPLES_LIBRARY.md`](docs/usage/EXAMPLES_LIBRARY.md)
* **Installation Details** → [`docs/usage/INSTALLATION.md`](docs/usage/INSTALLATION.md)
* **API Documentation** → [`docs/api/INDEX.md`](docs/api/INDEX.md)

  * **Interval API Contract** → [`docs/api/INTERVAL_API_CONTRACT.md`](docs/api/INTERVAL_API_CONTRACT.md)
  * **IntervalManager API** → [`docs/api/INTERVAL_MANAGER.md`](docs/api/INTERVAL_MANAGER.md)
  * **ManagedInterval API** → [`docs/api/MANAGED_INTERVAL.md`](docs/api/MANAGED_INTERVAL.md)
  * **auto.js integration** → [`docs/api/AUTO.md`](docs/api/AUTO.md)

---

## Portfolio note

This project is designed as a **systems-level scheduling primitive**, not a convenience utility.

It demonstrates:

* Explicit state-machine design
* Policy-driven execution control
* Defensive async programming
* Deterministic lifecycle management
* Clear separation of control and execution planes

The code prioritizes **correctness, clarity, and long-term maintainability** over cleverness.

## License

See [`LICENSE.md`](LICENSE.md) for full terms.

* Free for personal, non-commercial use
* Commercial licensing available under the **M7 Moderate Team License (MTL-10)**

---

## Integration & Support

If you’re interested in commercial usage, integration assistance, or support contracts, contact:

* 📩 [legal@m7.org](mailto:legal@m7.org)

---

## AI Usage Disclosure

See:

* [`docs/AI_DISCLOSURE.md`](docs/AI_DISCLOSURE.md)
* [`docs/USE_POLICY.md`](docs/USE_POLICY.md)

for permitted use of AI in derivative tools or automation layers.

---

## Philosophy

> “Initialize only what you mean to use.”
> Avoid premature assumptions and maintain precise control over application lifecycle stages.

---

## Feedback / Security

* General inquiries: [legal@m7.org](mailto:legal@m7.org)
* Security issues:   [security@m7.org](mailto:security@m7.org)


# --- end: README.md ---



# --- begin: wishlist.md ---


Interval Management Suite — Wishlist & Future Work

This document tracks non-blocking improvements, enhancements, and follow-ups for the interval management system.
None of the items below are required for correctness or current production use.

⸻

1. Documentation & Developer Experience

1.1 API Documentation
	•	Full JSDoc coverage for:
	•	ManagedInterval
	•	IntervalManager
	•	Explicit documentation of:
	•	Lifecycle states (running, paused, cancelled)
	•	Environment gating (visible, online, suspended)
	•	Overlap policies (skip, coalesce, queue)
	•	Queue semantics and limits
	•	Constructor / destructor behavior

1.2 Behavioral Guides
	•	“How it actually behaves” docs (not just signatures):
	•	start() vs resume()
	•	runNow() vs step()
	•	pause() vs environment-induced pause
	•	Examples for:
	•	Game loop usage
	•	Background worker usage
	•	Debug / step-through usage

⸻

2. Telemetry & Observability

2.1 Queue Telemetry
	•	Emit events for:
	•	Queue overflow (queueOverflow)
	•	Dropped queue items
	•	Queue drain start / completion
	•	Optional per-interval counters:
	•	Total enqueued
	•	Total dropped
	•	Max queue depth reached

2.2 Gating Telemetry
	•	Emit warnings/events when:
	•	runNow() is blocked by environment gating
	•	step() is blocked by inflight execution
	•	Interval is “runnable” but blocked by policy

⸻

3. Policy Presets

Introduce optional presets to reduce configuration burden:
	•	Game Loop Preset
	•	overlapPolicy: 'queue'
	•	queueErrorPolicy: 'preserve'
	•	pauseWhenHidden: true
	•	pauseWhenOffline: true
	•	Emphasis on determinism and debuggability
	•	Background Worker Preset
	•	overlapPolicy: 'coalesce'
	•	queueErrorPolicy: 'clear'
	•	pauseWhenHidden: false
	•	Emphasis on throughput
	•	Cron / Task Preset
	•	overlapPolicy: 'skip'
	•	errorPolicy: 'backoff'
	•	Emphasis on non-overlap and resilience

⸻

4. Queue Enhancements (Optional)

4.1 Payload-Carrying Queue
	•	Allow queued executions to carry:
	•	Payloads
	•	Signals
	•	Context overrides
	•	Enables:
	•	Deterministic replay
	•	Step-through of queued work
	•	Event-driven workloads

4.2 Advanced Queue Drain Policies
	•	Drain strategies:
	•	FIFO (current)
	•	LIFO
	•	Priority-based
	•	Partial drain on resume / step

⸻

5. Semantics & Naming Polish

5.1 isRunnable() Semantics
	•	Clarify or rename:
	•	Distinguish between “can run now” vs “eligible to run”
	•	Possible alternatives:
	•	canExecuteNow
	•	isEligible
	•	isBlocked

5.2 Comment & JSDoc Alignment
	•	Bring comments in sync with current behavior:
	•	step() (always pauses after execution)
	•	Queue behavior notes
	•	Overlap policy descriptions

⸻

6. Testing

6.1 Unit Tests
	•	Coverage for:
	•	Queue + error interactions
	•	Step + queue interactions
	•	Environment gating edge cases
	•	Constructor / destructor error policies

6.2 Deterministic Test Clock
	•	First-class test clock helper:
	•	Manual tick advancement
	•	Deterministic scheduling assertions

⸻

7. Tooling & Debugging Aids
	•	Optional debug mode:
	•	Verbose lifecycle logging
	•	State transition tracing
	•	Snapshot / inspect helpers:
	•	Queue depth
	•	Inflight state
	•	Pending / backoff state

⸻

8. Non-Goals (Explicit)

The following are explicitly out of scope unless requirements change:
	•	Distributed scheduling
	•	Cross-process coordination
	•	Persistent queues
	•	Job durability guarantees

⸻

Status

All items in this document are wishlist / future enhancements.
They should not block shipping, testing, or adoption of the current system.



# --- end: wishlist.md ---

