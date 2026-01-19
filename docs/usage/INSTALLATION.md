# Installation – IntervalManager

IntervalManager is currently distributed as plain JavaScript files (not yet published to npm or any package registry).

There are **two supported installation modes**:

1. **Recommended**: `auto.js` integration with **m7-lib** (simplest for browser usage)
2. **Manual / Module** usage without `auto.js` (bundlers, tests, advanced setups)

---

## Prerequisites

* **m7-lib** version **0.98 or higher**
  Required *only* when using `auto.js`. IntervalManager uses `lib.hash.set` to register itself into `window.lib`.

* Modern browser environment (Chrome 90+, Firefox 85+, Safari 14.1+, Edge 90+ recommended)

---

## Option A – Recommended (auto.js)

This is the simplest and preferred setup if you are already using **m7-lib**.

### 1. Project structure (example)

```
your-project/
├── lib/
│   ├── m7-lib.min.js               ← m7-lib v0.98+
│   └── interval/
│       └── auto.js                 ← installs IntervalManager automatically
├── index.html
└── main.js
```

> You do **not** need to copy or load `IntervalManager.js` or `ManagedInterval.js` manually when using `auto.js`.

---

### 2. HTML setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My App</title>
</head>
<body>

  <!-- Load m7-lib (classic or module build) -->
  <script src="/lib/m7-lib.min.js"></script>

  <!-- Install IntervalManager into window.lib -->
  <script type="module" src="/lib/interval/auto.js"></script>

  <!-- Your application code -->
  <script src="/main.js"></script>
</body>
</html>
```

This installs the following API:

```js
lib.interval.manager   // IntervalManager factory
```

Usage in `main.js`:

```js
const manager = new lib.interval.manager({
  pauseWhenHidden: true,
  pauseWhenOffline: true
});
```

---

## Option B – Manual / Module Usage (no auto.js)

Use this approach for bundlers, tests, or environments without `m7-lib`.

### 1. Copy files

```
lib/interval/
├── IntervalManager.js
├── ManagedInterval.js
└── (optional index.js)
```

### 2. Import directly

```js
import { IntervalManager } from './lib/interval/IntervalManager.js';

const manager = new IntervalManager({
  pauseWhenHidden: true,
  autoRemove: true
});
```

> `m7-lib` is **not required** in this mode.

---

## Troubleshooting

| Symptom                                  | Likely Cause                                   | Fix                                |
| ---------------------------------------- | ---------------------------------------------- | ---------------------------------- |
| `lib.hash.set is not a function`         | Wrong `m7-lib` version                         | Use `m7-lib` ≥ 0.98                |
| `lib.interval` is undefined              | `auto.js` not loaded or loaded before `m7-lib` | Ensure `m7-lib` loads first        |
| `lib.interval.manager is not a function` | `auto.js` not executed as module               | Use `<script type="module">`       |
| Intervals don’t pause when hidden        | Manager or interval override                   | Ensure `pauseWhenHidden !== false` |
| Unexpected interval execution            | `runWhenHidden` / `runWhenOffline` overrides   | Check per-interval config          |

---

## TypeScript users (optional)

No official `.d.ts` files are provided yet.

Minimal workaround:

```ts
declare module './lib/interval/IntervalManager.js' {
  export class IntervalManager {}
  export class ManagedInterval {}
}
```

Alternatively, rely on JSDoc + editor inference.

---

## Future npm support

When published (e.g. `@m7/interval`):

```bash
npm install @m7/interval
```

```js
import { IntervalManager } from '@m7/interval';
```

---

## Related Docs

- **Quick Start** → [`QUICKSTART.md`](./QUICKSTART.md)
- **Examples** → [`EXAMPLES_LIBRARY.md`](./EXAMPLES_LIBRARY.md)
- **API Docs** → [`INDEX.md`](../api/INDEX.md)
