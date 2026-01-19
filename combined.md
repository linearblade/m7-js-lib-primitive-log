

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

`auto.js` is an **optional** convenience layer that registers the log primitive into the **m7-lib** global (`window.lib`).

After loading `auto.js`, you can construct a Manager via a short, ergonomic path:

```js
const log = new lib.primitive.log.Manager();
```

If you do **not** include `auto.js`, you can still use the library normally via module imports:

```js
import { Manager } from './log/index.js';

const log = new Manager();
```

---

## What `auto.js` does

When loaded, `auto.js`:

1. Ensures the `lib.primitive.log` namespace exists on `window.lib`
2. Exposes public constructors under that namespace

Typically:

* `lib.primitive.log.Manager`
* `lib.primitive.log.Worker`

The intent is:

* **Zero-config convenience** for browser usage
* A consistent discovery surface under `lib.primitive.log.*`

`auto.js` does **not** change runtime behavior of capture.

It is registration only.

---

## Requirements

* `m7-lib` must be loaded first
* `auto.js` must be loaded **after** `m7-lib`
* `auto.js` should be loaded as a **module**

Recommended script order:

```html
<!-- Load m7-lib (module or classic build) -->
<script src="/lib/m7-lib.min.js"></script>

<!-- Then load auto.js as a module -->
<script type="module" src="/lib/log/auto.js"></script>
```

---

## Usage

### Basic

```js
const log = new lib.primitive.log.Manager();

log.createBucket('app');
log.log('app', 'started');
```

### Direct Worker usage

If you only need one bucket, you can create a Worker directly:

```js
const worker = new lib.primitive.log.Worker({
  console: 'warn'
});

worker.warn('something happened');
```

---

## Troubleshooting

| Symptom                                   | Likely Cause                              | Fix                                              |
| ----------------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| `lib is undefined`                        | `m7-lib` not loaded (or loaded too late)  | Load `m7-lib` first                              |
| `lib.primitive` is undefined              | `auto.js` not loaded, or load order wrong | Ensure `auto.js` loads after `m7-lib`            |
| `Manager is not a constructor`            | Wrong path / export name                  | Verify you are using `lib.primitive.log.Manager` |
| Nothing appears under `lib.primitive.log` | `auto.js` not executed as module          | Use `<script type="module">`                     |

---

## Notes

* `auto.js` should remain dependency-light.
* In module/bundler environments, you typically do **not** need `auto.js`.
* `auto.js` does not introduce any async behavior.

---

## Related Docs

* **Installation** → [../usage/INSTALLATION.md](../usage/INSTALLATION.md)
* **Quick Start** → [../usage/QUICKSTART.md](../usage/QUICKSTART.md)
* **Manager API** → [MANAGER.md](./MANAGER.md)
* **Worker API** → [WORKER.md](./WORKER.md)


# --- end: docs/api/AUTO.md ---



# --- begin: docs/api/EVENT_HANDLERS.md ---

# Event Handlers

Workers support two optional user-defined handlers:

* `onEvent` — called when a record is accepted
* `onPrint` — called when the Worker decides to print a record

Both handlers are:

* invoked **synchronously**
* **best-effort** (errors are swallowed)
* never awaited

If you want async behavior, enqueue work and return.

---

## `onEvent(record, worker, workspace)`

### When it runs

`onEvent` runs after a record is:

1. accepted (Worker enabled)
2. created (header/body)
3. stored in the Worker’s internal storage

### Signature

```js
function onEvent(record, worker, workspace) {
  // ...
}
```

### Parameters

* `record`

  * The record that was just stored
  * Shape: `{ header, body }`

* `worker`

  * The Worker instance that accepted the record
  * Use this for introspection or policy checks (sparingly)

* `workspace`

  * The Worker’s workspace object
  * Intended for shared state (counters, session data, preallocated objects)

### Typical uses

Keep this lightweight:

* increment counters
* push into a queue
* signal a pipeline

Example: enqueue for async export

```js
const outbox = [];

const worker = new Worker({
  onEvent(record) {
    outbox.push(record);
  }
});
```

---

## `onPrint(record, ctx, workspace)`

### When it runs

`onPrint` runs only when:

* printing is enabled by policy, and
* the record qualifies for printing, and
* the call did not suppress printing (`opts.print === false`)

### Signature

```js
function onPrint(record, ctx, workspace) {
  // ...
}
```

### Parameters

* `record`

  * The record being printed

* `ctx`

  * Print-context object provided by the Worker
  * Used to describe the printing decision and support advanced printers

  Typical fields:

  * `levelNum` — normalized console level number
  * `policy` — normalized console policy
  * `CONSOLE_LEVEL` — enum reference

  (Treat `ctx` as informational; do not rely on extra fields unless documented.)

* `workspace`

  * The Worker’s workspace object

### Typical uses

* formatting
* prefixing with tags
* routing to `console.*` methods
* custom grouping

Example: custom printer with grouping

```js
const worker = new Worker({
  console: 'debug',
  onPrint(record) {
    const { header, body } = record;

    console.groupCollapsed(`[${header.source}] ${header.level} @ ${header.at}`);
    console.log(body);
    console.groupEnd();
  }
});
```

---

## Workspace

Workspace is an arbitrary value passed into `onEvent` and `onPrint`.

Use it to:

* hold counters/state
* avoid allocations (reuse objects)
* attach session/user metadata

Example: counter state

```js
const worker = new Worker({
  workspace: { drops: 0 },
  onEvent(record, w, ws) {
    if (record.header.level === 'debug') {
      ws.drops += 1;
    }
  }
});
```

### Workspace rules (practical)

* Workspace should be treated as **mutable state you own**.
* Keep it small and stable.
* Do not store large record histories in workspace (that defeats the storage policy).

---

## Safety and performance rules

Because handlers are synchronous:

* **Never** block (no heavy loops, no deep clones)
* **Never** await
* Treat handlers as a signal point, not a pipeline

If you need async work:

* push into a queue
* schedule work outside the hook

See **Advanced Examples** for patterns (batching, dropping, burst control).

---

## Error behavior

Handler failures are swallowed.

This means:

* A broken handler will not take down capture
* You must test handlers if you rely on them
* You should add your own internal try/catch if you want fallback behavior

Example: internal fallback

```js
const worker = new Worker({
  onEvent(record) {
    try {
      ship(record);
    } catch (err) {
      // your fallback, your policy
    }
  }
});
```

---

## Related Docs

* **Worker API** → [WORKER.md](./WORKER.md)
* **Record Structure** → [RECORD.md](./RECORD.md)
* **Advanced Examples** → [../usage/ADVANCED_EXAMPLES.md](../usage/ADVANCED_EXAMPLES.md)


# --- end: docs/api/EVENT_HANDLERS.md ---



# --- begin: docs/api/INDEX.md ---

# API Index — m7-js-lib-primitive-log

This directory contains the **spec-style API references** for the log primitive.

If you’re new to the project, start with:

- **Docs TOC** → [../usage/TOC.md](../usage/TOC.md)
- **Quick Start** → [../usage/QUICKSTART.md](../usage/QUICKSTART.md)
- **README** → [../../README.md](../../README.md)

> There is intentionally **no default bucket**. If you only need one stream, instantiate a **Worker** directly.

---

## Core APIs

- **Manager** → [MANAGER.md](./MANAGER.md)  
  Multi-bucket coordinator / routing layer (owns Workers, applies defaults, forwards `log/info/warn/error`).

- **Worker** → [WORKER.md](./WORKER.md)  
  Single log stream (“bucket”) with storage policy, enable gate, optional hooks, and console policy.

- **Record Structure** → [RECORD.md](./RECORD.md)  
  The strict `{ header, body }` record shape, timing metadata, and invariants.

---

## Hooks and Printing

- **Event Handlers** → [EVENT_HANDLERS.md](./EVENT_HANDLERS.md)  
  Defines `onEvent` and `onPrint` semantics (sync, best-effort, never awaited).

---

## Integration

- **auto.js** → [AUTO.md](./AUTO.md)  
  Optional browser convenience that registers `lib.primitive.log` into `window.lib` (m7-lib).

---

## Contracts

- **Log Primitive API Contract (LLM/tooling-safe)** → [LOG_API_CONTRACT.md](./LOG_API_CONTRACT.md)  
  Source-independent behavioral guarantees intended for tooling, integration layers, and LLM guidance.

---

## Related Usage Docs

- **Installation** → [../usage/INSTALLATION.md](../usage/INSTALLATION.md)
- **Examples Library** → [../usage/EXAMPLES_LIBRARY.md](../usage/EXAMPLES_LIBRARY.md)
- **Advanced Examples** → [../usage/ADVANCED_EXAMPLES.md](../usage/ADVANCED_EXAMPLES.md)
- **Performance Notes** → [../usage/PERFORMANCE.md](../usage/PERFORMANCE.md)

---

## Navigation

- **Up one level (docs/)** → [../usage/TOC.md](../usage/TOC.md)
- **Project root README** → [../../README.md](../../README.md)


# --- end: docs/api/INDEX.md ---



# --- begin: docs/api/LOG_API_CONTRACT.md ---

# Log Primitive API Contract (m7-js-lib-primitive-log)

> **You may paste this file directly into another project so that an LLM knows how to correctly use the software.**
> This document defines the *public API contract only*. It intentionally omits implementation details and source code.
>
> Anything not explicitly specified here must be treated as **undefined behavior**.

