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

Every TIL is an entry in `public/data.js`. Add it to the array:

```js
{ slug:"short-descriptive-slug", title:"Title: Short and Clear", date:"YYYY-MM-DD", read:N, tags:["tag1","tag2"],
  preview:"One or two sentences. The key insight. No fluff." },
```

### Fields

| Field | Required | Rules |
|-------|----------|-------|
| `slug` | Yes | kebab-case. 2-5 words. Must be unique. |
| `title` | Yes | Sentence case. No period at end. Max 60 chars. |
| `date` | Yes | YYYY-MM-DD format. |
| `read` | Yes | Estimated reading time in minutes. 1-10 range. |
| `tags` | Yes | Array of 1-3 tags. Must match existing tags or add new ones. |
| `preview` | Yes | 1-2 sentences. Max 200 chars. The core takeaway. |

### Style Rules

- **No em dashes (—).** Use periods, commas, or colons.
- **No Oxford comma.** "tracing, metrics and logs" not "tracing, metrics, and logs"
- **Be specific.** "Build times dropped 6x" not "Build times improved significantly"
- **Include concrete values.** Port numbers, flags, versions, error messages.
- **One takeaway per TIL.** If you learned two unrelated things, write two TILs.

### Tags

Use existing tags when possible. Current tags:

observability, otel, signoz, docker, kubernetes, python, rust, wasm, typescript, llm, ci, github-actions, debug, async

Add a new tag only if the topic is not covered by existing ones.

## Workflow

1. You tell Lili or Nini what you learned
2. The agent drafts the TIL entry
3. You review and approve
4. The agent adds it to `public/data.js` and pushes to GitHub
5. Cloudflare Pages auto-deploys

## Common TIL Templates

### Config/CLI TIL
```
{ slug:"tool-name-flag", title:"Tool: flag does X", date:"YYYY-MM-DD", read:2, tags:["relevant-tag"],
  preview:"--flag value fixes Y. Without it, Z happens. Found this after [time] of debugging." },
```

### Debugging TIL
```
{ slug:"error-symptom-fix", title:"Error Message: Fix", date:"YYYY-MM-DD", read:3, tags:["relevant-tag"],
  preview:"Error X means Y (not Z). Fix: do A instead of B. Root cause was [one-liner explanation]." },
```

### Comparison TIL
```
{ slug:"tool-a-vs-tool-b", title:"A vs B for use case", date:"YYYY-MM-DD", read:5, tags:["relevant-tag"],
  preview:"A is better for X (reason). B is better for Y (reason). For our case, pick A because Z." },
```

## Deployment

The site auto-deploys via Cloudflare Pages on push to main on GitHub.
