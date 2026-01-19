# auto.js Integration Reference

`auto.js` is an **optional** convenience layer that registers the log primitive into the **m7-lib** global (`window.lib`).

After loading `auto.js`, you can construct a Manager via a short, ergonomic path:

```js
const log = new lib.primitive.log.Manager();
```

If you do **not** include `auto.js`, you can still use the library normally via module imports:

```js
import { Manager } from './log/index.js';

const log = new Manager();
```

---

## What `auto.js` does

When loaded, `auto.js`:

1. Ensures the `lib.primitive.log` namespace exists on `window.lib`
2. Exposes public constructors under that namespace

Typically:

* `lib.primitive.log.Manager`
* `lib.primitive.log.Worker`

The intent is:

* **Zero-config convenience** for browser usage
* A consistent discovery surface under `lib.primitive.log.*`

`auto.js` does **not** change runtime behavior of capture.

It is registration only.

---

## Requirements

* `m7-lib` must be loaded first
* `auto.js` must be loaded **after** `m7-lib`
* `auto.js` should be loaded as a **module**

Recommended script order:

```html
<!-- Load m7-lib (module or classic build) -->
<script src="/lib/m7-lib.min.js"></script>

<!-- Then load auto.js as a module -->
<script type="module" src="/lib/log/auto.js"></script>
```

---

## Usage

### Basic

```js
const log = new lib.primitive.log.Manager();

log.createBucket('app');
log.log('app', 'started');
```

### Direct Worker usage

If you only need one bucket, you can create a Worker directly:

```js
const worker = new lib.primitive.log.Worker({
  console: 'warn'
});

worker.warn('something happened');
```

---

## Troubleshooting

| Symptom                                   | Likely Cause                              | Fix                                              |
| ----------------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| `lib is undefined`                        | `m7-lib` not loaded (or loaded too late)  | Load `m7-lib` first                              |
| `lib.primitive` is undefined              | `auto.js` not loaded, or load order wrong | Ensure `auto.js` loads after `m7-lib`            |
| `Manager is not a constructor`            | Wrong path / export name                  | Verify you are using `lib.primitive.log.Manager` |
| Nothing appears under `lib.primitive.log` | `auto.js` not executed as module          | Use `<script type="module">`                     |

---

## Notes

* `auto.js` should remain dependency-light.
* In module/bundler environments, you typically do **not** need `auto.js`.
* `auto.js` does not introduce any async behavior.

---

## Related Docs

* **Installation** → [../usage/INSTALLATION.md](../usage/INSTALLATION.md)
* **Quick Start** → [../usage/QUICK_START.md](../usage/QUICK_START.md)
* **Manager API** → [MANAGER.md](./MANAGER.md)
* **Worker API** → [WORKER.md](./WORKER.md)