---

## Scope

This contract defines the **public, stable interface** for **m7-js-lib-primitive-log**, including:

* `Manager` (bucket registry + routing layer)
* `Worker` (single-bucket log stream + storage/policy container)
* `Record` shape (strict `{ header, body }`)
* `auto.js` integration (optional m7-lib registration layer)

The goal is to allow correct integration and reasoning **without reading source code**.

---

## Core Concepts

### Buckets

A **bucket** is a named log stream.
* A `Manager` owns many buckets (Workers).
* A `Worker` owns exactly one bucket.

There is intentionally **no default bucket**. If you only want one bucket, instantiate a `Worker` directly. 

### Records

Workers store records in a strict `{ header, body }` shape:

* `header` is system-owned metadata
* `body` is user-owned payload (opaque)

The Worker generates these header fields:

* `at` — timestamp of this record
* `source` — Worker name
* `level` — severity (`log`, `info`, `warn`, `error`, …)
* `lastAt` — previous timestamp for this Worker (when available)
* `delta` — `at - lastAt` (when available)

Optional header fields when provided to `emit()`:

* `event`
* `trace` 

### Storage policy

A Worker stores records in-memory:

* `max === 0` → unlimited storage (append-only)
* `max > 0` → ring buffer that retains the most recent `max` records 

### Enable gates

* `Manager.enabled` is a **global forwarding gate**: when false, `manager.log/info/warn/error` return `null` and do not forward. It does **not** mutate existing Workers. 
* `Worker.enabled` is a **bucket gate**: when false, `emit()` returns `null`, no records are stored, no hooks run, nothing prints. 

### Console policy

Console output is **policy-controlled** and **best-effort**:

* Per-call printing can be suppressed with `opts.print === false`.
* Per-call console policy override: `opts.console`.
* Otherwise uses the Worker’s `console` policy.
* Printing eligibility is decided by `utils.shouldPrint(record, { console: policy })`.
* Printer errors are swallowed. 

### Hooks (best-effort)

Workers support optional user-defined handlers:

* `onEvent(record, worker, workspace)` — called after acceptance + storage
* `onPrint(record, ctx, workspace)` — called when a record is printed

Both are:
* synchronous
* best-effort (errors swallowed)
* never awaited 

---

## Module Exports

### Standard usage

In module/manual environments, `Manager` and `Worker` are the primary public constructors (exact export wiring depends on your entry module).

### auto.js integration exports

When using `auto.js` in a browser with **m7-lib**, it registers an object at:

* `lib.primitive.log` containing:
  * `Manager`
  * `Worker`
  * `utils`
  * `constants` 

---

## auto.js Integration Contract

### Purpose

When loaded in a browser environment with **m7-lib**, `auto.js` registers the primitive into `window.lib` at `lib.primitive.log`. 

### Preconditions

* Browser environment (has `window`)
* `window.lib` must exist
* `lib.hash.set` must be available 

### Failure behavior

If any precondition is missing, `auto.js` throws an Error at load time. 

### Non-goals

`auto.js` performs registration only; it does **not** change runtime behavior of capture. 

---

# Manager API

## Construction

### `new Manager(opts?)`

#### Options

* `name: string` (default `'log'`) — informational name
* `enabled: boolean` (default `true`) — Manager-level forwarding gate
* `throwOnError: boolean` (default `false`) — special `error()` behavior (see below)
* `worker: object` (default `{}`) — default Worker env config applied to **new** buckets only
* `buckets: object | null` — eager bucket map `bucketName -> Worker options` 

---

## Manager enable gate

### `manager.setEnabled(on = true)`
### `manager.enable()` / `manager.disable()`
### `manager.isEnabled() -> boolean` 

Guarantees:

* Disabling the Manager prevents forwarding to Workers.
* It does not mutate existing Workers or their defaults. 

---

## Worker defaults

### `manager.setWorkerConfig(cfg = {}) -> object`

Defines or updates the default Worker environment configuration used when creating new buckets.

* Does not affect already-created buckets. 

Supported keys (Worker environment defaults):

* `enabled`, `max`, `console`, `onEvent`, `clock`, `workspace`, `clone`, `onPrint` 

---

## Bucket management

Bucket name rules:

* Must be a non-empty string
* Finite numbers are accepted and coerced to strings (`0` → `'0'`)
* Other values are invalid 

### `manager.createBucket(name, opts?) -> Worker`

Creates (or replaces) a bucket.

Notes:

* Per-bucket `opts` override Manager Worker defaults.
* If a bucket already exists, it is replaced in the registry (no teardown is performed). 

### `manager.bucket(name) -> Worker | null`

Soft lookup (does not create missing buckets).

* Returns `null` if name is invalid or bucket missing. 

### `manager.ensureBucket(name, opts?) -> Worker`

Get-or-create lookup. 

### `manager.configureBucket(name, patch?) -> Worker | null`

Configures a bucket at runtime (creates the bucket if missing).

Notes:

* If bucket exists, patch is applied via `Worker.configure(patch)`.
* Some keys are creation-only (notably `clone`) and are ignored for existing buckets.
* If bucket is missing, `workspace` and `clone` are applied at creation time if present. 

### `manager.to(bucketName) -> Worker | null`

Alias of `manager.bucket(bucketName)`. 

---

## Logging API

All logging methods are **soft** operations:

* If `manager.enabled === false` ⇒ returns `null`
* If the bucket is missing/invalid ⇒ returns `null`
* Otherwise forwards to the Worker and returns the stored record 

### `manager.log(bucketName, data, opts?)`
### `manager.info(bucketName, data, opts?)`
### `manager.warn(bucketName, data, opts?)`
### `manager.error(bucketName, data, opts?)` 

#### `throwOnError` behavior (`manager.error`)

When `throwOnError === true`, `error()` throws after handling.

* If bucket missing/invalid: prints payload via `console.error` then throws.
* If bucket exists: records via Worker, suppresses Worker printing (avoid double-print), prints once via `console.error`, then throws an Error that includes:
  * `err.bucket`
  * `err.record` 

---

## Reading / clearing

### `manager.get(bucketName, filter = {}) -> Object[]`

* Validates bucketName (throws if invalid).
* If bucket missing, returns `[]`.
* Filter forwarded to `Worker.get(filter)`. 

### `manager.clear(bucketName?) -> void`

* If `bucketName` is null/undefined: clears all buckets.
* Otherwise clears only the named bucket (no-op if missing).
* Validates bucketName when provided (throws if invalid). 

### `manager.list() -> Array<Object>`

Returns an array of `Worker.stats()` snapshots. 

---

# Worker API

## Construction

### `new Worker(opts?)`

Options (selected highlights):

* `name: string` (default `'default'`) — stored as `record.header.source`
* `max: number|string|false|null|undefined` (default `0` unlimited; invalid values throw)
* `enabled: boolean` (default `true`)
* `console: number|string|boolean|null|undefined` — console policy
* `onEvent`, `onPrint` — best-effort hooks
* `clock` — time source (invalid values throw)
* `clone: boolean` (default `false`) — default per-record cloning policy
* `workspace: any` — opaque user workspace, passed into hooks/printers 

---

## Policy methods

### `worker.configure(patch = {}) -> void`

Patch keys:

* `enabled`, `max`, `console`, `onEvent`, `onPrint`, `clock`, `workspace`

Throws if patch is not an object, or if patched values are invalid. 

### `worker.setEnabled(on = true) -> void`

When disabled, `emit()` and storage drop records and return null. 

### `worker.setLogMax(value) -> void`

* `0`/falsy/`"0"` => unlimited
* positive integer => ring buffer size
* invalid values => throws
* truncates immediately if reducing below current size 

### `worker.truncate() -> void`

Enforces `max` against current storage.

* no-op when `max === 0`
* keeps most recent `max` when ring mode 

### `worker.setConsoleLevel(value) -> void`

Sets the console emission policy (normalized internally). 

---

## Emitting records

### `worker.emit(data, opts?) -> Object | null`

Behavior:

* If disabled → returns `null`
* Normalizes payload into `record.body`
* Builds a `{ header, body }` record with timing metadata
* Optionally clones body best-effort (per call or Worker default)
* Stores record (unlimited or ring)
* Fires `onEvent` best-effort
* Optionally prints best-effort 

`emit()` options:

* `level: string` (default `'log'`) → `record.header.level`
* `event: string` (optional) → `record.header.event`
* `trace: any` (optional) → `record.header.trace`
* `clone: boolean` (default Worker policy) → cloning override
* `print: boolean` (default `true`) → suppress printing if false
* `console: any` (default Worker policy) → console policy override 

### Convenience level wrappers

Thin wrappers around `emit()`:

* `worker.log(data, opts?)` → `level: 'log'`
* `worker.info(data, opts?)` → `level: 'info'`
* `worker.warn(data, opts?)` → `level: 'warn'`
* `worker.error(data, opts?)` → `level: 'error'` 

---

## Reading records

### `worker.get(filter?) -> Object[]`

Guarantees:

* Returned records are in chronological order (oldest → newest), regardless of internal storage mode. 

Special filters:

* `since: number (epoch ms)` → filters out records with `record.header.at < since`
* `limit: non-negative integer` → returns most recent `limit` after filtering
  * `limit: 0` returns `[]`
  * invalid `limit` throws 

Key routing rules:

