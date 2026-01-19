# Why Not `console.log`?

`console.log` is fine for quick experiments.

It does not scale as a diagnostic or observability strategy.

---

## 1) Debug prints spread everywhere

`console.log` encourages inline, ad-hoc debugging:

```js
console.log('here');
console.log('there');
console.log('why is this undefined?', x);
```

Over time this leads to:

* Debug prints scattered across the codebase
* No shared structure or naming
* Unclear intent (is this temporary or permanent?)
* Fear of deleting logs "just in case"

A logging primitive centralizes capture so diagnostics are **intentional**, not incidental.

---

## 2) Console buffers are not designed for volume

Browser consoles are optimized for **human interaction**, not sustained throughput.

When too much is printed:

* The console drops messages
* DevTools becomes slow or unstable
* Useful context scrolls out of reach
* Performance suffers (sometimes dramatically)

This is especially painful during bursts or tight loops.

Capturing logs in memory avoids turning the console into a bottleneck.

---

## 3) Console output has no structure

`console.log` gives you text (and sometimes object previews).

It does not give you:

* Consistent timing metadata
* Record structure
* Levels you can reliably filter
* A way to reason about bursts or rates

Once printed, the data is gone.

A structured log record can be inspected, sampled, summarized, or exported later.

---

## 4) On / off control is coarse and global

Your options with `console.log` are usually:

* Delete the line
* Comment it out
* Wrap it in `if (DEBUG)`
* Monkey-patch `console`

These approaches are:

* Global rather than scoped
* Hard to audit
* Easy to forget

With a logging primitive:

* Console output is **off by default**
* Enabled per bucket
* Can be toggled dynamically
* Can coexist with silent capture

---

## 5) Turn debugging into an asset

Well-structured logging is a sign of forethought.

* A complex program with intentional logging shows **design hygiene**
* A complex program with `console.log` sprinkled everywhere shows **debug debt**

When logs are structured, scoped, and capturable:

* They become documentation of system behavior
* They can be analyzed after the fact
* They help future maintainers (including you)

When debug prints are ad-hoc:

* They are noisy
* They are brittle
* They are eventually ignored or deleted

Good logging turns debugging into an **asset**, not an annoyance.

---

## 6) Capture now, decide later

The core problem with `console.log` is that it forces an immediate decision:

> "Should this go to the console?"

Often the real question is:

> "Do I want to observe this *at all*?"

A logging primitive lets you:

* Capture synchronously
* Keep the hot path fast
* Decide later whether to print, sample, export, or drop

Console output becomes **one possible policy**, not the act of logging itself.

---

## When `console.log` is still fine

Use `console.log` when:

* You are experimenting
* The volume is tiny
* The code is throwaway
* You do not need history or structure

It is a tool — just not a system.

---

## The takeaway

`console.log` is a side effect.

A logging primitive is **capture**.

Capture gives you control.

---

> Capture first. Decide later.
