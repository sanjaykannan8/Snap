import { IconFileText, IconKey, IconServer, IconSparkles } from "@tabler/icons-react"

const features = [
  { icon: IconFileText, label: "Your library", title: "Publish a skill once", text: "Upload or paste a SKILL.md. Snap stores the file and uses its name and description for discovery.", detail: "SKILL.md  →  dashboard" },
  { icon: IconServer, label: "Independent service", title: "One MCP tool", text: "Run the Python MCP service separately and scale it independently from the Next.js dashboard.", detail: "get_skill(problem)" },
  { icon: IconKey, label: "Access", title: "A key for each agent", text: "Generate and revoke API keys in the dashboard. Connect Claude Code, Codex, Cursor, or VS Code.", detail: "X-Snap-API-Key" },
  { icon: IconSparkles, label: "Discovery", title: "Return a relevant skill", text: "Choose Cloudflare Workers AI or a local System One-compatible model. A match returns a short-lived URL to its skill file.", detail: "Decision model  →  signed URL" },
]

export function Bento() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {features.map((feature) => (
        <article key={feature.label} className="flex min-h-60 flex-col rounded-3xl border border-border bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4"><span className="text-xs font-semibold tracking-[0.12em] text-brand-ink uppercase">{feature.label}</span><feature.icon className="size-5 text-brand-ink" stroke={1.7} aria-hidden="true" /></div>
          <h3 className="mt-6 text-xl font-semibold tracking-tight">{feature.title}</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{feature.text}</p>
          <p className="mt-auto pt-6 font-mono text-xs text-brand-ink">{feature.detail}</p>
        </article>
      ))}
    </div>
  )
}