* `"header.foo"` targets `record.header["foo"]` (literal key; no path traversal)
* `"body.bar"` targets `record.body["bar"]` (literal key; no path traversal)
* Bare keys:
  * known header fields (`at`, `source`, `level`, `event`, `trace`) target header
  * everything else targets body 

Value matching:

* Scalars use strict equality (`===`)
* Functions treated as predicates `(value, record) => boolean`
  * predicate errors swallowed and treated as non-match 

---

## Clearing records

### `worker.clear() -> void`

Clears stored records and resets internal storage counters, but `_lastAt` is intentionally preserved for timing continuity / async workflows. 

---

## Introspection

### `worker.stats() -> object`

Returns:

```js
{
  name: string,
  enabled: boolean,
  max: number,
  size: number,   // retained
  count: number,  // accepted since last clear
  ring: boolean   // max > 0
}


# --- end: docs/api/LOG_API_CONTRACT.md ---



# --- begin: docs/api/MANAGER.md ---

# Manager API

The **Manager** is a coordinator and routing layer.

* Owns the bucket registry (Workers)
* Applies default Worker configuration for newly created buckets
* Provides ergonomic logging entrypoints (`log/info/warn/error`)

A Manager **does not store records itself** — Workers do.

---

## Constructor

### `new Manager(opts?)`

```js
import Manager from './Manager.js';

const log = new Manager({
  name: 'log',
  enabled: true,
  throwOnError: false,
  worker: {
    // default Worker environment for new buckets
    enabled: true,
    max: 0,
    console: 'off',
    clone: false,
  },
  buckets: {
    app: {},
    errors: { console: 'error' },
  }
});
```

### Manager options

| Option         | Type    | Default | Description                                                                                        |
| -------------- | ------- | ------- | -------------------------------------------------------------------------------------------------- |
| `name`         | string  | `'log'` | Informational name for this Manager instance.                                                      |
| `enabled`      | boolean | `true`  | Manager-level forwarding gate. If `false`, `log/info/warn/error` return `null` and do not forward. |
| `throwOnError` | boolean | `false` | If `true`, `manager.error(...)` throws after handling (see **error()**).                           |
| `worker`       | object  | `{}`    | Default Worker environment configuration applied to **new** buckets only.                          |
| `buckets`      | object  | `null`  | Map of `bucketName -> Worker options` used to eagerly create buckets at construction.              |

---

## Manager enable gate

The Manager has a single global gate: `enabled`.

* Disabling the Manager prevents forwarding to Workers.
* It does **not** mutate existing Workers.
* It does **not** change Worker defaults.

### `manager.setEnabled(on = true)`

```js
manager.setEnabled(false);
```

### `manager.enable()` / `manager.disable()`

```js
manager.disable();
manager.enable();
```

### `manager.isEnabled()`

```js
manager.isEnabled() // -> boolean
```

---

## Worker defaults

### `manager.setWorkerConfig(cfg = {})`

Defines or updates the default Worker environment configuration used when creating new buckets.

**Important:** This does not affect already-created buckets.

```js
manager.setWorkerConfig({
  max: 500,            // default storage cap for new buckets
  console: 'off',
  onEvent: null,
  clone: false,
});
```

Supported keys (Worker environment defaults):

| Key         | Type                      | Notes                                                       |
| ----------- | ------------------------- | ----------------------------------------------------------- |
| `enabled`   | boolean                   | Default enabled state for newly created Workers.            |
| `max`       | number | string           | Default storage limit (0 typically means unlimited).        |
| `console`   | number | string | boolean | Console policy (normalized internally).                     |
| `onEvent`   | function | any            | Default per-record hook for Workers (best-effort resolved). |
| `clock`     | function | object | any   | Default clock source for Workers (best-effort resolved).    |
| `workspace` | any                       | Passed through to Workers as-is.                            |
| `clone`     | boolean                   | Only `true` enables cloning.                                |
| `onPrint`   | function | any            | Default printer (best-effort resolved).                     |

Returns the normalized cached config object.

---

## Bucket management

Bucket names:

* Must be a non-empty string
* Finite numbers are accepted and coerced to strings (`0` → `'0'`)
* Other values are invalid

### `manager.createBucket(name, opts?)`

Creates (or replaces) a bucket.

```js
const errors = manager.createBucket('errors', {
  console: 'error',
  max: 500,
});
```

Notes:

* Per-bucket `opts` override Manager Worker defaults.
* If a bucket already exists, it is replaced in the registry (no teardown is performed).

### `manager.bucket(name)`

Soft lookup (does not create missing buckets).

```js
manager.bucket('errors') // -> Worker | null
```

Behavior:

* Returns `null` if the bucket name is invalid
* Returns `null` if the bucket does not exist

### `manager.ensureBucket(name, opts?)`

Get-or-create lookup.

```js
const w = manager.ensureBucket('net', { max: 200 });
```

### `manager.configureBucket(name, patch?)`

Configures a bucket at runtime (creates the bucket if missing).

```js
manager.configureBucket('debug', {
  console: 'debug',
  enabled: true,
});
```

Notes:

* If the bucket exists, the patch is applied via `Worker.configure(patch)`.
* Some keys are **creation-only** (notably `clone`) and are ignored for existing buckets.
* If the bucket is missing, `workspace` and `clone` are applied at creation time if present.

### `manager.to(bucketName)`

Alias for `manager.bucket(bucketName)`.

---

## Logging API

All logging methods are **soft** operations:

* If `manager.enabled === false` ⇒ returns `null`
* If the bucket is missing/invalid ⇒ returns `null`
* Otherwise forwards to the Worker and returns the stored record

### `manager.log(bucketName, data, opts?)`

```js
manager.log('app', 'hello');
manager.log('app', { msg: 'hello' }, { print: false });
```

### `manager.info(bucketName, data, opts?)`

```js
manager.info('app', 'started');
```

### `manager.warn(bucketName, data, opts?)`

```js
manager.warn('app', 'slow frame');
```

### `manager.error(bucketName, data, opts?)`

`error()` is special when `throwOnError === true`:

* If the bucket is missing/invalid:

  * prints the payload via `console.error`
  * throws an Error
* If the bucket exists:

  * records the error via Worker
  * suppresses Worker-side printing (to avoid double-print)
  * prints once via `console.error`
  * throws an Error

```js
// common: capture without throwing
manager.error('errors', new Error('boom'));

// strict mode: capture + throw
const strict = new Manager({ throwOnError: true });
strict.createBucket('errors');
strict.error('errors', new Error('boom')); // throws
```

---

## Reading & clearing

### `manager.get(bucketName, filter = {})`

Strict lookup + read.

* Validates `bucketName` (throws if invalid)
* Returns `[]` if bucket does not exist
* Forwards `filter` to `Worker.get(filter)`

```js
const records = manager.get('errors');
```

### `manager.clear(bucketName?)`

Clears stored records.

* If `bucketName` is `null`/`undefined`: clears all buckets
* Otherwise clears only the named bucket

```js
manager.clear('errors');
manager.clear(); // all buckets
```

### `manager.list()`

Returns an array of `Worker.stats()` snapshots.

```js
manager.list();
```

---

## Related Docs

* **Worker API** → [WORKER.md](./WORKER.md)
* **Record Structure** → [RECORD.md](./RECORD.md)
* **Usage** → [../usage/TOC.md](../usage/TOC.md)


# --- end: docs/api/MANAGER.md ---



# --- begin: docs/api/RECORD.md ---

# Record Structure

Every accepted log event is stored as a **Record** with a strict, portable shape:

```js
{
  header: { /* system metadata */ },
  body:   /* user payload */
}
```

This split is intentional:

* `header` is owned by the logging system
* `body` is owned by the caller

---

## 1) Header

The header contains system metadata used for inspection, filtering, timing, and routing.

### Common header fields

| Field    | Type               | Description                                                            |
| -------- | ------------------ | ---------------------------------------------------------------------- |
| `at`     | number             | Timestamp (epoch ms) when the record was captured.                     |
| `lastAt` | number | undefined | Timestamp of the previous accepted record in the same Worker (if any). |
| `delta`  | number | undefined | Time delta: `at - lastAt` (if `lastAt` exists).                        |
| `source` | string             | Worker/bucket name (log stream identifier).                            |
| `level`  | string             | Logical severity level (`log`, `info`, `warn`, `error`, etc.).         |

### Optional header fields

These appear only when provided (or when the implementation chooses to attach them).

| Field   | Type   | Description                                    |
| ------- | ------ | ---------------------------------------------- |
| `event` | string | Optional event label (call-site-defined).      |
| `trace` | any    | Optional trace context or correlation payload. |

> The library treats `event` and `trace` as opaque. The caller defines meaning.

---

## 2) Body

The body is your payload.

It may be:

* a string
* an object
* an Error
* any value
* If you pass a plain object, it becomes body.
* Otherwise body becomes { value: <your input> }.

### Reference semantics (default)

By default, `body` is stored **by reference**.

That is intentional for performance.

If you mutate an object after logging it, the stored record will reflect that mutation.

### Cloning (opt-in)

Cloning is available but is:

* opt-in
* best-effort
* more expensive

You can enable cloning:

* per Worker (default policy)
* per call (override)

If cloning fails, the original reference may be stored.

---

## 3) Timing semantics

Timing metadata is computed per Worker stream.

* `header.at` is captured at emission
* `header.lastAt` refers to the previous accepted record in that Worker
* `header.delta` helps detect bursts and estimate rates

Because capture is synchronous:

* ordering is deterministic within a single Worker
* timing is not influenced by async scheduling

---

## 4) Invariants

You can rely on the following:

* A record has **exactly** `{ header, body }` at the top level.
* `header.at` is a number (epoch ms) for accepted records.
* Records are stored in the Worker that accepted them.
* If a Worker is disabled, records are not created.

Everything else is policy:

* whether a record is printed
* whether the body is cloned
* whether hooks ship the record elsewhere

---

## 5) Portability (exporting)

Records are designed to be portable.

If you ship them off-process, you are responsible for:

* cloning/sanitizing bodies if they contain references
* stripping large fields
* handling backpressure and dropping
* batching and retry strategy

See **Advanced Examples** for safe export patterns.

---

## Related Docs

* **Worker API** → [WORKER.md](./WORKER.md)
* **Manager API** → [MANAGER.md](./MANAGER.md)
* **Advanced Examples** → [../usage/ADVANCED_EXAMPLES.md](../usage/ADVANCED_EXAMPLES.md)


# --- end: docs/api/RECORD.md ---



# --- begin: docs/api/WORKER.md ---

# Worker API

A **Worker** represents a single log stream (a “bucket”).

It owns:

* In-memory storage (unlimited or ring buffer via `max`)
* Enable/disable gating
* Console emission policy (`console`)
* Optional per-record hook (`onEvent`)
* Optional printer (`onPrint`)
* Clock source (`clock`)
* User workspace (`workspace`) passed into hooks/printers

Workers are where records are actually stored.

---

## Constructor

### `new Worker(opts?)`

```js
import Worker from './Worker.js';

