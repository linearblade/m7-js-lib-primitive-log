# Performance Notes – m7-js-lib-primitive-log

This library is designed to be **fast by default** on the hot path.

Performance is a first-class constraint, but it is enforced through **clear responsibility boundaries**, not hidden optimizations.

---

## What the primitive optimizes for

The core guarantees are:

* **Synchronous capture** with predictable cost
* **No hidden async work**
* **Bounded memory** (explicitly configured)
* **Minimal branching** on the hot path

In practice, a log call:

* Creates a small record
* Attaches timing metadata
* Stores it in memory
* Optionally signals hooks

Nothing is awaited. Nothing is scheduled.

---

## What is intentionally *not* optimized

The primitive does **not** attempt to optimize:

* Network transport
* Batching
* Compression
* Sampling strategies
* Backpressure handling
* Persistence

If you choose to ship logs off-process, that cost is **entirely yours by design**.

See **Advanced Examples** for patterns that do this safely.

---

## Console output is the biggest cost

Printing to the console is often **orders of magnitude slower** than capture.

For this reason:

* Console output is **off by default**
* Enabled explicitly per Worker
* Treated as a policy, not logging itself

If performance matters, capture silently and decide later what to print.

---

## Cloning vs references

By default, record bodies are stored **by reference**.

This is the fastest option and avoids unnecessary allocation.

Cloning is:

* Opt-in
* Best-effort
* More expensive

If you enable cloning:

* Prefer selective cloning
* Avoid cloning large objects on hot paths
* Consider cloning only when exporting

---

## Hooks should be tiny

`onEvent` and `onPrint` are synchronous.

They should:

* Do minimal work
* Never block
* Never await

A good rule:

> If it might be slow, enqueue it and return.

---

## Internal storage is diagnostic

Workers retain records primarily for:

* Live inspection
* Debugging
* Front-end diagnostics

You generally do **not** need to drain internal storage when exporting logs.

If memory matters:

* Use a ring buffer
* Keep only recent history

---

## The contract

The library guarantees:

* Fast, predictable capture
* No surprise background work

The user controls:

* Export strategy
* Sampling and dropping
* Backpressure behavior
* Long-term storage

This separation is what keeps the hot path fast.

---

> Capture first. Decide later.
