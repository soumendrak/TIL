---
title: Harness, loop and graph engineering
date: 2026-10-08
tags: [llm]
preview: 'Reliable agent work has three design layers: the environment around the model, the feedback cycle it repeats and the graph that makes workflow paths explicit.'
---

Reliable agent work has three distinct engineering layers:

- **Harness engineering** builds the machinery around the model: tools, context, state, permissions and verification.
- **Loop engineering** designs the repeated work-and-feedback cycle: what the agent does, how results are checked and what happens next.
- **Graph engineering** makes the workflow topology explicit: nodes, branches, joins, state transitions and controlled cycles.

A useful mental model is **environment → feedback → flow**. The harness shapes the environment. The loop turns feedback into another attempt. The graph shows how work moves, including where it branches, rejoins or stops.

For example, a coding agent's graph might send a passing test to review, but route a failing test back through diagnosis and repair. The harness supplies the repository and test tools; the loop governs each repair-and-check iteration; the graph makes both paths visible.
