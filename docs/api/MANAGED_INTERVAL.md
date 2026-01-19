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
