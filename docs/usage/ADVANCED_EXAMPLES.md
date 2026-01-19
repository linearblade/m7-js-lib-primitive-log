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

* [Quick Start](./QUICK_START.md)
* [Installation](./INSTALLATION.md)
* [Examples](./EXAMPLES.md)
* [Performance Notes](./PERFORMANCE.md)
* [API Docs](../api/INDEX.md)
