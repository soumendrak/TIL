---
title: Scroll to Text Fragment — link to specific words on any page
date: 2026-07-04
read: 2
tags: [web, html, browsers]
preview: You can link directly to any specific word on a webpage — no anchor tags needed. Just add #:~:text=... at the end of the URL. Chromium browsers will scroll there and highlight it automatically.
---

## The trick

Add `#:~:text=YOUR_TEXT` to the end of any URL. When someone opens the link in Chrome, Edge, Brave, or Opera, the browser scrolls straight to that text and highlights it in yellow — no HTML anchors required.

For example, this link jumps straight to "AI Observability" on my About page:
[`soumendrak.com/about/#:~:text=AI%20Observability`](https://soumendrak.com/about/#:~:text=AI%20Observability)

## Why it matters

Most pages don't put anchors on every paragraph. If you want to send someone to an exact quote or data point, text fragments let you do it without the page author's help — the browser does the work.

## Context matching

If the phrase appears in multiple places, narrow it with prefix/suffix syntax:

```
#:~:text=prefix-,target,-suffix
```

Example:
`#:~:text=making%20AI%20systems-,observable`

This matches "observable" only when it comes right after "making AI systems".

## Browser support

- Chromium (Chrome 80+, Edge 80+, Brave, Opera) — full support with automatic yellow highlight
- Safari / Firefox — silently fall back to the top of the page (the link still works, just no scroll or highlight)
- The highlight fades after a few seconds

## Source

Learned from [mvark.blogspot.com (TIL repo)](https://mvark.blogspot.com/2026/07/how-to-link-directly-to-specific-word.html).
