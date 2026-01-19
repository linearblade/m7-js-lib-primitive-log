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