const errors = new Worker({
  name: 'errors',
  max: 500,           // ring buffer (keep last 500)
  console: 'error',   // print errors only
  clone: false,
  onEvent(record, worker, workspace) {
    // synchronous, best-effort hook
  },
  onPrint(record, ctx, workspace) {
    // optional printer override
  },
  clock: Date.now,
  workspace: { app: 'demo' }
});
```

### Options

| Option      | Type                             | Default     | Description                                                                                               |
| ----------- | -------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| `name`      | string                           | `'default'` | Worker name, stored as `record.header.source`.                                                            |
| `max`       | number | string | falsy          | `0`         | Storage cap. Falsy/`0`/`"0"` means unlimited; positive integer enables ring buffer. Invalid values throw. |
| `enabled`   | boolean                          | `true`      | Master gate. When `false`, `emit()` drops and returns `null`.                                             |
| `console`   | number | string | boolean | null | `OFF`       | Console emission policy (normalized internally).                                                          |
| `onEvent`   | function | string | any          | `null`      | Per-record hook (best-effort). Signature: `(record, worker, workspace) => void`.                          |
| `onPrint`   | function | string | any          | `null`      | Printer override used for console output (best-effort). Signature: `(record, ctx, workspace) => void`.    |
| `clock`     | function | any                   | `Date.now`  | Clock function returning epoch milliseconds. Invalid values throw.                                        |
| `clone`     | boolean                          | `false`     | Default body cloning policy. Can be overridden per call.                                                  |
| `workspace` | any                              | `{}`        | User workspace passed to hooks/printers (normalized; see below).                                          |

---

## Record shape

Workers store records in a strict `{ header, body }` shape.

* `header` is system-owned metadata
* `body` is user-owned payload
* If you pass a plain object, it becomes body.
* Otherwise body becomes { value: <your input> }.

`header` fields created by the Worker include:

* `at` — timestamp of this record
* `source` — Worker name
* `level` — severity (`log`, `info`, `warn`, `error`, …)
* `lastAt` — previous timestamp for this Worker (when available)
* `delta` — `at - lastAt` (when available)

`event` and `trace` are included when provided via `emit()` options.

---

## Enable / disable

### `worker.setEnabled(on = true)`

```js
worker.setEnabled(false);
```

When disabled:

* `emit()` returns `null`
* no records are stored
* no hooks are fired
* nothing is printed

---

## Storage policy

### Unlimited vs ring buffer

* `max === 0` → unlimited storage (append-only array)
* `max > 0` → ring buffer (keeps the most recent `max` records)

### `worker.setLogMax(value)`

```js
worker.setLogMax(1000); // keep last 1000
worker.setLogMax(0);    // unlimited
```

If `max` is reduced below the current stored size, the Worker truncates immediately to keep the most recent records.

### `worker.truncate()`

Enforces `max` against current storage.

* No-op in unlimited mode
* Keeps the most recent `max` records in ring mode

---

## Console emission policy

Console output is a policy surface and should be used selectively.

### `worker.setConsoleLevel(value)`

```js
worker.setConsoleLevel('warn');
worker.setConsoleLevel(false); // OFF
```

Printing behavior during `emit()`:

* Can be suppressed per-call with `opts.print === false`
* Uses per-call policy override `opts.console` when provided
* Otherwise uses the Worker’s `console` policy
* Printing eligibility is decided by `utils.shouldPrint(record, { console: policy })`
* Printing is best-effort (printer errors are swallowed)

---

## Hooks

### `onEvent(record, worker, workspace)`

* Called synchronously after acceptance + storage
* Best-effort (errors swallowed)
* Return value ignored

Use it to **signal** external systems (enqueue, counters, etc.).

### `onPrint(record, ctx, workspace)`

Optional printer function used for console output.

If omitted, the default printer is used.

`ctx` includes:

* `levelNum` — normalized console level number
* `policy` — normalized console policy
* `CONSOLE_LEVEL` — enum reference

---

## Emitting records

### `worker.emit(data, opts?)`

```js
worker.emit({ msg: 'hello' }, { level: 'info', event: 'boot' });
```

Behavior:

* If disabled → returns `null`
* Normalizes `data` into `record.body`
* Builds a `{ header, body }` record with timing metadata
* Optionally clones the body best-effort (see below)
* Stores the record (unlimited or ring)
* Fires `onEvent` best-effort
* Optionally prints best-effort

#### `emit()` options

| Option    | Type    | Default        | Description                                            |
| --------- | ------- | -------------- | ------------------------------------------------------ |
| `level`   | string  | `'log'`        | Stored as `record.header.level`.                       |
| `event`   | string  | `undefined`    | Stored as `record.header.event`.                       |
| `trace`   | any     | `undefined`    | Stored as `record.header.trace`.                       |
| `clone`   | boolean | Worker default | Per-call clone override.                               |
| `print`   | boolean | `true`         | If `false`, suppresses console printing for this call. |
| `console` | any     | Worker default | Per-call console policy override.                      |

---

## Cloning vs references

By default, bodies are stored **by reference**.

To reduce mutation-by-reference you can:

* Enable default cloning on the Worker: `new Worker({ clone: true })`
* Or override per call: `emit(data, { clone: true })`

Cloning is best-effort and adds cost. Prefer selective cloning or cloning only when exporting.

---

## Convenience methods

These are thin wrappers around `emit()` that set `level`:

* `worker.log(data, opts?)` → `level: 'log'`
* `worker.info(data, opts?)` → `level: 'info'`
* `worker.warn(data, opts?)` → `level: 'warn'`
* `worker.error(data, opts?)` → `level: 'error'`

```js
worker.info('started');
worker.error(new Error('boom'), { event: 'request' });
```

---

## Reading records

### `worker.get(filter?)`

Returns records in chronological order (oldest → newest), regardless of internal storage mode.

```js
const all = worker.get();
```

#### Special filters

* `since` (number, epoch ms)

  * Filters out records with `record.header.at < since`
* `limit` (non-negative integer)

  * Takes the most recent `limit` records *after* filtering
  * `limit: 0` returns `[]`

```js
worker.get({ since: Date.now() - 10_000, limit: 50 });
```

#### Key routing rules

When filtering by keys, the Worker supports three targeting styles:

* Explicit:

  * `"header.foo"` → compares against `record.header["foo"]` (literal key)
  * `"body.bar"` → compares against `record.body["bar"]` (literal key)

* Best-effort (bare key):

  * Known header fields (`at`, `source`, `level`, `event`, `trace`) match `header`
  * Everything else matches `body`

#### Value matching

* Scalars use strict equality (`===`).
* Functions are treated as predicates: `(value, record) => boolean`.
  Predicate errors are swallowed and treated as non-matches.

Example:

```js
// find only error-level records
worker.get({ level: 'error' });

