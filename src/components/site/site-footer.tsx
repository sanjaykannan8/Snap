import { SnapLogo } from "./logo"

const COLUMNS = [
  { title: "Product", links: [["Dashboard", "/dashboard"], ["How it works", "/#demo"], ["Compare", "/#compare"]] },
  { title: "Developers", links: [["GitHub repository", "https://github.com/sanjaykannan8/Snap"], ["Setup guide", "https://github.com/sanjaykannan8/Snap#quickstart"], ["Limits", "/#faq"]] },
  { title: "Explore", links: [["Who it’s for", "/#who"], ["Questions", "/#faq"]] },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-4">
          <SnapLogo />
          <p className="max-w-xs text-sm text-[#52524C]">A self-hosted skill library for AI agents, served through a standalone MCP service.</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">{col.title}</p>
            {col.links.map(([label, href]) => (
              <a key={label} href={href} data-variant="link" className="text-sm text-[#52524C] hover:text-foreground">
                {label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 border-t border-border px-4 py-6 text-xs text-[#52524C] sm:px-6">
        <span>© 2026 Snap</span>
        <span>Built for agents using remote MCP.</span>
      </div>
    </footer>
  )
}
