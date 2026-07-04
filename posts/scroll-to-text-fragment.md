---
title: Scroll to Text Fragment — link to specific words on any page
date: 2026-07-04
read: 2
tags: [web, html, browsers]
preview: Append #:~:text=... to any URL and the browser scrolls directly to that text, highlighting it — no HTML anchors needed.
---

## The trick

Append `#:~:text=YOUR_TEXT` to any URL and Chromium-based browsers (Chrome, Edge, Brave, Opera) will scroll to and highlight the matching text on the page.

For example, this link jumps straight to "AI Observability" on my About page:
[`soumendrak.com/about/#:~:text=AI%20Observability`](https://soumendrak.com/about/#:~:text=AI%20Observability)

## Why it matters

Most pages don't have HTML anchors on every paragraph. Text fragments let you point someone to your exact evidence or quote without the page author adding anything — the browser does the work.

## Context matching

If the phrase appears multiple times, narrow it with prefix/suffix syntax:

```
#:~:text=prefix-,target,-suffix
```

Example:
`#:~:text=making%20AI%20systems-,observable`

This finds "observable" only when preceded by "making AI systems".

## Browser support

- Chromium (Chrome 80+, Edge 80+, Brave, Opera) — full support with automatic yellow highlight
- Safari / Firefox — silently fall back to loading the page top (the link still works)
- The highlight is temporary (the browser fades it after a few seconds)

## Source

Learned from [mvark.blogspot.com (TIL repo)](https://mvark.blogspot.com/2026/07/how-to-link-directly-to-specific-word.html).
