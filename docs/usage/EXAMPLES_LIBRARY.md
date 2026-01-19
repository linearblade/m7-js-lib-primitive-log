# Examples Library – IntervalManager

This document collects practical, real-world-ish patterns you can copy-paste and adapt.  
All examples assume you already have a running `IntervalManager` instance called `manager`.

```js
// Common setup (used in most examples below)
const manager = new IntervalManager({
  pauseWhenHidden: true,
  pauseWhenOffline: true,
  autoRemove: true
});
```

## 1. Periodic API Polling with Exponential Backoff on Failure

```js
manager.register({
  name: 'fetch-user-balance',
  everyMs: 30000,                     // poll every 30 seconds normally
  errorPolicy: 'backoff',             // auto-backoff on errors
  runWhenHidden: false,
  runWhenOffline: false,
  workspace: {
    lastBalance: null,
    consecutiveFailures: 0
  },
  fn: async (ctx) => {
    try {
      const response = await fetch('/api/user/balance', { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      ctx.workspace.lastBalance = data.balance;
      ctx.workspace.consecutiveFailures = 0;

      console.log(`Balance updated: ${data.balance}`);
      
      // Optional: act on big changes
      if (data.balance > 10000) {
        ctx.signal('high-balance-alert', { balance: data.balance });
      }
    } catch (err) {
      ctx.workspace.consecutiveFailures++;
      console.warn(`Balance fetch failed (${ctx.workspace.consecutiveFailures}x)`, err);
      // Let errorPolicy='backoff' handle delay increase
    }
  }
});

manager.start('fetch-user-balance');
```

## 2. User Activity Heartbeat (only when tab is active)

```js
manager.register({
  name: 'user-presence',
  everyMs: 60000,                     // report every minute
  runWhenHidden: false,               // pause when tab is backgrounded
  runWhenOffline: false,
  fn: (ctx) => {
    // You might send to analytics, update "last seen", etc.
    fetch('/api/heartbeat', {
      method: 'POST',
      keepalive: true,
      body: JSON.stringify({ ts: ctx.now })
    }).catch(() => {}); // silent fail — don't break the interval

    console.debug('[presence] User is here');
  }
});

manager.start('user-presence');
```

## 3. Throttled Console Logging (dev/debug mode only)

```js
if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
  manager.register({
    name: 'verbose-log-throttle',
    everyMs: 4500,                    // max ~1 log every 4.5 seconds
    overlapPolicy: 'skip',            // drop extra calls during inflight
    fn: (ctx) => {
      console.groupCollapsed(`Verbose tick #${ctx.runs}`);
      console.log('Current route:', window.location.pathname);
      console.log('Memory usage:', performance.memory?.usedJSHeapSize);
      console.groupEnd();
    }
  });

  manager.start('verbose-log-throttle');
}
```

## 4. Idle Timeout Detector + Auto-Logout

```js
manager.register({
  name: 'idle-detector',
  everyMs: 15000,                     // check every 15 seconds
  workspace: { lastActivity: Date.now() },
  fn: (ctx) => {
    const idleMs = ctx.now - ctx.workspace.lastActivity;
    
    if (idleMs > 5 * 60 * 1000) {     // 5 minutes idle
      console.warn('User idle too long → logging out');
      // window.location = '/logout';   // or show modal, etc.
      ctx.cancel('idle timeout reached');
    }
  }
});

// Update last activity on user events
function updateActivity() {
  const interval = manager.get('idle-detector');
  if (interval) {
    interval.workspace.lastActivity = Date.now();
  }
}

['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
  document.addEventListener(evt, updateActivity, { passive: true });
});

manager.start('idle-detector');
```

## 5. Rate-Limited Job Queue (process one item every few seconds)

```js
// Assume you have a queue somewhere
const jobQueue = []; // push jobs with { id, fn }

manager.register({
  name: 'job-processor',
  everyMs: 4000,                      // process one job every 4 seconds
  overlapPolicy: 'skip',
  fn: (ctx) => {
    if (jobQueue.length === 0) return;

    const job = jobQueue.shift();
    console.log(`Processing job ${job.id}`);

    try {
      job.fn();
      console.log(`Job ${job.id} completed`);
    } catch (err) {
      console.error(`Job ${job.id} failed`, err);
      // Optional: re-queue or move to dead-letter
    }
  }
});

manager.start('job-processor');

// Usage elsewhere:
jobQueue.push({
  id: 'send-welcome-email-123',
  fn: () => { /* send email logic */ }
});
```

## 6. One-Time Delayed Notification (fire once after delay)

```js
manager.register({
  name: 'welcome-notification',
  everyMs: 8000,                      // will only run once
  maxRuns: 1,
  fn: (ctx) => {
    alert('Welcome back! You have 3 new messages.');
    // or show toast, etc.
  }
});

manager.start('welcome-notification');
```

## 7. Dynamic Interval Rescheduling (adaptive polling)

```js
manager.register({
  name: 'adaptive-price-check',
  everyMs: 60000,                     // start at 1 min
  fn: (ctx) => {
    // Pseudo-code: check market volatility
    const volatility = Math.random();   // imagine real metric

    if (volatility > 0.8) {
      // high volatility → check more often
      ctx.reschedule(15000);            // next run in 15 seconds
      console.log('High volatility → polling faster');
    } else if (volatility < 0.2) {
      // calm → slow down
      ctx.reschedule(120000);           // next in 2 minutes
      console.log('Market calm → slowing down');
    }
  }
});

manager.start('adaptive-price-check');


## Related Docs

- [Quick Start](./QUICKSTART.md)
- [Installation](./INSTALLATION.md)
- [API Docs](../api/INDEX.md)
