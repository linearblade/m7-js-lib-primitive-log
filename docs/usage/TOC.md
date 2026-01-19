# Table of Contents – m7-js-lib-primitive-log

This page is the main navigation hub for the **m7-js-lib-primitive-log** documentation.

All links are relative to the `docs/` directory unless otherwise noted.

---

## Getting Started

* **[Quick Start](usage/QUICK_START.md)**
  → Capture your first log records in minutes

* **[Installation](usage/INSTALLATION.md)**
  → auto.js vs module usage, browser vs runtime setup

---

## Core Concepts

* **[Usage Overview](usage/OVERVIEW.md)**
  → Mental model, design guarantees, and data flow

* **[Why a Logging Primitive?](WHY_A_PRIMITIVE.md)**
  → Why capture is separated from transport, policy, and async work

---

## API Reference

* **[API Index](api/INDEX.md)**
  → High-level API map

### Manager

* **[Manager API](api/MANAGER.md)**
  → Bucket registry, defaults, and orchestration

**Key responsibilities:**

* Creating and managing Workers (buckets)
* Applying shared defaults
* Providing a single entrypoint (`log(bucket, data, opts)`)

---

### Worker

* **[Worker API](api/WORKER.md)**
  → Single-stream logging, storage, hooks, and console policy

**Key responsibilities:**

* Synchronous record capture
* Storage policy (unlimited or ring buffer)
* Enable / disable control
* Console emission
* Hooks (`onEvent`, `onPrint`)

---

### Records

* **[Record Structure](api/RECORD.md)**
  → Header/body split, timing metadata, invariants

Covers:

* `header.at`, `header.lastAt`, `header.delta`
* Levels and metadata
* Mutation and cloning behavior

---

## Examples & Patterns

* **[Examples](usage/EXAMPLES.md)**
  → Copy-paste patterns for common logging scenarios

Examples include:

* Error capture
* Burst analysis
* Conditional console logging
* Hook-driven pipelines
* Workspace usage

---

## Integration

* **[auto.js Integration](api/AUTO.md)**
  → Global registration via `m7-lib`

* **[Performance Notes](usage/PERFORMANCE.md)**
  → Hot-path costs, cloning tradeoffs, console impact

---

## Policy & Meta

* **[AI Usage Disclosure](AI_DISCLOSURE.md)**
* **[Use Policy](USE_POLICY.md)**
* **[License](../LICENSE.md)**

---

> Capture first. Decide later.
