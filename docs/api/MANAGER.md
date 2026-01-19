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
