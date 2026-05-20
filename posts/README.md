# Posts

Every TIL is one Markdown file in this folder. `scripts/build.mjs` validates
each file, renders it, and writes `public/data.js` — the site never reads these
files directly, and `public/data.js` is generated (never edit it by hand).

## Add a post

1. Create `posts/<slug>.md`. The filename is the slug — it must be
   kebab-case (`agent-tool-hallucination.md`) and shows up in the URL.
2. Write front matter + body (see below).
3. Run `pnpm build` — this regenerates `public/data.js`.
4. Commit **both** the `.md` file and the updated `public/data.js`.

`public/data.js` is generated but committed, so a fresh clone and every
deploy path serve a complete site. CI rebuilds it and fails the build if the
committed copy is stale — so always run `pnpm build` before committing.

## File format

```markdown
---
title: Short and clear title
date: 2026-05-21
tags: [llm, observability]
read: 2
preview: One or two sentences with the core takeaway.
---

The post body in **Markdown**. Headings, lists, code fences, links,
blockquotes and images all work.
```

## Front matter fields

| Field     | Required | Rules |
|-----------|----------|-------|
| `title`   | yes      | Sentence case, no trailing period, ≤ 80 chars. |
| `date`    | yes      | Real `YYYY-MM-DD` date. |
| `tags`    | yes      | Non-empty list, each tag lowercase kebab-case. 1-3 is ideal. |
| `read`    | no       | Whole minutes, 1-30. Auto-estimated from word count if omitted. |
| `preview` | no       | ≤ 280 chars. Auto-derived from the first paragraph if omitted. |

The build **fails** (non-zero exit) on any error: a missing required field, a
bad date, a non-kebab-case slug or tag, a duplicate slug, an empty body, or
Markdown that will not render. Warnings (long title, `#` heading in body,
unknown front matter key) are printed but do not fail the build.

Use `##`/`###` for headings inside the body — `#` is reserved for the page
title, which comes from `title`.
