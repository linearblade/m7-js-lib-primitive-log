# API Documentation

This section contains the spec-style API references for the IntervalManager system.

If you’re new, start with **Quick Start** first:

* [`QUICKSTART.md`](../usage/QUICKSTART.md)

---

## Core APIs

* **IntervalManager** → [`INTERVAL_MANAGER.md`](./INTERVAL_MANAGER.md)

  * Register and manage named intervals
  * Bulk lifecycle control and environment gating
  * Telemetry hooks and snapshots

* **ManagedInterval** → [`MANAGED_INTERVAL.md`](./MANAGED_INTERVAL.md)

* Per-interval configuration and execution engine
  * Overlap policies (`skip`, `coalesce`, `queue`)
  * Error policies (`continue`, `pause`, `cancel`, `backoff`)
  * Signals, stepping, rescheduling, workspace

---

## API Contracts (LLM / Tooling)

These documents define **public, source-independent API contracts** intended for
LLMs, tooling, and integration systems that must rely on *behavioral guarantees*
rather than implementation details.

- **Interval API Contract (LLM-safe)** → [`INTERVAL_API_CONTRACT.md`](./INTERVAL_API_CONTRACT.md)
  - docs/api/INTERVAL_API_CONTRACT.md

---

## Integration

* **auto.js** → [`AUTO.md`](./AUTO.md)

  * Installs `lib.interval.manager()` into `m7-lib`
  * Requires only `m7-lib` + `auto.js` (module)

---

## Usage Docs

* **Installation** → [`INSTALLATION.md`](../usage/INSTALLATION.md)
* **Quick Start** → [`QUICKSTART.md`](../usage/QUICKSTART.md)
* **Examples Library** → [`EXAMPLES_LIBRARY.md`](../usage/EXAMPLES_LIBRARY.md)
* **Usage Guide / TOC** → [`TOC.md`](../usage/TOC.md)
