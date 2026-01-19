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
