# Why IntervalManager (instead of `setInterval`)?

`setInterval` is fine for simple demos.

But in real applications, repeating work tends to collide with:

* async functions that take longer than the interval
* intermittent network failures
* background tabs and sleeping devices
* multiple independent timers fighting for attention
* lack of centralized visibility (what is running, why, and for how long?)

IntervalManager exists to make recurring work **predictable, observable, and controllable**.

---

## The core problem: `setInterval` has no lifecycle model

With `setInterval`, you get one primitive:

```js
const id = setInterval(fn, 1000);
```

You do *not* get:

* a name
* a registry
* a state machine (running/paused/cancelled)
* a consistent way to pause based on environment
* built-in concurrency handling for async work
* backoff for failures
* structured telemetry

Most real apps end up reinventing these pieces—usually in inconsistent ways.

---

## 1) Overlap and async: the "double-run" bug

If your interval work is async and sometimes takes longer than the interval duration, `setInterval` will happily fire again while the previous run is still inflight.

That can create:

* duplicated requests
* race conditions
* corrupt shared state
* cascading load under slow conditions

### With `setInterval`

```js
setInterval(async () => {
  await fetch('/api/poll');
}, 1000);
```

If the network stalls for 3 seconds, you can get **3 concurrent runs**.

### With IntervalManager

You pick an overlap policy:

* `skip` → drop ticks while inflight
* `coalesce` → collapse multiple ticks into **one** follow-up run
* `queue` → retain multiple ticks up to a cap

This turns a chaotic concurrency situation into an explicit choice.

---

## 2) Environment awareness: stop working when it doesn’t matter

Modern browsers throttle background tabs. Devices go to sleep. Connectivity drops.

With `setInterval`, your timer doesn’t know (or care):

* whether the tab is visible
* whether the device is offline
* whether your app is in a suspended state

So you waste work—or worse, you behave unpredictably.

### IntervalManager makes environment gating first-class

At the manager level you can say:

* pause when hidden
* pause when offline
* pause when suspended

And per interval you can override:

* `runWhenHidden: true`
* `runWhenOffline: true`

So your app behaves intentionally rather than incidentally.

---

## 3) Failure handling: backoff is not optional in production

Real tasks fail.

With `setInterval`, a failed request just fails—then the timer fires again anyway.

This can create:

* repeated hammering of a failing endpoint
* wasted battery
* amplified outages

### IntervalManager includes an error policy

You can configure:

* `continue` (default) → keep going
* `pause` → stop until resumed
* `cancel` → permanent shutdown
* `backoff` → increase delay after failures, then recover after a success

Backoff is a first-class behavior instead of something you bolt on later.

---

## 4) Observability: "what’s running right now?"

When a system has multiple timers, debugging becomes a guessing game:

* Which timer is still active?
* Which one is stuck?
* Why did it stop?
* How many times has it run?
* When will it run next?

### IntervalManager provides a registry and snapshots

* `manager.list()` → which intervals exist
* `manager.snapshot()` → serializable runtime state
* `onEvent` hook → structured lifecycle events

You can log, inspect, and reason about recurring work as a system.

---

## 5) Lifecycle: start/pause/resume/cancel as explicit operations

`setInterval` gives you:

* start
* stop

Everything else (pause, resume, step, run once, cancel permanently) is a custom pattern.

IntervalManager adds explicit lifecycle controls:

* `start()` / `resume()`
* `pause()`
* `cancel()`
* `stopAll()`
* `dispose()`

Plus development/debug helpers:

* `runNow()`
* `step()`

---

## The mental model

If `setInterval` is a raw timer primitive,
IntervalManager is a *small scheduler* with:

* named tasks
* policy surfaces (overlap, error, environment)
* introspection
* safe teardown

That’s why it exists.

---

## When you *should* still use `setInterval`

Use `setInterval` when:

* the work is tiny and synchronous
* overlap can’t happen
* you don’t care about visibility/offline behavior
* you don’t need debugging or observability

In other words: small scripts, demos, throwaways.

---

## Where to go next

* **Quick Start** → [`QUICKSTART.md`](./usage/QUICKSTART.md)
* **Examples Library** → [`EXAMPLES_LIBRARY.md`](./usage/EXAMPLES_LIBRARY.md)
* **API Docs** → [`INDEX.md`](./api/INDEX.md)
