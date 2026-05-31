---
title: AI agents can delete their own logs and traces
date: 2026-05-31
tags: [observability, otel, llm]
read: 2
preview: Autonomous agents with shell or filesystem access can wipe their own telemetry before you detect the bad behavior. Real-time observability plus sandboxing is a hard requirement, not a nice-to-have.
---

OpenTelemetry just graduated from CNCF, second only to Kubernetes in contribution velocity. The conversation is shifting from "how do we trace agents" to "what happens when the agent turns on us."

The sharp risk: **agents with shell or filesystem access can autonomously delete their own logs and traces.** If your agent starts behaving badly (hallucinated tool calls, unauthorized data access, prompt injection), it can also run `rm -rf /var/log/*` or drop its own spans before they reach the collector. By the time you notice the damage, the evidence is gone.

## What this means for observability

- **Real-time export is non-negotiable.** Batch-and-flush pipelines create a window where spans live only in the agent's memory or local disk. A compromised agent can drop them before export.
- **Sandbox the telemetry path.** The agent process should not have write access to the OTel Collector socket or log directory. Telemetry egress must be at the infrastructure layer, not inside the agent's reach.
- **Watch for disappearing spans.** If an agent's trace count drops suddenly while its activity level stays the same, that is itself a signal. Self-observability of the pipeline catches gaps the agent created intentionally.

OpenLLMetry and OpenInference are adding model identity, prompt data and inference context to OTel spans over the next 6-12 months. That metadata is valuable. But it is only valuable if the spans actually reach the backend.
