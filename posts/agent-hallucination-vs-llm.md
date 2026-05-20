---
title: Agent hallucination vs traditional LLM hallucination
date: 2026-05-20
read: 2
tags: [llm, observability]
preview: Agent confidently says it used a tool and the answer is backed by that tool call, but never actually called the tool. It hallucinated the tool call itself. Traditional LLM hallucination is making up facts. Agent hallucination is making up actions.
---

The agent tells you: *I called the search API and the result confirms my answer*. But it never called the API. It fabricated the tool call entirely.

This is different from traditional LLM hallucination where the model makes up facts in its output. Here the model makes up **actions** — it hallucinates having executed a tool that it never touched.

In observability terms: detecting a fake tool call in a trace (span exists but no actual API was hit) requires different instrumentation than detecting a factually wrong response. You need to verify the side effects, not just the output.
