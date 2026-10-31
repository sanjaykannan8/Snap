// Client-side stand-in for the hosted decision model. The real service scores every
// skill's name + description against the problem with Clef-flash in a single pass;
// here we approximate that with weighted term overlap + softmax so the UI behaves
// the same way (probabilities that sum to 1, a confidence threshold, one winner).

export type Skill = {
  id: string
  name: string
  description: string
  body: string
  owner: string
  updated: string
  calls: number
}

export type Score = { skill: Skill; p: number }

export type Route = {
  scores: Score[]
  winner: Skill | null
  top: number
  latencyMs: number
}

export const MAX_SKILLS = 64
export const DEFAULT_THRESHOLD = 0.42

export const SEED_SKILLS: Skill[] = [
  {
    id: "pdf-extract",
    name: "pdf-extract",
    description:
      "Extract text, tables and form fields from PDF files, including scanned PDFs that need OCR.",
    body: "# pdf-extract\n\nUse pdfplumber for text and tables. Fall back to OCR (tesseract) when a page has no text layer…",
    owner: "Priya",
    updated: "2h ago",
    calls: 1284,
  },
  {
    id: "sql-review",
    name: "sql-review",
    description:
      "Review SQL queries and database migrations for slow joins, missing indexes and N+1 query patterns.",
    body: "# sql-review\n\n1. Run EXPLAIN ANALYZE on every changed query.\n2. Flag sequential scans on tables over 10k rows…",
    owner: "Marco",
    updated: "1d ago",
    calls: 932,
  },
  {
    id: "release-notes",
    name: "release-notes",
    description:
      "Write changelog and release notes from merged pull requests and commits, grouped by feature and fix.",
    body: "# release-notes\n\nGroup merged PRs by label. Lead with user-facing changes; keep internal refactors in a footer…",
    owner: "Ana",
    updated: "3d ago",
    calls: 611,
  },
  {
    id: "react-a11y",
    name: "react-a11y",
    description:
      "Audit React components for accessibility: keyboard navigation, focus, aria labels and colour contrast.",
    body: "# react-a11y\n\nCheck every interactive element is reachable by Tab, has a visible focus ring and an accessible name…",
    owner: "Priya",
    updated: "5h ago",
    calls: 744,
  },
  {
    id: "csv-clean",
    name: "csv-clean",
    description:
      "Clean messy CSV and spreadsheet data: fix headers, dedupe rows, normalise dates and currency columns.",
    body: "# csv-clean\n\nLoad with pandas, sniff the delimiter, then normalise headers to snake_case…",
    owner: "Leo",
    updated: "6d ago",
    calls: 498,
  },
  {
    id: "incident-postmortem",
    name: "incident-postmortem",
    description:
      "Run an incident response and write a blameless postmortem with timeline, root cause and action items.",
    body: "# incident-postmortem\n\nBuild the timeline from alerts and chat first, then work backwards to the trigger…",
    owner: "Marco",
    updated: "2w ago",
    calls: 203,
  },
  {
    id: "stripe-webhooks",
    name: "stripe-webhooks",
    description:
      "Implement and debug Stripe webhook handlers: signature verification, retries and idempotent payment events.",
    body: "# stripe-webhooks\n\nAlways verify the Stripe-Signature header with the raw body before parsing JSON…",
    owner: "Leo",
    updated: "4d ago",
    calls: 377,
  },
  {
    id: "docker-debug",
    name: "docker-debug",
    description:
      "Debug Docker builds and containers: failing layers, image size, networking and crashing containers.",
    body: "# docker-debug\n\nReproduce with --progress=plain --no-cache, then bisect the failing layer…",
    owner: "Ana",
    updated: "1w ago",
    calls: 455,
  },
]

const STOP = new Set(
  "a an and are as at be by for from has have how i in is it its my of on or our that the this to we with you your can do does need want please help me some".split(
    " ",
  ),
)

function terms(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 ? t.replace(/(ing|ed|es|s)$/, "") : t))
}

function overlap(problem: string[], skill: Skill) {
  const name = new Set(terms(skill.name))
  const desc = new Set(terms(skill.description))
  let score = 0
  for (const t of problem) {
    if (name.has(t)) score += 2.4
    else if (desc.has(t)) score += 1
    else if ([...desc].some((d) => d.length > 3 && (d.startsWith(t) || t.startsWith(d)))) score += 0.5
  }
  return score
}

export function route(problem: string, skills: Skill[], threshold = DEFAULT_THRESHOLD): Route {
  const q = terms(problem)
  // "none of the above" competes like any other option, which is what makes the
  // out-of-scope check meaningful instead of always picking something.
  const raw = skills.map((s) => overlap(q, s))
  const noneLogit = 1.1
  const temp = 0.9
  const exps = raw.map((r) => Math.exp(r / temp))
  const noneExp = Math.exp(noneLogit / temp)
  const total = exps.reduce((a, b) => a + b, 0) + noneExp
  const scores = skills
    .map((skill, i) => ({ skill, p: exps[i]! / total }))
    .sort((a, b) => b.p - a.p)

  const top = scores[0]?.p ?? 0
  // Deterministic-looking latency around the 38.8 ms median Cloudflare reports.
  const seed = [...problem].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7)
  const latencyMs = Math.round((31 + (seed % 170) / 10 + skills.length * 0.08) * 10) / 10

  return {
    scores,
    winner: q.length > 0 && top >= threshold ? scores[0]!.skill : null,
    top,
    latencyMs,
  }
}

// Minimal SKILL.md frontmatter reader: name + description are all the router needs.
export function parseSkillMd(text: string): Pick<Skill, "name" | "description" | "body"> | null {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return null
  const fields: Record<string, string> = {}
  for (const line of match[1]!.split("\n")) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (kv) fields[kv[1]!] = kv[2]!.replace(/^["']|["']$/g, "").trim()
  }
  if (!fields.name || !fields.description) return null
  return { name: fields.name, description: fields.description, body: match[2]!.trim() }
}
