# API Documentation

This section contains the spec-style API references for **m7-js-lib-primitive-log**.

If you’re new, start here:

* [Quick Start](../usage/QUICK_START.md)

---

## Core APIs

* **Manager** → [MANAGER.md](./MANAGER.md)

  * Create and manage named buckets (Workers)
  * Apply shared defaults
  * Single entrypoint for capture: `log(bucket, data, opts)`

* **Worker** → [WORKER.md](./WORKER.md)

  * Single log stream with its own storage policy
  * Enable/disable control
  * Optional hooks (`onEvent`, `onPrint`)
  * Optional console emission policy

* **Record Structure** → [RECORD.md](./RECORD.md)

  * Strict header/body split
  * Timing metadata (`at`, `lastAt`, `delta`)
  * Invariants and portability notes

---

## Integration

* **auto.js** → [AUTO.md](./AUTO.md)

  * Installs `lib.primitive.log` into **m7-lib**
  * Requires only `m7-lib` + `auto.js` (module)

---

## API Contracts (Tooling / LLM)

These documents define **public, source-independent API contracts** intended for
LLMs, tooling, and integration systems that must rely on *behavioral guarantees*
rather than implementation details.

* **Log Primitive API Contract (LLM-safe)** → [LOG_API_CONTRACT.md](./LOG_API_CONTRACT.md)

---

## Usage Docs

* **Installation** → [INSTALLATION.md](../usage/INSTALLATION.md)
* **Quick Start** → [QUICK_START.md](../usage/QUICK_START.md)
* **Examples** → [EXAMPLES.md](../usage/EXAMPLES.md)
* **Advanced Examples** → [ADVANCED_EXAMPLES.md](../usage/ADVANCED_EXAMPLES.md)
* **Performance Notes** → [PERFORMANCE.md](../usage/PERFORMANCE.md)
* **Usage Guide / TOC** → [TOC.md](../usage/TOC.md)
