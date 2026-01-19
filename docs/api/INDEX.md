# API Index — m7-js-lib-primitive-log

This directory contains the **spec-style API references** for the log primitive.

If you’re new to the project, start with:

- **Docs TOC** → [../usage/TOC.md](../usage/TOC.md)
- **Quick Start** → [../usage/QUICKSTART.md](../usage/QUICKSTART.md)
- **README** → [../../README.md](../../README.md)

> There is intentionally **no default bucket**. If you only need one stream, instantiate a **Worker** directly.

---

## Core APIs

- **Manager** → [MANAGER.md](./MANAGER.md)  
  Multi-bucket coordinator / routing layer (owns Workers, applies defaults, forwards `log/info/warn/error`).

- **Worker** → [WORKER.md](./WORKER.md)  
  Single log stream (“bucket”) with storage policy, enable gate, optional hooks, and console policy.

- **Record Structure** → [RECORD.md](./RECORD.md)  
  The strict `{ header, body }` record shape, timing metadata, and invariants.

---

## Hooks and Printing

- **Event Handlers** → [EVENT_HANDLERS.md](./EVENT_HANDLERS.md)  
  Defines `onEvent` and `onPrint` semantics (sync, best-effort, never awaited).

---

## Integration

- **auto.js** → [AUTO.md](./AUTO.md)  
  Optional browser convenience that registers `lib.primitive.log` into `window.lib` (m7-lib).

---

## Contracts

- **Log Primitive API Contract (LLM/tooling-safe)** → [LOG_API_CONTRACT.md](./LOG_API_CONTRACT.md)  
  Source-independent behavioral guarantees intended for tooling, integration layers, and LLM guidance.

---

## Related Usage Docs

- **Installation** → [../usage/INSTALLATION.md](../usage/INSTALLATION.md)
- **Examples Library** → [../usage/EXAMPLES_LIBRARY.md](../usage/EXAMPLES_LIBRARY.md)
- **Advanced Examples** → [../usage/ADVANCED_EXAMPLES.md](../usage/ADVANCED_EXAMPLES.md)
- **Performance Notes** → [../usage/PERFORMANCE.md](../usage/PERFORMANCE.md)

---

## Navigation

- **Up one level (docs/)** → [../usage/TOC.md](../usage/TOC.md)
- **Project root README** → [../../README.md](../../README.md)
