import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TIL — Soumendra · Design Prototypes" },
      { name: "description", content: "Three design prototypes for til.soumendra.net — a Today I Learned micro-blog." },
    ],
  }),
  component: Landing,
});

const prototypes = [
  {
    id: "a",
    name: "Terminal",
    tag: "Developer-focused",
    desc: "Monospace, green-on-black, terminal aesthetics. Topics as $ commands. Status bar at the bottom.",
    accent: "#22d36f",
    bg: "#0a0e0a",
  },
  {
    id: "b",
    name: "Notion-like",
    tag: "Clean & editorial",
    desc: "Sans-serif, sticky topic sidebar, soft cards, colored pill tags, reading progress on TIL pages.",
    accent: "#2f6fed",
    bg: "#fafafa",
  },
  {
    id: "c",
    name: "Dev Journal",
    tag: "Hybrid",
    desc: "Topic cloud on the left, scrollable feed on the right. Search, random TIL, list/grid toggle.",
    accent: "#ff7a45",
    bg: "#141221",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-semibold tracking-tight">til.soumendra.net</span>
            <span className="text-xs text-muted-foreground">design prototypes</span>
          </div>
          <a
            href="https://til.simonwillison.net/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            inspired by simonw ↗
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Three directions for a TIL micro-blog.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Each prototype ships a homepage, a topic page, and a single-TIL page —
          all with working dark/light themes and zero framework rendering.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {prototypes.map((p) => (
            <a
              key={p.id}
              href={`/prototype-${p.id}/index.html`}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="flex h-40 items-center justify-center text-5xl font-bold"
                style={{ background: p.bg, color: p.accent }}
              >
                {p.name[0]}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Prototype {p.id.toUpperCase()} · {p.name}</h2>
                </div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.tag}</p>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
                <div className="mt-auto flex gap-3 pt-3 text-xs">
                  <span className="text-foreground/70 group-hover:text-foreground">Home →</span>
                  <a
                    href={`/prototype-${p.id}/topic.html`}
                    className="text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Topic
                  </a>
                  <a
                    href={`/prototype-${p.id}/til.html`}
                    className="text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    TIL
                  </a>
                </div>
              </div>
            </a>
          ))}
        </div>

        <section className="mt-20 rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold">About the build</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li>· Static HTML + CSS, vanilla JS only for theme + filter interactions.</li>
            <li>· Theme persisted in <code className="font-mono text-xs">localStorage</code>; inline head-script prevents flash.</li>
            <li>· Sample content hard-coded — wire to GitHub markdown at build time later.</li>
            <li>· Drop into Cloudflare Pages or GitHub Pages as-is.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