// predicate filter
worker.get({
  'body.msg': (v) => typeof v === 'string' && v.includes('timeout')
});
```

---

## Clearing records

### `worker.clear()`

Clears stored records and resets internal storage counters.

Note: `_lastAt` is intentionally preserved (used for timing continuity).

---

## Introspection

### `worker.stats()`

Returns a small snapshot:

```js
{
  name: string,
  enabled: boolean,
  max: number,
  size: number,   // currently retained
  count: number,  // total accepted since last clear
  ring: boolean
}
```

---

## Runtime configuration

### `worker.configure(patch)`

Patch policy at runtime:

```js
worker.configure({
  enabled: true,
  max: 200,
  console: 'off',
  onEvent: null,
  onPrint: null,
  clock: Date.now,
  workspace: { sessionId: 'abc' }
});
```

Notes:

* Unknown keys are ignored.
* Invalid values throw.
* Workspace is only changed when `workspace` is explicitly present.

### Workspace normalization

Workspace rules:

* If `workspace` is provided:

  * plain object → becomes the workspace
  * anything else → workspace becomes `{}`
* If `workspace` is omitted:

  * workspace is unchanged

---

## Related Docs

* **Manager API** → [MANAGER.md](./MANAGER.md)
* **Record Structure** → [RECORD.md](./RECORD.md)
* **Usage** → [../usage/TOC.md](../usage/TOC.md)


# --- end: docs/api/WORKER.md ---



# --- begin: docs/usage/ADVANCED_EXAMPLES.md ---

# Advanced Examples – m7-js-lib-primitive-log

This page shows what you **can** do when you attach an async pipeline behind the primitive.

The core library remains intentionally synchronous:

* Capture happens immediately
* Hooks fire synchronously
* Nothing is awaited
* No transport is implied

If you want async behavior (shipping, batching, sampling, burst control), **you build it outside** the primitive.

---

## The pattern: synchronous capture → async pipeline

The rule of thumb:

1. Keep `onEvent` extremely small
2. Push a **copy** into a queue
3. Process the queue asynchronously on your schedule

This preserves the primitive’s guarantees while letting you build real systems.

---

## 1) Minimal async shipper (queue + flush loop)

```js
const log = new lib.primitive.log.Manager();

const outbox = [];
let flushing = false;

log.createBucket('events', {
  // Called synchronously after a record is accepted.
  onEvent(record) {
    // Do the smallest possible thing here.
    outbox.push(record);

    // Optionally trigger a flush (best-effort, non-blocking).
    if (!flushing) void flush();
  }
});

async function flush() {
  flushing = true;
  try {
    while (outbox.length) {
      const record = outbox.shift();
      await fetch('/ingest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(record)
      });
    }
  } finally {
    flushing = false;
  }
}

log.log('events', { type: 'click', id: 123 });
```

Notes:

* `onEvent` never awaits.
* If the network is slow, the queue grows — **that is your responsibility**.
* The Worker’s internal records remain useful for local diagnostics; you don’t need to “drain” them.

---

## 2) Burst detection + drop policy (protect the app)

You can use `record.header.delta` to detect bursts.

A common strategy is to **drop** or **sample** when events arrive too quickly.

```js
const outbox = [];

log.createBucket('telemetry', {
  onEvent(record) {
    const delta = record?.header?.delta;

    // Example burst rule: < 2ms between events
    const isBurst = typeof delta === 'number' && delta >= 0 && delta < 2;

    // Drop low-priority burst events
    if (isBurst && record?.header?.level === 'debug') return;

    outbox.push(record);
  }
});
```

This keeps capture deterministic while protecting your async transport from overload.

---

## 3) Sampling (keep 1 out of N)

Sampling is a policy decision. Do it outside the primitive.

```js
const outbox = [];
let n = 0;

log.createBucket('sampled', {
  onEvent(record) {
    n += 1;

    // Keep 1 out of 10 records
    if (n % 10 !== 0) return;

    outbox.push(record);
  }
});
```

---

## 4) Batch + time-based flush

Batching reduces network overhead.

```js
const outbox = [];
let timer = null;

log.createBucket('batched', {
  onEvent(record) {
    outbox.push(record);

    // Schedule a flush every 250ms (best-effort)
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        void flushBatch();
      }, 250);
    }
  }
});

async function flushBatch() {
  if (!outbox.length) return;

  const batch = outbox.splice(0, outbox.length);

  await fetch('/ingest-batch', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ batch })
  });
}
```

This is a good default shape for “ship logs but don’t hurt UX.”

---

## 5) Backpressure strategies (choose one)

Once you have an async outbox, you must decide what happens under load.

Common policies:

* **Drop newest** when the queue is full (protect memory)
* **Drop oldest** (keep most recent context)
* **Sample harder** as queue grows
* **Spill to storage** (IndexedDB / localStorage) if you truly need it

Example: drop newest over a hard limit.

```js
const outbox = [];
const MAX = 2000;

log.createBucket('guarded', {
  onEvent(record) {
    if (outbox.length >= MAX) return; // drop
    outbox.push(record);
  }
});
```

---

## 6) Cloning before shipping (optional)

By default, record bodies are stored by reference.

That is often what you want for performance, but it can surprise you if you ship references that later mutate.

You have two common options:

### Option A: Enable cloning at capture time

```js
log.createBucket('ship', {
  clone: true,
  onEvent(record) {
    outbox.push(record);
  }
});
```

### Option B: Clone only when exporting

Keep capture fast, clone only when you actually ship.

```js
log.createBucket('ship', {
  onEvent(record) {
    outbox.push(record);
  }
});

async function flush() {
  while (outbox.length) {
    const record = outbox.shift();

    // Minimal cloning example
    const safe = {
      header: record.header,
      body: structuredClone ? structuredClone(record.body) : record.body
    };

    await fetch('/ingest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(safe)
    });
  }
}
```

If cloning is expensive for your payloads, prefer selective cloning (or ship only the fields you need).

---

## 7) “Do I need to drain internal records?”

Usually, **no**.

The Worker’s internal storage exists primarily for:

* Live inspection
* Front-end diagnostics
* Local debugging ("what just happened?")

If you are piping records outward via your own async pipeline, treat internal storage as a local ring buffer / scratchpad.

If you truly don’t want local storage, configure a very small ring buffer.

---

## Related Docs

* [Quick Start](./QUICKSTART.md)
* [Installation](./INSTALLATION.md)
* [Examples](./EXAMPLES_LIBRARY.md)
* [Performance Notes](./PERFORMANCE.md)
* [API Docs](../api/INDEX.md)


# --- end: docs/usage/ADVANCED_EXAMPLES.md ---



# --- begin: docs/usage/EXAMPLES_LIBRARY.md ---

# Examples – m7-js-lib-primitive-log

This document collects practical patterns you can copy‑paste and adapt.

All examples assume you want **synchronous capture** with **no transport implied**.

---

## Common setup (Manager + buckets)

```js
// auto.js usage
const log = new lib.primitive.log.Manager();

log.createBucket('app');
log.createBucket('errors');
```

---

## 1. Basic app lifecycle logging

```js
log.log('app', 'app:start', { level: 'info' });

try {
  // ... boot logic
  log.log('app', 'app:ready', { level: 'info' });
} catch (err) {
  log.log('errors', err, { level: 'error' });
}
```

---

## 2. Error capture wrapper (small helper)

```js
function withLogErrors(fn, bucket = 'errors') {
  return (...args) => {
    try {
      return fn(...args);
    } catch (err) {
      log.log(bucket, err, { level: 'error' });
      throw err;
    }
  };
}

const onClick = withLogErrors(() => {
  // throw new Error('boom');
});
```

---

## 3. Conditional console logging (debug builds)

Console output is often the most expensive part. Enable it only when you mean it.

```js
const isDev = (typeof import !== 'undefined' && import.meta?.env?.DEV) ||
  (typeof location !== 'undefined' && location.hostname === 'localhost');

log.createBucket('debug', {
  console: isDev ? 'debug' : 'off'
});

log.log('debug', { route: location.pathname, t: Date.now() });
```

---

## 4. Ring buffer bucket (bounded memory)

Use a ring buffer when you want “latest N events” with bounded memory.

```js
log.createBucket('net', {
  // Example: keep only the last 500 records
  max: 500
});

log.log('net', { type: 'request', url: '/api/me' });
```

---

## 5. Burst detection using header.delta

Because capture is synchronous and includes timing metadata, you can detect bursts without scheduling.

```js
log.createBucket('perf', {
  onEvent(record, worker, workspace) {
    const d = record?.header?.delta;
    if (typeof d === 'number' && d >= 0 && d < 5) {
      workspace.bursts = (workspace.bursts || 0) + 1;
    }
  }
});

log.log('perf', 'tick');
log.log('perf', 'tick');
```

---

## 6. Hook to enqueue into an async pipeline

Hooks are synchronous signals. Put real async work behind a queue.

```js
const queue = [];

log.createBucket('events', {
  onEvent(record) {
    // Minimal work in the hook
    queue.push(record);
  }
});

// Elsewhere: drain the queue on your own schedule
async function flush() {
  while (queue.length) {
    const record = queue.shift();
    await fetch('/ingest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(record)
    });
  }
}
```

---

## 7. Mutation safety: opt-in cloning

By default, bodies are stored by reference.

```js
const obj = { count: 0 };

log.log('app', obj);   // stored by reference
obj.count += 1;

// Opt-in cloning per-call
log.log('app', obj, { clone: true });
obj.count += 1;
```

---

## 8. One bucket only? Use a Worker directly

There is intentionally **no default bucket**.

```js
import { Worker } from './log/index.js';

const worker = new Worker({
  console: 'warn'
});

