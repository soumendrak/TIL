window.TILS = [
  { slug:"otel-llm-agents", title:"Using OTel to trace LLM agent calls", date:"2026-05-18", read:4, tags:["observability","otel","llm"],
    preview:"Wrap each tool call in a span with gen_ai.* attributes — SigNoz picks them up out of the box and you get a real waterfall instead of a wall of logs." },
  { slug:"docker-buildx-cache", title:"Docker buildx with multi-arch registry cache", date:"2026-05-15", read:3, tags:["docker","ci"],
    preview:"--cache-to type=registry,ref=...,mode=max gives you per-arch layer cache that survives across GitHub Actions runners. Build times dropped 6x." },
  { slug:"python-contextvars", title:"Python contextvars for async trace context", date:"2026-05-12", read:5, tags:["python","async","observability"],
    preview:"contextvars.ContextVar propagates per-task. Threading-locals don't. If your trace IDs leak between requests, this is the bug." },
  { slug:"k8s-ephemeral-debug", title:"Kubernetes ephemeral debug containers", date:"2026-05-10", read:2, tags:["kubernetes","debug"],
    preview:"kubectl debug -it pod/x --image=busybox --target=app shares the process namespace — no rebuild, no sidecar, no SSH." },
  { slug:"gha-reusable-workflows", title:"GitHub Actions reusable workflows beat composite actions", date:"2026-05-08", read:3, tags:["github-actions","ci"],
    preview:"workflow_call gets you secrets inheritance and matrix outputs. Composite actions can't. Stop reaching for composite." },
  { slug:"ts-satisfies", title:"TypeScript 'satisfies' is the missing operator", date:"2026-05-05", read:3, tags:["typescript"],
    preview:"It validates against a type without widening the inferred one. Config objects keep literal keys — autocomplete still works." },
  { slug:"rust-wasm-bindgen", title:"Rust + WASM with wasm-bindgen, minimal setup", date:"2026-05-03", read:6, tags:["rust","wasm"],
    preview:"cargo install wasm-pack, add [lib] crate-type, and you can call Rust from a Vite app in 20 lines of glue." },
  { slug:"signoz-vs-tempo", title:"SigNoz vs Grafana Tempo for self-hosted tracing", date:"2026-04-28", read:7, tags:["observability","signoz"],
    preview:"Tempo is cheaper at scale. SigNoz ships the UI. For <50 services on one team, SigNoz wins on operator-hours." }
];
