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
  onEvent(record) {
    const d = record?.header?.delta;
    if (typeof d === 'number' && d >= 0 && d < 5) {
      // <5ms between events: treat as a burst
      // (Keep this lightweight; it runs synchronously.)
      // Example: count bursts
      this._bursts = (this._bursts || 0) + 1;
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