worker.log('worker:started');
worker.log({ msg: 'something happened', x: 1 });
```

---

## Related Docs

* [Quick Start](./QUICKSTART.md)
* [Installation](./INSTALLATION.md)
* [Performance Notes](./PERFORMANCE.md)
* [API Docs](../api/INDEX.md)


# --- end: docs/usage/EXAMPLES_LIBRARY.md ---



# --- begin: docs/usage/INSTALLATION.md ---

# Installation – m7-js-lib-primitive-log

`m7-js-lib-primitive-log` is currently distributed as plain JavaScript files.

It is intentionally small, dependency-light, and does not require a build step.

There are **two supported installation modes**:

1. **Recommended**: `auto.js` integration with **m7-lib** (simplest for browser usage)
2. **Manual / Module** usage without `auto.js` (bundlers, tests, advanced setups)

---

## Prerequisites

* **m7-lib** (latest recommended)
  Required *only* when using `auto.js`. The log primitive registers itself into `window.lib`.

* Modern browser or JS runtime

  * Browsers: Chrome 90+, Firefox 85+, Safari 14.1+, Edge 90+
  * Node / Deno / Bun supported via module usage

---

## Option A – Recommended (auto.js)

This is the simplest setup if you are already using **m7-lib**.

### 1. Project structure (example)

```
your-project/
├── lib/
│   ├── m7-lib.min.js            ← m7-lib
│   └── log/
│       └── auto.js              ← installs the log primitive
├── index.html
└── main.js
```

> You do **not** need to manually load `Manager.js`, `Worker.js`, or other internal files when using `auto.js`.

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

  <!-- Load m7-lib first -->
  <script src="/lib/m7-lib.min.js"></script>

  <!-- Install log primitive into window.lib -->
  <script type="module" src="/lib/log/auto.js"></script>

  <!-- Your application code -->
  <script src="/main.js"></script>
</body>
</html>
```

This installs the following API:

```js
lib.primitive.log
```

Example usage in `main.js`:

```js
const log = new lib.primitive.log.Manager();

log.createBucket('app');
log.log('app', 'application started');
```

---

## Option B – Manual / Module Usage (no auto.js)

Use this approach for bundlers, tests, Node.js, or environments without `m7-lib`.

### 1. Copy files

```
lib/log/
├── Manager.js
├── Worker.js
├── constants.js
├── utils.js
└── (optional index.js)
```

You may also vendor only the files you actually need.

---

### 2. Import directly

```js
import { Manager, Worker } from './lib/log/index.js';

const log = new Manager();

log.createBucket('errors');
log.log('errors', new Error('boom'));
```

> `m7-lib` is **not required** in this mode.

---

## Tree-shaking & bundlers

The manual/module form is friendly to bundlers:

* No side effects
* No global registration
* No hidden async work

Only the code you import is included.

---

## Troubleshooting

| Symptom                        | Likely Cause                             | Fix                          |
| ------------------------------ | ---------------------------------------- | ---------------------------- |
| `lib.primitive` is undefined   | `auto.js` not loaded or loaded too early | Ensure `m7-lib` loads first  |
| `Manager is not a constructor` | Import path incorrect                    | Verify file paths / index.js |
| No console output              | Console printing disabled by default     | Enable `console` per Worker  |
| Missing records                | Worker disabled or ring buffer overflow  | Check Worker config          |

---

## TypeScript users (optional)

No official `.d.ts` files are provided yet.

Minimal workaround:

```ts
declare module './lib/log/index.js' {
  export class Manager {}
  export class Worker {}
}
```

Most editors will still provide good inference via JSDoc.

---

## Future npm support

If this package is published in the future (name TBD):

```bash
npm install m7-js-lib-primitive-log
```

```js
import { Manager } from 'm7-js-lib-primitive-log';
```

---

## Related Docs

* **Quick Start** → [`QUICKSTART.md`](./QUICKSTART.md)
* **Examples** → [`EXAMPLES_LIBRARY.md`](./EXAMPLES_LIBRARY.md)
* **API Docs** → [`../api/INDEX.md`](../api/INDEX.md)


# --- end: docs/usage/INSTALLATION.md ---



# --- begin: docs/usage/PERFORMANCE.md ---

# Performance Notes – m7-js-lib-primitive-log

This library is designed to be **fast by default** on the hot path.

Performance is a first-class constraint, but it is enforced through **clear responsibility boundaries**, not hidden optimizations.

---

## What the primitive optimizes for

The core guarantees are:

* **Synchronous capture** with predictable cost
* **No hidden async work**
* **Bounded memory** (explicitly configured)
* **Minimal branching** on the hot path

In practice, a log call:

* Creates a small record
* Attaches timing metadata
* Stores it in memory
* Optionally signals hooks

Nothing is awaited. Nothing is scheduled.

---

## What is intentionally *not* optimized

The primitive does **not** attempt to optimize:

* Network transport
* Batching
* Compression
* Sampling strategies
* Backpressure handling
* Persistence

If you choose to ship logs off-process, that cost is **entirely yours by design**.

See **Advanced Examples** for patterns that do this safely.

---

## Console output is the biggest cost

Printing to the console is often **orders of magnitude slower** than capture.

For this reason:

* Console output is **off by default**
* Enabled explicitly per Worker
* Treated as a policy, not logging itself

If performance matters, capture silently and decide later what to print.

---

## Cloning vs references

By default, record bodies are stored **by reference**.

This is the fastest option and avoids unnecessary allocation.

Cloning is:

* Opt-in
* Best-effort
* More expensive

If you enable cloning:

* Prefer selective cloning
* Avoid cloning large objects on hot paths
* Consider cloning only when exporting

---

## Hooks should be tiny

`onEvent` and `onPrint` are synchronous.

They should:

* Do minimal work
* Never block
* Never await

A good rule:

> If it might be slow, enqueue it and return.

---

## Internal storage is diagnostic

Workers retain records primarily for:

* Live inspection
* Debugging
* Front-end diagnostics

You generally do **not** need to drain internal storage when exporting logs.

If memory matters:

* Use a ring buffer
* Keep only recent history

---

## The contract

The library guarantees:

* Fast, predictable capture
* No surprise background work

The user controls:

* Export strategy
* Sampling and dropping
* Backpressure behavior
* Long-term storage

This separation is what keeps the hot path fast.

---

> Capture first. Decide later.


# --- end: docs/usage/PERFORMANCE.md ---



# --- begin: docs/usage/QUICKSTART.md ---

# Quick Start – m7-js-lib-primitive-log

This guide gets you capturing structured log events synchronously in under 2 minutes.

No transports. No async scheduling. No hidden policy.

---

## 1. Project Setup (one-time)

If you are using **m7-lib**, make sure it is loaded **before** the log primitive.

```html
<!-- Load m7-lib first (required only for auto.js) -->
<script src="/path/to/m7-lib.min.js"></script>

<!-- Then load the log primitive -->
<script type="module" src="/path/to/log/auto.js"></script>
```

After including `auto.js`, the primitive is available at:

```js
lib.primitive.log
```

Alternatively, in module environments you can import directly:

```js
import { Manager, Worker } from './log/index.js';
```

---

## 2. Create a Manager and a Log Bucket

The **Manager** is a convenience layer for working with multiple named log streams (Workers).

```js
// Using auto.js
const log = new lib.primitive.log.Manager();

// Create a named bucket (Worker)
log.createBucket('errors');
```

At this point:

* Nothing is asynchronous
* No data leaves memory
* No cloning occurs
* No console output is enabled

---

## 3. Emit Your First Log Record

```js
log.log('errors', new Error('boom'), {
  level: 'error'
});
```

This synchronously:

* Creates a record
* Attaches timing metadata
* Stores it in the `errors` bucket
* Returns immediately

No configuration required.

---

## 4. Inspect Records

Each bucket stores records in memory.

```js
const worker = log.bucket('errors');

console.log(worker._events);
```

Records have a strict structure:

* `record.header` — timing and metadata
* `record.body` — your payload

Payloads are stored **by reference** unless cloning is explicitly enabled.

---

## 5. Enable Console Output (Optional)

Console printing is disabled by default for performance reasons.

```js
log.createBucket('debug', {
  console: 'log'
});

log.log('debug', 'hello world');
```

Console emission:

* Is synchronous
* Is best-effort
* Should be used selectively

---

## 6. Hooks: React Without Policy

You can attach synchronous hooks to observe events.

```js
log.createBucket('metrics', {
  onEvent(record) {
    // Increment counters, enqueue work, signal pipelines
    stats.increment(record.header.level);
  }
});
```

Hook behavior:

* Called synchronously
* Errors are swallowed
* Return values are ignored

Hooks are **signals**, not execution engines.

---

## 7. Single-Bucket Usage (No Manager)

If you only need one log stream, you can instantiate a Worker directly.

```js
import { Worker } from './log/index.js';

const worker = new Worker({
  console: 'warn'
});

worker.log('something happened');
```

There is intentionally **no default bucket**.

If you want one bucket, create one.

---

## 8. Cleanup

```js
// Disable a bucket
worker.setEnabled(false);

// Clear stored records
worker.clear();
```

There are no background tasks to stop and no async resources to dispose.

---

## Next Steps

* Deeper usage patterns → [EXAMPLES_LIBRARY.md](./EXAMPLES_LIBRARY.md)
* Performance characteristics → [PERFORMANCE.md](./PERFORMANCE.md)
* Full API reference → [../api/INDEX.md](../api/INDEX.md)

---

> Capture first. Decide later.


# --- end: docs/usage/QUICKSTART.md ---



# --- begin: docs/usage/TOC.md ---

# Usage Documentation — Table of Contents

This section contains **practical, user-facing guides** for using the log primitive in real applications.

If you are looking for **formal API definitions**, see the API index instead:

- **API Index** → [../api/INDEX.md](../api/INDEX.md)

If you’re completely new, start at the top and read downward.

---

## Getting Started

- **Quick Start** → [QUICKSTART.md](./QUICKSTART.md)  
  Minimal setup, first logs, and recommended defaults.

