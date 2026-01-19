# auto.js Integration Reference

`auto.js` is an **optional** convenience layer that registers IntervalManager into the `m7-lib` global (`window.lib`) so you can create managers via a short, ergonomic shortcut:

```js
const manager = new lib.interval.manager();
```

If you do **not** include `auto.js`, you can still use the library normally via imports / script tags:

```js
const manager = new IntervalManager();
```

---

## What `auto.js` does

When loaded, `auto.js`:

1. Ensures the `lib.interval` namespace exists on `window.lib`
2. Registers a factory function (constructor wrapper) at:

   * `lib.interval.manager`
3. Optionally exposes the `ManagedInterval` and/or `IntervalManager` constructors under `lib.interval` (depending on how you choose to export)

The intent is:

* **Zero-config convenience** for browser script-tag usage
* **Consistent discovery surface** under `lib.interval.*`

---

## Requirements

* `m7-lib` **v0.98+** must be loaded first
* `auto.js` must be loaded **after** `m7-lib` and after the IntervalManager source files

Recommended script order:

```html
<!-- Load m7-lib (module or classic build) -->
<script src="/lib/m7-lib.min.js"></script>

<!-- Then load auto.js as a module -->
<script type="module" src="/lib/interval/auto.js"></script>
```

---

## Usage

### Basic

```js
const manager = new lib.interval.manager({
  pauseWhenHidden: true,
  pauseWhenOffline: true,
  autoRemove: true
});
```

From here, usage is identical to the standard API:

```js
manager.register({
  name: 'clock',
  everyMs: 1000,
  fn: (ctx) => console.log('tick', ctx.runs)
});

manager.start('clock');
```

---

## Troubleshooting

| Symptom                                  | Likely Cause                            | Fix                                       |
| ---------------------------------------- | --------------------------------------- | ----------------------------------------- |
| `lib is undefined`                       | `m7-lib` not loaded, or loaded too late | Load `m7-lib` first                       |
| `lib.hash.set is not a function`         | Wrong `m7-lib` version                  | Use `m7-lib` ≥ 0.98                       |
| `lib.interval` missing                   | `auto.js` not included                  | Add `auto.js` after IntervalManager files |
| `lib.interval.manager is not a function` | Script order issue                      | Ensure `auto.js` loads last               |

---

## Notes

* `auto.js` is intentionally small and should remain dependency-light.
* In module/bundler environments, you typically do **not** need `auto.js`.

---

## Related Docs

* **Installation** → [`INSTALLATION.md`](../usage/INSTALLATION.md)
* **Quick Start** → [`QUICKSTART.md`](../usage/QUICKSTART.md)
* **IntervalManager API** → [`INTERVAL_MANAGER.md`](./INTERVAL_MANAGER.md)
* **ManagedInterval API** → [`MANAGED_INTERVAL.md`](./MANAGED_INTERVAL.md)
