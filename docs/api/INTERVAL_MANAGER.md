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