- **Installation** → [INSTALLATION.md](./INSTALLATION.md)  
  Supported environments, bundlers, and import patterns.

---

## Examples

- **Examples Library** → [EXAMPLES_LIBRARY.md](./EXAMPLES_LIBRARY.md)  
  Common patterns, copy-paste snippets, and idiomatic usage.

- **Advanced Examples** → [ADVANCED_EXAMPLES.md](./ADVANCED_EXAMPLES.md)  
  Multi-worker setups, routing strategies, hooks, and edge cases.

---

## Performance & Design

- **Performance Notes** → [PERFORMANCE.md](./PERFORMANCE.md)  
  Cost model, hot paths, allocations, and guidance for high-volume logging.

- **Why Not `console.log`?** → [../WHY_NOT_CONSOLE_LOG.md](../WHY_NOT_CONSOLE_LOG.md)  
  Design rationale and tradeoffs compared to native console logging.

---

## Policy & Meta

- **Use Policy** → [../USE_POLICY.md](../USE_POLICY.md)  
  Intended usage boundaries and non-goals.

- **AI Disclosure** → [../AI_DISCLOSURE.md](../AI_DISCLOSURE.md)  
  Notes on AI-assisted authorship and expectations.

---

## Navigation

- **API Reference** → [../api/INDEX.md](../api/INDEX.md)
- **Docs Root** → [./TOC.md](./TOC.md)
- **Project README** → [../../README.md](../../README.md)


# --- end: docs/usage/TOC.md ---



# --- begin: docs/USE_POLICY.md ---

# 📘 m7-js-lib-primitive-log Use Policy

This document outlines how you may use m7-js-lib-primitive-log under the **Moderate Team License (MTL-10)** and what is expected of you as a user.

---

## ✅ Free Use — What You Can Do

You may use m7-js-lib-primitive-log **for free** if you fall under any of the following categories:

* **Individuals** using it for personal projects, learning, or experimentation
* **Academic institutions or researchers** using it for teaching, papers, or labs
* **Nonprofits and NGOs** using it internally without revenue generation
* **Startups or companies** with **10 or fewer users** of m7-js-lib-primitive-log internally

  * This includes development, deployment, and operational use

There is **no cost, license key, or approval required** for these use cases.

---

## 🚫 Commercial Restrictions

m7-js-lib-primitive-log **may not be used** in the following ways without a paid commercial license:

* As part of a **commercial product** that is sold, licensed, or monetized
* Embedded within a platform, device, or SaaS product offered to customers
* Internally at companies with **more than 10 users** working with m7-js-lib-primitive-log
* As a hosted service, API, or backend component for commercial delivery
* In resale, sublicensing, or redistribution as part of paid offerings

---

## 🔒 Definitions

* **User**: Anyone who installs, configures, modifies, integrates, or interacts with m7-js-lib-primitive-log as part of their role.
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



# --- begin: docs/WHY_NOT_CONSOLE_LOG.md ---

# Why Not `console.log`?

`console.log` is fine for quick experiments.

It does not scale as a diagnostic or observability strategy.

---

## 1) Debug prints spread everywhere

`console.log` encourages inline, ad-hoc debugging:

```js
console.log('here');
console.log('there');
console.log('why is this undefined?', x);
```

Over time this leads to:

* Debug prints scattered across the codebase
* No shared structure or naming
* Unclear intent (is this temporary or permanent?)
* Fear of deleting logs "just in case"

A logging primitive centralizes capture so diagnostics are **intentional**, not incidental.

---

## 2) Console buffers are not designed for volume

Browser consoles are optimized for **human interaction**, not sustained throughput.

When too much is printed:

* The console drops messages
* DevTools becomes slow or unstable
* Useful context scrolls out of reach
* Performance suffers (sometimes dramatically)

This is especially painful during bursts or tight loops.

Capturing logs in memory avoids turning the console into a bottleneck.

---

## 3) Console output has no structure

`console.log` gives you text (and sometimes object previews).

It does not give you:

* Consistent timing metadata
* Record structure
* Levels you can reliably filter
* A way to reason about bursts or rates

Once printed, the data is gone.

A structured log record can be inspected, sampled, summarized, or exported later.

---

## 4) On / off control is coarse and global

Your options with `console.log` are usually:

* Delete the line
* Comment it out
* Wrap it in `if (DEBUG)`
* Monkey-patch `console`

These approaches are:

* Global rather than scoped
* Hard to audit
* Easy to forget

With a logging primitive:

* Console output is **off by default**
* Enabled per bucket
* Can be toggled dynamically
* Can coexist with silent capture

---

## 5) Turn debugging into an asset

Well-structured logging is a sign of forethought.

* A complex program with intentional logging shows **design hygiene**
* A complex program with `console.log` sprinkled everywhere shows **debug debt**

When logs are structured, scoped, and capturable:

* They become documentation of system behavior
* They can be analyzed after the fact
* They help future maintainers (including you)

When debug prints are ad-hoc:

* They are noisy
* They are brittle
* They are eventually ignored or deleted

Good logging turns debugging into an **asset**, not an annoyance.

---

## 6) Capture now, decide later

The core problem with `console.log` is that it forces an immediate decision:

> "Should this go to the console?"

Often the real question is:

> "Do I want to observe this *at all*?"

A logging primitive lets you:

* Capture synchronously
* Keep the hot path fast
* Decide later whether to print, sample, export, or drop

Console output becomes **one possible policy**, not the act of logging itself.

---

## When `console.log` is still fine

Use `console.log` when:

* You are experimenting
* The volume is tiny
* The code is throwaway
* You do not need history or structure

It is a tool — just not a system.

---

## The takeaway

`console.log` is a side effect.

A logging primitive is **capture**.

Capture gives you control.

---

> Capture first. Decide later.


# --- end: docs/WHY_NOT_CONSOLE_LOG.md ---



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

# m7-js-lib-primitive-log

A synchronous event/log capture primitive designed for live inspection, high-throughput instrumentation, and composable observability pipelines.

This project exists because most logging systems conflate event capture with transport, async scheduling, and policy, making them slow, opaque, or brittle under real-world load.

This library does one thing well: **capture structured log events synchronously with bounded memory and explicit extension points.**

It is a primitive, not a framework.

---

## Navigation

If you are new to the project, the recommended reading order is:

1. **Quick Start** → [docs/usage/QUICKSTART.md](docs/usage/QUICKSTART.md)
2. **Usage TOC** → [docs/usage/TOC.md](docs/usage/TOC.md)
3. **API Index** → [docs/api/INDEX.md](docs/api/INDEX.md)

Related meta documents:

- **Why not `console.log`?** → [docs/WHY_NOT_CONSOLE_LOG.md](docs/WHY_NOT_CONSOLE_LOG.md)
- **Use Policy** → [docs/USE_POLICY.md](docs/USE_POLICY.md)
- **AI Disclosure** → [docs/AI_DISCLOSURE.md](docs/AI_DISCLOSURE.md)

---

## Why this exists

If you have ever:

- Needed to inspect logs live without shipping them anywhere
- Had async logging introduce latency, ordering issues, or hidden drops
- Been forced into deep cloning when you didn’t need it
- Wanted deterministic timing metadata without scheduling complexity
- Needed a hook point without committing to a transport or backend

Then you have already discovered the limits of “full-featured” logging frameworks.

This library solves those problems by separating capture from policy.

---

## What this library guarantees

- Log capture is synchronous and deterministic
- Storage is explicitly bounded (unlimited or ring buffer)
- Records have a strict header/body split
- Timing metadata is explicit and reliable (`at`, `lastAt`, `delta`)
- Mutation safety is opt-in, not forced
- Hooks (`onEvent`, `onPrint`) are best-effort and non-fatal
- No async work is hidden or implied

These guarantees are enforced by design, not convention.

---

## Quick example (safe by default)

```js
import { Manager } from "primitive-log";

const log = new Manager();

log.createBucket("errors");

log.log("errors", new Error("boom"), {
  level: "error",
});
```

By default this:

* Stores records synchronously
* Uses in-memory storage only
* Does not clone payloads
* Does not ship data anywhere
* Does not block on async work

No configuration required.

---

## Core concepts

### Manager

A registry and convenience layer responsible for:

* Managing named log buckets (Workers)
* Applying shared defaults
* Providing a single entrypoint (`log(bucket, data, opts)`)

Think of it as the **control plane**.

→ Detailed API: [docs/api/MANAGER.md](docs/api/MANAGER.md)

---

### Worker

A single log stream with its own:

* Storage policy (unlimited or ring buffer)
* Enable/disable switch
* Console emission policy
* Optional event hook (`onEvent`)
* Optional printer (`onPrint`)
* Clock source
* Workspace

Think of it as the **execution plane**.

→ Detailed API: [docs/api/WORKER.md](docs/api/WORKER.md)

---

## Synchronous by design

This library is intentionally synchronous.

* `emit()` / `log()` return immediately
* `onEvent` is invoked synchronously and not awaited
* Async handlers are allowed, but must manage their own backpressure

This ensures:

* Predictable performance
* No hidden scheduling
* No surprise latency

Async work belongs outside the primitive.

---

## Mutation & cloning semantics

By default, logged payloads are stored by reference.

This is intentional.

### Clone policy

Cloning is:

* Off by default
* Opt-in per Worker or per call
* Best-effort, not guaranteed

