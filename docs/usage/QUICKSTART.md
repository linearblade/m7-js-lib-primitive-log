# Quick Start – IntervalManager

This guide gets you running your first managed interval in under 2 minutes.

## 1. Project Setup (one-time)

Make sure m7-lib ≥ v0.98 is loaded **before** IntervalManager files.

```html
<!-- Load m7-lib first (required) -->
<script src="/path/to/m7-lib-v0.98.min.js"></script>

<!-- Then load IntervalManager files -->
<script src="/path/to/interval/ManagedInterval.js"></script>
<script src="/path/to/interval/IntervalManager.js"></script>

<!-- Recommended: include auto.js for the nice shortcut -->
<script src="/path/to/interval/auto.js"></script>
```

After including `auto.js`, you can use the convenient shortcut:

```js
const manager = new lib.interval.manager();
```

Alternatively, use standard imports (module environments):

```js
import { IntervalManager } from './lib/interval/IntervalManager.js';
const manager = new IntervalManager();
```

## 2. Create & Start a Simple Interval

```javascript
// Option A: Using the lib.interval shortcut (requires auto.js)
const manager = new lib.interval.manager({
  pauseWhenHidden: true,
  pauseWhenOffline: true
});

// Option B: Standard way (works with or without auto.js)
const manager = new IntervalManager({
  pauseWhenHidden: true,
  pauseWhenOffline: true
});

// Register a simple interval
manager.register({
  name: 'clock',
  everyMs: 1000,                  // every second
  runWhenHidden: false,           // pause when tab is not visible
  fn: (ctx) => {
    console.log(`Tick #${ctx.runs}  —  ${new Date().toLocaleTimeString()}`);
    
    // Optional: auto-stop after 8 ticks
    if (ctx.runs >= 8) {
      ctx.cancel('demo finished');
    }
  }
});

// Start it
manager.start('clock');
```

Expected console output:
```
Tick #1  —  14:35:22
Tick #2  —  14:35:23
...
Tick #8  —  14:35:29
```

## 3. Quick Control Examples

### Pause, resume, manual run
```js
manager.pause('clock');         // stop ticking
manager.resume('clock');        // or manager.start('clock')
manager.runNow('clock');        // execute the function right now
```

### Using workspace to keep state
```js
manager.register({
  name: 'counter',
  everyMs: 2500,
  workspace: { value: 0 },
  fn: (ctx) => {
    ctx.workspace.value += 1;
    console.log(`Counter → ${ctx.workspace.value}`);
    if (ctx.workspace.value >= 5) ctx.cancel();
  }
});

manager.start('counter');
```

### Handling errors with backoff
```js
manager.register({
  name: 'risky-task',
  everyMs: 3000,
  errorPolicy: 'backoff',       // automatically increases delay after errors
  fn: (ctx) => {
    if (Math.random() > 0.6) {
      throw new Error('Random failure');
    }
    console.log('Task succeeded');
  }
});

manager.start('risky-task');
```

## 4. Cleanup

```js
// Stop one interval
manager.cancel('clock');

// Stop everything
manager.stopAll();

// Destroy the manager completely (cancels all timers)
manager.dispose();
```

## Next Steps

- Want more realistic examples? → [EXAMPLES_LIBRARY.md](./EXAMPLES_LIBRARY.md)  
  (periodic API polling, user-activity heartbeats, rate-limited jobs, etc.)
- Detailed installation notes & troubleshooting → [INSTALLATION.md](./INSTALLATION.md)
- Full method reference & configuration options → [TOC.md](./TOC.md)

Happy interval managing!

