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
