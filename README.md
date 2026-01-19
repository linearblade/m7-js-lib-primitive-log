# Interval Manager

> A **policy-driven async scheduler** for environments where `setInterval` is not safe.

This project exists because **`setInterval` breaks down the moment real-world constraints appear**: async work, overlapping executions, background tabs, offline states, and error handling.

This is **not** a drop-in timer wrapper. It is a systems-level primitive designed to make recurring async work *correct by default*.

---

## Why this exists

If you have ever:

* Had async interval callbacks overlap and corrupt state
* Watched intervals silently die after an exception
* Needed to pause background work when a tab is hidden
* Wanted cancellation *with a reason*, not just a boolean
* Needed backpressure instead of runaway execution

Then you have already discovered the limits of `setInterval`.

This library solves those problems explicitly.

---

## What this library guarantees

* Interval callbacks **never overlap** unless explicitly allowed
* Errors are handled deterministically via **error policies**
* Cancellation always occurs **with a reason**
* Environment changes (hidden / offline / suspended) are enforced consistently
* Internal failures never crash the scheduler
* Observability hooks never interfere with execution

These guarantees are enforced by design, not convention.

---

## Quick example (safe by default)

```js
import { IntervalManager } from 'interval-manager';

const manager = new IntervalManager();

manager.register({
  name: 'health-check',
  everyMs: 1000,
  fn: async () => {
    await fetch('/health');
  }
});
```

**By default this interval:**

* Will never overlap executions
* Will pause when the environment is hidden
* Will not silently die on error
* Can be cancelled with an explicit reason

No extra configuration required.

---

## Core concepts

### IntervalManager

A registry and policy engine responsible for:

* Interval lifecycle management
* Environment enforcement
* Centralized cancellation
* Observability hooks

Think of it as the **control plane**.

### ManagedInterval

A single scheduled task with:

* Overlap policy (`skip`, `coalesce`, `queue`)
* Error policy (`continue`, `pause`, `cancel`, `backoff`)
* Explicit lifecycle state
* Deterministic execution semantics

Think of it as the **execution plane**.

---

## Policies, not flags

This library is intentionally **policy-driven**.

Instead of ad-hoc booleans, you declare intent:

```js
manager.register({
  name: 'sync',
  everyMs: 2000,
  overlap: 'queue',
  maxQueue: 5,
  onError: 'backoff',
  fn: async () => {
    await syncData();
  }
});
```

Policies compose cleanly and behave predictably.

---

## Environment-aware by design

The manager can respond to environment signals such as:

* visibility changes
* offline state
* explicit suspension

```js
manager.updateEnvironment({ visible: false });
```

Intervals are paused and resumed **deterministically**, without losing state or corrupting execution order.

---

## Observability without interference

All lifecycle events emit structured telemetry:

```js
const manager = new IntervalManager({
  onEvent(event) {
    console.log(event.type, event.reason);
  }
});
```

Telemetry errors are swallowed by design. Observability can never destabilize execution.

---

## Features

* Centralized registry for named intervals
* Per-interval policies: overlap (`skip` / `coalesce` / `queue`), error handling (`continue` / `pause` / `cancel` / `backoff`)
* Deterministic lifecycle: start, pause, resume, cancel, dispose
* Environment-aware execution (visibility, offline, suspension)
* Manual triggering (`runNow`) and single-step execution (`step`)
* Mutable per-interval workspace
* Queue limits and backpressure
* Optional custom clock injection (testing / simulation)
* Structured lifecycle telemetry
* Optional auto-removal of completed or cancelled intervals

---

## What this library does *not* do

This project is intentionally scoped.

It does **not**:

* Act as a cron scheduler
* Persist tasks across reloads
* Coordinate across processes or machines
* Attempt to replace job queues or workflow engines

It solves one problem well: **correct recurring async execution in hostile environments**.

---

## Installation

This package is **not yet available via npm or yarn**.

### Recommended (auto.js)

If you are already using **m7-lib**, the simplest setup is:

```html
<script src="/path/to/m7-lib.min.js"></script>
<script type="module" src="/path/to/interval/auto.js"></script>
```

This installs:

```js
lib.interval.manager   // IntervalManager factory
```

### Manual / Module usage

```js
import { IntervalManager } from './lib/interval/IntervalManager.js';
```

> `m7-lib` (v0.98+) is required **only** when using `auto.js`.

---

## Documentation

Start here if you want to understand *how the system behaves*, not just how to call it.

* **Quick Start** → [`docs/usage/QUICKSTART.md`](docs/usage/QUICKSTART.md)
* **Why not setInterval?** → [`docs/WHY_NOT_SETINTERVAL.md`](docs/WHY_NOT_SETINTERVAL.md)
* **Examples Library** → [`docs/usage/EXAMPLES_LIBRARY.md`](docs/usage/EXAMPLES_LIBRARY.md)
* **Installation Details** → [`docs/usage/INSTALLATION.md`](docs/usage/INSTALLATION.md)
* **API Documentation** → [`docs/api/INDEX.md`](docs/api/INDEX.md)

  * **Interval API Contract** → [`docs/api/INTERVAL_API_CONTRACT.md`](docs/api/INTERVAL_API_CONTRACT.md)
  * **IntervalManager API** → [`docs/api/INTERVAL_MANAGER.md`](docs/api/INTERVAL_MANAGER.md)
  * **ManagedInterval API** → [`docs/api/MANAGED_INTERVAL.md`](docs/api/MANAGED_INTERVAL.md)
  * **auto.js integration** → [`docs/api/AUTO.md`](docs/api/AUTO.md)

---

## Portfolio note

This project is designed as a **systems-level scheduling primitive**, not a convenience utility.

It demonstrates:

* Explicit state-machine design
* Policy-driven execution control
* Defensive async programming
* Deterministic lifecycle management
* Clear separation of control and execution planes

The code prioritizes **correctness, clarity, and long-term maintainability** over cleverness.

## License

See [`LICENSE.md`](LICENSE.md) for full terms.

* Free for personal, non-commercial use
* Commercial licensing available under the **M7 Moderate Team License (MTL-10)**

---

## Integration & Support

If you’re interested in commercial usage, integration assistance, or support contracts, contact:

* 📩 [legal@m7.org](mailto:legal@m7.org)

---

## AI Usage Disclosure

See:

* [`docs/AI_DISCLOSURE.md`](docs/AI_DISCLOSURE.md)
* [`docs/USE_POLICY.md`](docs/USE_POLICY.md)

for permitted use of AI in derivative tools or automation layers.

---

## Philosophy

> “Initialize only what you mean to use.”
> Avoid premature assumptions and maintain precise control over application lifecycle stages.

---

## Feedback / Security

* General inquiries: [legal@m7.org](mailto:legal@m7.org)
* Security issues:   [security@m7.org](mailto:security@m7.org)
