# TIL (Today I Learned) — Writing Skill

## Purpose

Write quick, searchable notes for `til.soumendra.net`. A TIL captures a specific thing you learned — a command, a config fix, an insight. It is NOT a blog post. Keep it short.

## When to Write a TIL

Write a TIL when you:
- Figure out a command or config that took >5 minutes to get right
- Learn something you will need again in 3 months
- Fix a bug that was not obvious
- Discover a better way to do something routine

Do NOT write a TIL for:
- Long-form opinions or tutorials (those go on the blog)
- Weekly reflections (those go in the weekly note)
- Things you are still debugging (write it after you know the answer)

## TIL Format

Every TIL is one Markdown file at `posts/<slug>.md`. The filename is the slug.
It has YAML front matter followed by a Markdown body:

```markdown
---
title: Title: Short and Clear
date: YYYY-MM-DD
tags: [tag1, tag2]
read: 2
preview: One or two sentences. The key insight. No fluff.
---

The body in Markdown. This becomes the article on the post page.
Use ## for section headings, code fences for commands, lists where useful.
```

### Front matter fields

| Field     | Required | Rules |
|-----------|----------|-------|
| `title`   | Yes      | Sentence case. No period at end. Max 80 chars. |
| `date`    | Yes      | Real `YYYY-MM-DD` date. |
| `tags`    | Yes      | List of 1-3 tags. Lowercase kebab-case. Reuse existing tags. |
| `read`    | No       | Reading time in minutes (1-30). Auto-estimated if omitted. |
| `preview` | No       | 1-2 sentences, max 280 chars. Auto-derived from first paragraph if omitted. |

The slug (filename) must be unique kebab-case, 2-5 words.

### Style Rules

- **No em dashes (—).** Use periods, commas, or colons.
- **No Oxford comma.** "tracing, metrics and logs" not "tracing, metrics, and logs"
- **Be specific.** "Build times dropped 6x" not "Build times improved significantly"
- **Include concrete values.** Port numbers, flags, versions, error messages.
- **One takeaway per TIL.** If you learned two unrelated things, write two TILs.
- Use `##`/`###` for body headings — `#` is reserved for the page title.

### Tags

Use existing tags when possible. Current tags:

observability, otel, signoz, docker, kubernetes, python, rust, wasm, typescript, llm, ci, github-actions, debug, async

Add a new tag only if the topic is not covered by existing ones. A new tag
works immediately, but to give it a custom icon (instead of the 📝 fallback)
add an entry to the `EMOJI` map in `public/app.js`.

## Agent Procedure

Follow these steps exactly when asked to write or edit a TIL.

1. **Pick a slug.** Kebab-case, 2-5 words, describes the takeaway. This is the
   filename and the URL. Check `posts/` first — if `posts/<slug>.md` already
   exists you are editing, not creating; a duplicate slug fails the build.
2. **Write `posts/<slug>.md`.** Front matter + Markdown body, per the format
   above. `title`, `date` and `tags` are required; omit `read` and `preview`
   unless you have a reason to override the auto-derived values.
3. **Validate:** run `pnpm check`. It prints every problem at once.
   - On `✗ build failed`, read each error, fix the `.md` file, re-run. Do not
     proceed until it prints `✓ N post(s) valid`.
   - `⚠` warnings do not block the build, but address them if quick.
4. **Build:** run `pnpm build`. This regenerates `public/data.js`. Never
   hand-edit `public/data.js` — it is generated from `posts/*.md` by
   `scripts/build.mjs`.
5. **Commit both** the new/changed `.md` file **and** the regenerated
   `public/data.js` (plus any new tag noted below) in the same commit. CI
   fails the deploy if `public/data.js` is stale, so this step is required.

If `posts/` or the build tooling is missing, run `pnpm install` first.

### Validation rules the build enforces (fix before committing)

- `title`, `date`, `tags` present and non-empty; body non-empty.
- `date` is a real `YYYY-MM-DD` calendar date.
- Slug and every tag are lowercase kebab-case; slug is unique.
- `read`, if set, is a whole number 1-30.
- The Markdown body must render. Use `##`/`###`, not `#`, for headings.

## Common TIL Templates

### Config/CLI TIL
```markdown
---
title: Tool: flag does X
date: YYYY-MM-DD
tags: [relevant-tag]
---

`--flag value` fixes Y. Without it, Z happens. Found this after an hour of debugging.
```

### Debugging TIL
```markdown
---
title: Error message: the fix
date: YYYY-MM-DD
tags: [relevant-tag]
---

Error X means Y, not Z. Fix: do A instead of B. Root cause was [one-liner].
```

### Comparison TIL
```markdown
---
title: A vs B for use case
date: YYYY-MM-DD
tags: [relevant-tag]
---

A is better for X (reason). B is better for Y (reason). For our case, pick A because Z.
```

## Local Preview & Deployment

- `pnpm install` once to get build dependencies (use pnpm or bun, never npm).
- `pnpm check` validates every post without writing.
- `pnpm build` regenerates `public/data.js` (commit it alongside the post).
- `pnpm dev` builds then serves the site at http://localhost:8787.

The site auto-deploys via Cloudflare Pages on push to main: CI runs `pnpm check`
and `pnpm build`, verifies the committed `public/data.js` is current, then
deploys `public/`.
