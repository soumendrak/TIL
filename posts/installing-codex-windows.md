---
title: Installing Codex CLI on Windows
date: 2026-07-02
read: 1
tags: [cli, windows, tools]
preview: The best way to install OpenAI Codex on Windows is pnpm install -g @openai/codex. And the equivalent of claude --dangerously-skip-permissions is codex -a never.
---

The `claude` CLI has `--dangerously-skip-permissions` for auto-yes mode. Codex does the same with:

```bash
codex -a never
```

Where `-a` is short for `--auto-approve` and `never` means never ask for permission to run any command.

Best way to install it on Windows:

```bash
pnpm install -g @openai/codex
```

Then you're good to go.
