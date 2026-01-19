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
