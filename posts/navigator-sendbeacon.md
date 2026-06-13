---
title: navigator.sendBeacon() — reliable data send on page unload
date: 2026-06-13
read: 2
tags: [web, observability, telemetry]
preview: Before sendBeacon, sending telemetry on page close was unreliable — async fetch got cancelled, sync XHR blocked UX. sendBeacon guarantees the request goes through even on tab close. Essential for any web-based observability pipeline.
---

## The problem (before)

You want to fire a telemetry ping when the user leaves the page — session duration, scroll depth, last interaction. All the old approaches had flaws:

- **Async fetch / XHR** — browser cancels pending requests on unload. ~30% data loss in practice.
- **Sync XHR** — blocks the unload. Users feel the lag. Lighthouse penalises it.
- **Image pixel hack** — `<img src="/track?data=...">` — works sometimes, GET-only, ugly.

```js
// Before — unreliable, data gets silently dropped
window.addEventListener('unload', () => {
  fetch('/api/track', { data: payload }); // cancelled by browser ⚠️
});
```

## The fix (after)

`navigator.sendBeacon()` queues the data and the browser commits to delivering it — even after the page is gone.

```js
// After — browser guarantees delivery
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    navigator.sendBeacon('/api/track', JSON.stringify(payload));
  }
});
```

POST only, 64KB cap, fire-and-forget. Pair it with `visibilitychange` (not `unload`) for mobile coverage.

## Why it matters for observability

If you're building web-based instrumention — agent dashboards, trace viewers, user analytics — `sendBeacon` closes a blind spot. Telemetry sent during page teardown was the data you were most likely to lose, and it's often the most important: the crash, the rage quit, the last interaction before the user left.

In agent observability specifically: if you have a web UI that displays agent traces, `sendBeacon` lets you flush user interaction telemetry (which traces they viewed, how long they spent debugging) without worrying about the browser killing the request when they navigate to the next page.
