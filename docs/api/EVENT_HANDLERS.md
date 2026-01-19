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
