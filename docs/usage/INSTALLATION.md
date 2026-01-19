# Installation – m7-js-lib-primitive-log

`m7-js-lib-primitive-log` is currently distributed as plain JavaScript files.

It is intentionally small, dependency-light, and does not require a build step.

There are **two supported installation modes**:

1. **Recommended**: `auto.js` integration with **m7-lib** (simplest for browser usage)
2. **Manual / Module** usage without `auto.js` (bundlers, tests, advanced setups)

---

## Prerequisites

* **m7-lib** (latest recommended)
  Required *only* when using `auto.js`. The log primitive registers itself into `window.lib`.

* Modern browser or JS runtime

  * Browsers: Chrome 90+, Firefox 85+, Safari 14.1+, Edge 90+
  * Node / Deno / Bun supported via module usage

---

## Option A – Recommended (auto.js)

This is the simplest setup if you are already using **m7-lib**.

### 1. Project structure (example)

```
your-project/
├── lib/
│   ├── m7-lib.min.js            ← m7-lib
│   └── log/
│       └── auto.js              ← installs the log primitive
├── index.html
└── main.js
```

> You do **not** need to manually load `Manager.js`, `Worker.js`, or other internal files when using `auto.js`.

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

  <!-- Load m7-lib first -->
  <script src="/lib/m7-lib.min.js"></script>

  <!-- Install log primitive into window.lib -->
  <script type="module" src="/lib/log/auto.js"></script>

  <!-- Your application code -->
  <script src="/main.js"></script>
</body>
</html>
```

This installs the following API:

```js
lib.primitive.log
```

Example usage in `main.js`:

```js
const log = new lib.primitive.log.Manager();

log.createBucket('app');
log.log('app', 'application started');
```

---

## Option B – Manual / Module Usage (no auto.js)

Use this approach for bundlers, tests, Node.js, or environments without `m7-lib`.

### 1. Copy files

```
lib/log/
├── Manager.js
├── Worker.js
├── constants.js
├── utils.js
└── (optional index.js)
```

You may also vendor only the files you actually need.

---

### 2. Import directly

```js
import { Manager, Worker } from './lib/log/index.js';

const log = new Manager();

log.createBucket('errors');
log.log('errors', new Error('boom'));
```

> `m7-lib` is **not required** in this mode.

---

## Tree-shaking & bundlers

The manual/module form is friendly to bundlers:

* No side effects
* No global registration
* No hidden async work

Only the code you import is included.

---

## Troubleshooting

| Symptom                        | Likely Cause                             | Fix                          |
| ------------------------------ | ---------------------------------------- | ---------------------------- |
| `lib.primitive` is undefined   | `auto.js` not loaded or loaded too early | Ensure `m7-lib` loads first  |
| `Manager is not a constructor` | Import path incorrect                    | Verify file paths / index.js |
| No console output              | Console printing disabled by default     | Enable `console` per Worker  |
| Missing records                | Worker disabled or ring buffer overflow  | Check Worker config          |

---

## TypeScript users (optional)

No official `.d.ts` files are provided yet.

Minimal workaround:

```ts
declare module './lib/log/index.js' {
  export class Manager {}
  export class Worker {}
}
```

Most editors will still provide good inference via JSDoc.

---

## Future npm support

If this package is published in the future (name TBD):

```bash
npm install m7-js-lib-primitive-log
```

```js
import { Manager } from 'm7-js-lib-primitive-log';
```

---

## Related Docs

* **Quick Start** → [`QUICKSTART.md`](./QUICKSTART.md)
* **Examples** → [`EXAMPLES_LIBRARY.md`](./EXAMPLES_LIBRARY.md)
* **API Docs** → [`../api/INDEX.md`](../api/INDEX.md)
