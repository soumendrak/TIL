---
title: Git worktrees for agentic coding with Conductor IDE
date: 2026-06-06
tags: [git, agents, tools]
read: 3
preview: Git worktrees let you check out multiple branches simultaneously without switching or stashing. For agentic coding with Conductor-style workflows, this means each agent gets its own isolated working tree while sharing a single clone — no interference, no context switching.
---

`git worktree` is one of those features you don't need until you do, and when you do, it changes how you think about parallel workflows.

## The problem

Agentic coding tools (Claude Code, Codex CLI, and Conductor-style setups) often work in multiple branches simultaneously — reviewing PRs, making fixes, running experiments. With a single working tree, each branch switch requires:

- Stashing or committing uncommitted changes
- Full re-indexing by your editor/agent
- Losing the mental context of the previous branch

If an agent is doing code review on `main` while generating code on `feat/new-thing`, you can't easily keep both states ready.

## What `git worktree` does

```bash
# Add a new worktree at ../my-repo-feature pointing to a new branch
git worktree add ../my-repo-feature feat/new-thing

# List all worktrees
git worktree list
```

Each worktree is a fully functional checkout in its own directory. They share the same `.git` objects — no duplicate storage — but have independent working directories, indexes, and staged changes.

```bash
/path/to/main-repo      (main branch)
/path/to/../review-pr   (pr/42 branch)
/path/to/../experiment  (feat/new-thing branch)
```

All three are live at once. `git commit` in one doesn't affect the others.

## How Conductor IDE uses this

The [Conductor](https://github.com/S-Nakamur-a/conductor) pattern (popularized by a Rust-based TUI that wires Claude Code + worktrees) works like this:

1. **One worktree per agent task** — each Claude Code or Codex session gets its own directory with the branch it needs
2. **No state conflicts** — agents can `git add`, `git commit`, run tests, or leave dirty trees without blocking each other
3. **Fast context switching** — opening a new worktree takes milliseconds; no re-indexing needed
4. **Clean isolation** — if an agent corrupts its working tree, the other worktrees are unaffected

The [devdepot-ai/conductor](https://github.com/devdepot-ai/conductor) JetBrains plugin takes the same idea into the IDE — parallel workspaces for AI agents that share a repo root but operate on different branches simultaneously.

## Practical usage for agentic workflows

```bash
# Clone once
git clone git@github.com:org/repo && cd repo

# Worktree for a feature branch
git worktree add ../repo-feature -b feat/new-thing

# Worktree for reviewing a PR
git worktree add ../repo-review -b pr/42

# Worktree for experiments
git worktree add ../repo-exp -b exp/scratch

# An agent can work in each without touching the others
cd ../repo-feature && code .   # Agent A
cd ../repo-review && code .    # Agent B (or same agent, different session)

# Clean up when done
git worktree remove ../repo-feature
git branch -d feat/new-thing   # if merged
```

## Caveats

- Worktrees in the same repo share refs — deleting a branch in one affects all
- Large repos mean large `.git` — but objects are shared, so it's mostly just working-tree overhead
- Some tools (linters, build systems) cache by absolute path — you may need separate caches per worktree
- `git worktree prune` to clean up orphaned worktree metadata after deleting a worktree directory
