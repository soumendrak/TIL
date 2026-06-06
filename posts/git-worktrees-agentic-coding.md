---
title: Git worktrees for agentic AI coding
date: 2026-06-06
tags: [git, agents, workflow]
read: 2
preview: Git worktrees let you check out multiple branches at once in separate directories. Unlike switching branches in a single working tree, worktrees give each branch its own state — no stashing, no conflicts, no context loss. Essential for parallel agentic coding workflows.
---

## Worktree vs branch — what's the difference?

- **Branches** are just pointers to commits. Switching branches changes files in-place in your single working directory.
- **Worktrees** are actual parallel checkouts. Each lives in its own directory but shares `.git/objects` — no duplicate storage.
- Switching branches with `<branches only>` = stashing/committing dirty state + re-indexing by your editor/agent
- Switching between worktrees = just `cd ../other-worktree` — both stay live, both keep their dirty files

## Why agents need worktrees

- **No context switching** — an agent reviewing PR #42 on one branch can keep its state while another agent works on `feat/new-thing` in a separate worktree
- **No interference** — Agent A can `git add`, run tests, leave files dirty. Agent B is unaffected in its own worktree
- **Parallel generative coding** — one agent generates code, another reviews it, a third runs benchmarks. All on different branches, same repo, same time
- **Safe experimentation** — scratch branches in worktrees can be deleted without touching `main` or other active work
- **Zero re-indexing** — each worktree's editor/agent session keeps its own file watcher and index. No "reload workspace" on branch switch

## Quick start

```bash
# One clone, unlimited worktrees
git clone git@github.com:org/repo && cd repo

git worktree add ../repo-review -b review/pr-42    # Review branch
git worktree add ../repo-feat -b feat/new-thing     # Feature branch
git worktree add ../repo-scratch                    # Detached HEAD scratch

# Each is a full checkout in its own directory
cd ../repo-review && ls
cd ../repo-feat  && ls

# Clean up
git worktree remove ../repo-review
git branch -d review/pr-42         # if merged
git worktree prune                 # clean metadata
```

## Watch & learn

- [The best and most unknown Git feature — by ThePrimeagen](https://www.youtube.com/watch?v=2uEqYw-N8uE) — 8 min, practical demo of why worktrees are game-changing
- [learn git worktrees in under 5 minutes — by bashbunni](https://www.youtube.com/watch?v=8vsRb2mTBA8) — 3 min, fast intro with real workflow
- [Git Tutorial #39: how to use git worktree — by GitKraken](https://www.youtube.com/watch?v=s4BTvj1ZVLM) — 11 min, thorough walkthrough of every command
- [Git Worktrees Tutorial #4: Worktree-First Approach — by Net Ninja](https://www.youtube.com/watch?v=O-aBwXN200s) — 8 min, how to build a worktree-first development habit
