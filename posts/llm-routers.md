---
title: "LLM routers: generic prompt-based routing usually isn't worth it"
date: 2026-08-01
read: 3
tags: [llm, observability, routing]
preview: "Generic routers that pick a model from the initial prompt usually fail: prompt complexity is a weak signal, and switching models mid-workflow breaks consistency. Evaluate on real workloads, pin models to roles, treat routing as a versioned product decision."
---

Generic LLM routers that choose a model from the initial prompt are usually not worth the complexity.

## Why they fail

- **Prompt complexity is a poor signal** — the real difficulty often appears only after tools, retrieved context, or codebase exploration.
- **A router needs substantial context** — and potentially a capable model — to decide well, which erodes the expected cost savings.
- **Switching models mid-workflow harms consistency**: output style, reasoning approach, tool behavior, and prompt/cache reuse all suffer.
- **Provider and model behavior change over time** — routing rules and benchmarks become stale.

## What works better

- **Evaluate on real recurring workloads.** Run a sampled "bake-off" across candidate models and pick based on quality, latency, and cost.
- **Keep a small, clearly differentiated model pool** — for example, one strong frontier model plus one fast/cheap model.
- **Pin models to known workflow stages or agent roles** — planner/orchestrator, exploration, extraction, execution — instead of dynamically routing every prompt.
- **Build model choice into the application design** when tasks are predictable. That is closer to orchestration than routing.
- **Keep routing only for practical needs** like provider retry/failover — and account for feature incompatibilities across providers.
- **At high request volumes**, task-specific routing can still pay off. Universal routers generally do not.

The most useful framing for AI-observability work: treat routing as an evaluable, versioned product decision. Capture task type, selected model, quality/eval result, latency, cost, fallback reason, and model version — then improve routing only where the data shows stable gains.