```js
log.log("errors", data, { clone: true });
```

Cloning uses:

1. `structuredClone` when available
2. `lib.utils.deepCopy` if present
3. Original reference as a fallback

This keeps the hot path fast and puts responsibility where it belongs.

---

## Timing metadata

Each record includes:

* `header.at` — timestamp of emission
* `header.lastAt` — timestamp of previous record in the same bucket (if any)
* `header.delta` — time difference between records

This enables:

* Burst detection
* Sampling logic
* Rate estimation
* Heatmaps

No async scheduling required.

→ Record definition: [docs/api/RECORD.md](docs/api/RECORD.md)

---

## Hooks without policy

### onEvent

`onEvent(record, worker, workspace)`

* Called synchronously after a record is accepted
* Errors are swallowed
* Return value is ignored

This hook exists to signal external systems, not to run them.

Typical uses:

* Enqueue into a queue
* Increment counters
* Trigger async pipelines

→ Hook semantics: [docs/api/EVENT_HANDLERS.md](docs/api/EVENT_HANDLERS.md)

---

### onPrint

`onPrint(record, ctx, workspace)`

Used for console output only.

Console printing is often the largest performance cost and should be used selectively.

---

## Features

* Synchronous log/event capture
* Strict header/body record structure
* Unlimited or ring-buffer storage
* Deterministic timing metadata
* Explicit clone control
* Per-bucket configuration
* Manager-level defaults
* Workspace propagation
* Best-effort hooks and printing
* No async assumptions
* No transport assumptions

---

## What this library does not do

This project is intentionally scoped.

It does not:

* Ship logs to a server
* Batch or retry network requests
* Perform sampling or aggregation
* Guarantee delivery
* Enforce schemas
* Provide async logging modes
* Act as a metrics or tracing system

Those belong in composed layers, not primitives.

---

## Installation

This package is not yet available via npm or yarn.

### Recommended (auto.js)

If you are already using **m7-lib**, the simplest setup is:

```html
<script src="/path/to/m7-lib.min.js"></script>
<script type="module" src="/path/to/log/auto.js"></script>
```

This installs:

* `lib.primitive.log`

→ Integration details: [docs/api/AUTO.md](docs/api/AUTO.md)

---

### Manual / module usage

```js
import { Manager, Worker } from "./log/index.js";
```

`m7-lib` is required only when using `auto.js`.

---

## Documentation Map

* **Usage TOC** → [docs/usage/TOC.md](docs/usage/TOC.md)
* **Quick Start** → [docs/usage/QUICKSTART.md](docs/usage/QUICKSTART.md)
* **Examples Library** → [docs/usage/EXAMPLES_LIBRARY.md](docs/usage/EXAMPLES_LIBRARY.md)
* **Advanced Examples** → [docs/usage/ADVANCED_EXAMPLES.md](docs/usage/ADVANCED_EXAMPLES.md)
* **Performance Notes** → [docs/usage/PERFORMANCE.md](docs/usage/PERFORMANCE.md)
* **API Index** → [docs/api/INDEX.md](docs/api/INDEX.md)

---

## Portfolio note

This project is designed as a systems-level logging primitive, not a convenience logger.

It demonstrates:

* Explicit responsibility boundaries
* Synchronous hot-path design
* Deterministic state handling
* Policy-free core architecture
* Composability over features

---

## License

See [LICENSE.md](LICENSE.md) for full terms.

* Free for personal, non-commercial use
* Commercial licensing available under the M7 Moderate Team License (MTL-10)

---

## Integration & Support

For commercial usage, integration assistance, or support contracts:

* 📩 [legal@m7.org](mailto:legal@m7.org)

---

## AI Usage Disclosure

See:

* [docs/AI_DISCLOSURE.md](docs/AI_DISCLOSURE.md)
* [docs/USE_POLICY.md](docs/USE_POLICY.md)

for permitted use of AI in derivative tools or automation layers.

---

## Philosophy

> “Capture first. Decide later.”

Avoid embedding policy where flexibility is required.

---

## Feedback / Security

* General inquiries: [legal@m7.org](mailto:legal@m7.org)
* Security issues: [security@m7.org](mailto:security@m7.org)


# --- end: README.md ---



# --- begin: wishlist.md ---

Log Primitive — Wishlist & Future Work

This document tracks non-blocking improvements, enhancements, and follow-ups for the log capture primitive (primitive.log).
None of the items below are required for correctness or current production use.

⸻

1. Documentation & Developer Experience

1.1 API Documentation
	•	Full JSDoc coverage for:
	•	Worker
	•	Manager
	•	utils (public portions)
	•	constants
	•	Explicit documentation of:
	•	Synchronous design contract (no implicit async)
	•	onEvent invocation semantics (sync call, not awaited; async handlers must self-manage)
	•	Clone semantics (clone precedence: Manager → bucket → call; best-effort guarantees)
	•	Timing metadata (header.at, header.lastAt, header.delta)
	•	Ring buffer ordering guarantees and overwrite behavior
	•	Bucket name validation rules (validateBucketName behavior)

1.2 Behavioral Guides

“How it actually behaves” docs (not just signatures):
	•	Record lifecycle: emit() → _push() → onEvent → optional print
	•	Storage modes:
	•	unlimited (max = 0)
	•	ring (max > 0)
	•	Manager.bucket() vs Manager._bucket() semantics (soft vs strict)
	•	get(filter) routing rules (header/body targeting, predicate behavior, limit/since behavior)
	•	Practical usage examples:
	•	Live inspection (short buffer)
	•	Error-only capture (minimal overhead)
	•	Sampling patterns (implemented by user in onEvent)
	•	Export/shipping patterns (user-managed queue + batching)

⸻

2. Public Surface & Packaging

2.1 Public API Surface Declaration
	•	Decide and document what is “public/stable”:
	•	Option A: Manager, Worker, constants are stable; utils is internal
	•	Option B: everything exported is stable (including utils)
	•	Provide a clean entrypoint:
	•	index.js for standard imports
	•	auto.js for window.lib registration (lib.primitive.log)

2.2 Build/Distribution Hygiene
	•	Remove editor backup artifacts (e.g. auto.js~)
	•	Optional: package.json exports map for:
	•	"." → index
	•	"./auto" → auto registration

⸻

3. Telemetry & Observability

3.1 Minimal Stats/Counters

Add optional counters to support high-volume use without introducing policy:
	•	Per worker:
	•	total emitted (_count already exists)
	•	stored count (accepted)
	•	dropped count (disabled or rejected)
	•	overwrite count (ring overwrite events)
	•	Optional method:
	•	worker.stats() returning a stable shape (read-only snapshot)

3.2 Hook/Print Failure Visibility (Optional)
	•	Optional “debug mode” counters:
	•	onEvent errors swallowed count
	•	print errors swallowed count
	•	Keep default behavior “best-effort/no throw”.

⸻

4. Export & Serialization Helpers (Optional)

4.1 JSON-Safe Snapshot Helper

Provide a helper to support export without promising universal deep copy:
	•	e.g. utils.toJSONSafe(record) or utils.sanitize(value, opts)
	•	Goals:
	•	prevent accidental exfil of complex objects (DOM nodes, Response objects)
	•	reduce payload size
	•	Non-goal: full fidelity serialization of arbitrary graphs.

4.2 Shape Reduction Helpers

Optional helpers to reduce payload volume:
	•	allowlist/denylist keys
	•	header/body selection
	•	truncate large strings / arrays

⸻

5. Performance & Safety Notes

5.1 Clone Guidance & Patterns

Document recommended patterns:
	•	default clone:false
	•	enable clone:true only for:
	•	error/warn
	•	sampled events
	•	specific buckets intended for export
	•	clarify “best-effort clone” limitations and fallbacks.

5.2 Console Printing Guidance

Document that console output is often the main bottleneck:
	•	recommend console off by default for high-volume
	•	show sampling patterns for console printing (implemented by user)

⸻

6. Testing

6.1 Unit Tests (Minimal Matrix)

Coverage for:
	•	ring ordering correctness and overwrite behavior
	•	get() filter semantics:
	•	header/body routing
	•	predicates (function values)
	•	limit/since
	•	clone precedence:
	•	Manager default → bucket override → per-call override
	•	name validation:
	•	numeric coercion
	•	invalid inputs
	•	die flag behavior
	•	workspace behavior:
	•	keyed-nuke semantics
	•	“not keyed means unchanged” behavior in configure paths

6.2 Deterministic Test Clock
	•	Provide a simple deterministic clock helper for repeatable tests:
	•	manual tick advancement
	•	predictable header.at/lastAt/delta

⸻

7. Tooling & Debugging Aids
	•	Optional debug mode:
	•	verbose lifecycle logging
	•	record shape inspection helper
	•	Optional “snapshot” helpers for UI console:
	•	current buffer size
	•	ring cursor info (internal-only if desired)

⸻

8. Non-Goals (Explicit)

The following are explicitly out of scope unless requirements change:
	•	Built-in transport/uploader
	•	Built-in retry/backoff, batching queues, or persistent outboxes
	•	Distributed logging / multi-process coordination
	•	Guaranteed delivery or exactly-once semantics
	•	Mandatory deep cloning or schema enforcement

⸻

Status

All items in this document are wishlist / future enhancements.
They should not block shipping, testing, or adoption of the current log primitive.

# --- end: wishlist.md ---

