"use client"

import {
  IconArrowRight,
  IconFileText,
  IconKey,
  IconLayoutDashboard,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { SnapLogo } from "@/components/site/logo"
import { ApiKeys } from "@/components/dashboard/api-keys"
import { InlineConfirm, PageHeader, Panel, Skeleton } from "@/components/dashboard/primitives"
import { UserMenu } from "@/components/dashboard/user-menu"
import { SoundToggle } from "@/components/ui/sound"
import { MAX_SKILLS, parseSkillMd } from "@/lib/router"
import { cn } from "@/lib/utils"

type Skill = { id: string; name: string; description: string; body: string; createdAt: string }
type View = "library" | "connections"

const NAV: { id: View; label: string; icon: typeof IconLayoutDashboard }[] = [
  { id: "library", label: "Library", icon: IconLayoutDashboard },
  { id: "connections", label: "Connections", icon: IconKey },
]

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
const formatDate = (value: string) => dateFormat.format(new Date(value))

const PLACEHOLDER = "---\nname: my-skill\ndescription: Describe when to use this skill.\n---\n\nAdd your instructions here."

function AddSkill({ onAdd, full, onClose }: { onAdd: (skillMd: string) => Promise<void>; full: boolean; onClose: () => void }) {
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const closeTimer = useRef<number | undefined>(undefined)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
      window.clearTimeout(closeTimer.current)
    }
  }, [onClose])

  async function submit() {
    if (full) return setError(`This library already has ${String(MAX_SKILLS)} skills, the current maximum.`)
    if (!parseSkillMd(text)) return setError("Could not find a name and description in the frontmatter. Start the file with --- name: ... description: ... ---")
    setSaving(true)
    try {
      await onAdd(text)
      setSaved(true)
      closeTimer.current = window.setTimeout(onClose, 350)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save the skill.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 backdrop-blur-[2px] sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-skill-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="add-skill-title" className="text-base font-semibold text-foreground">Add a skill</h2>
            <p className="mt-1 text-sm text-muted-foreground">Paste a SKILL.md. The router reads its <code className="font-mono text-xs">name</code> and <code className="font-mono text-xs">description</code>.</p>
          </div>
          <button type="button" data-slot="dialog-close" aria-label="Close" onClick={onClose} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none">
            <IconX className="size-4" stroke={1.75} aria-hidden="true" />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => { setText(event.target.value); setError(null) }}
          aria-label="SKILL.md contents"
          aria-invalid={error ? true : undefined}
          rows={10}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          className="mt-4 w-full resize-y rounded-xl border border-input bg-muted/40 p-3 font-mono text-xs leading-relaxed outline-none placeholder:text-muted-foreground/70 focus:border-brand focus:bg-card focus:ring-3 focus:ring-brand/20 aria-invalid:border-destructive aria-invalid:ring-destructive/15"
        />
        {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2" data-success={saved ? "true" : undefined}>
          <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40">
            <IconUpload className="size-4" stroke={1.75} aria-hidden="true" />
            Upload file
            <input
              type="file"
              accept=".md,text/markdown,text/plain"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void file.text().then((content) => { setText(content); setError(null) }).catch(() => setError("Could not read that file."))
                event.target.value = ""
              }}
            />
          </label>
          <div className="flex gap-2">
            <button type="button" data-variant="ghost" onClick={onClose} className="h-9 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { void submit() }}
              disabled={saving || saved || !text.trim()}
              className="h-9 rounded-lg bg-brand px-4 text-sm font-medium text-foreground transition-[filter,transform] hover:brightness-105 active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              {saving ? "Saving" : saved ? "Added" : "Add skill"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, hint, children }: { label: string; value: React.ReactNode; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="truncate text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</div>
      {children}
      {hint ? <p className="truncate text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function Library({
  skills,
  loading,
  error,
  onAddClick,
  onRemove,
  onOpenConnections,
}: {
  skills: Skill[]
  loading: boolean
  error: string
  onAddClick: () => void
  onRemove: (id: string) => void
  onOpenConnections: () => void
}) {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? skills.filter((skill) => `${skill.name} ${skill.description}`.toLowerCase().includes(q)) : skills
  }, [skills, query])
  const used = Math.min(100, (skills.length / MAX_SKILLS) * 100)
  const latest = useMemo(() => skills.reduce<string | null>((acc, skill) => (!acc || skill.createdAt > acc ? skill.createdAt : acc), null), [skills])
  const full = skills.length >= MAX_SKILLS

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Library"
        description="The skills your agents can discover through Snap."
        action={
          <button
            type="button"
            disabled={loading || full}
            onClick={onAddClick}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-[background-color,transform] hover:bg-foreground/90 active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            <IconPlus className="size-4" stroke={1.75} aria-hidden="true" />
            Add skill
          </button>
        }
      />

      {error ? <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p> : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section aria-label="Library summary" className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 xl:grid-cols-1">
        <div className="bg-card">
          <Stat label="Skills" value={loading ? <Skeleton className="mt-1 h-7 w-16" /> : <>{skills.length}<span className="ml-1 text-sm font-normal text-muted-foreground">of {MAX_SKILLS}</span></>}>
            <div role="progressbar" aria-label="Library capacity" aria-valuemin={0} aria-valuemax={MAX_SKILLS} aria-valuenow={skills.length} className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-full origin-left rounded-full bg-brand transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${String(used / 100)})` }} />
            </div>
          </Stat>
        </div>
        <div className="bg-card">
          <Stat label="Open slots" value={loading ? <Skeleton className="mt-1 h-7 w-12" /> : MAX_SKILLS - skills.length} hint={full ? "Remove a skill to add another" : "Available for new skills"} />
        </div>
        <div className="bg-card">
          <Stat label="Last added" value={loading ? <Skeleton className="mt-1 h-7 w-28" /> : latest ? formatDate(latest) : "None yet"} hint={latest ? "Most recent skill" : "Add your first skill"} />
        </div>
        <button
          type="button"
          onClick={onOpenConnections}
          className="group flex min-w-0 items-center justify-between gap-3 bg-card p-5 text-left transition-colors hover:bg-brand-soft focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-inset"
        >
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">Agents</span>
            <span className="mt-1 block text-sm font-medium text-foreground">Connect an agent</span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">Create a key and copy its setup</span>
          </span>
          <IconArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-ink motion-reduce:transition-none" stroke={1.75} aria-hidden="true" />
        </button>
      </section>

      <Panel
        title="Skills"
        description={loading ? "Loading your library" : query ? `${String(filtered.length)} of ${String(skills.length)} match` : `${String(skills.length)} in your library`}
        className="xl:order-first"
        bodyClassName="p-0"
        action={
          <label className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-muted/40 px-2.5 transition-[border-color,background-color] focus-within:border-brand focus-within:bg-card focus-within:ring-3 focus-within:ring-brand/20 sm:w-64">
            <IconSearch className="size-4 shrink-0 text-muted-foreground" stroke={1.75} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search skills" aria-label="Search skills" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" />
            {query ? (
              <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground">
                <IconX className="size-3.5" stroke={1.75} aria-hidden="true" />
              </button>
            ) : null}
          </label>
        }
      >
        {loading ? (
          <div aria-busy="true" className="divide-y divide-border">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-3 px-5 py-3.5">
                <Skeleton className="size-9 rounded-lg" />
                <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-40" /><Skeleton className="h-3 w-3/5" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-14 text-center">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <IconFileText className="size-5" stroke={1.5} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{query ? `No skills match "${query}"` : "Your library is empty"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{query ? "Try a different name or keyword." : "Add a SKILL.md to publish your first skill."}</p>
            </div>
            {query ? (
              <button type="button" onClick={() => setQuery("")} className="h-9 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none">Clear search</button>
            ) : (
              <button type="button" onClick={onAddClick} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-sm font-medium text-background transition-[background-color,transform] hover:bg-foreground/90 active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none">
                <IconPlus className="size-4" stroke={1.75} aria-hidden="true" />
                Add skill
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-2.5 font-medium">Skill</th>
                  <th scope="col" className="w-36 px-3 py-2.5 font-medium whitespace-nowrap">Added</th>
                  <th scope="col" className="w-44 px-5 py-2.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((skill) => (
                  <tr key={skill.id} className="transition-colors hover:bg-muted/30">
                    <td className="max-w-0 px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-ink">
                          <IconFileText className="size-4" stroke={1.75} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-mono text-[13px] font-medium text-foreground">{skill.name}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={skill.description}>{skill.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground tabular-nums">{formatDate(skill.createdAt)}</td>
                    <td className="px-5 py-3">
                      <InlineConfirm
                        ariaLabel={`Delete ${skill.name}`}
                        confirmLabel="Delete"
                        icon={<IconTrash className="size-4" stroke={1.75} aria-hidden="true" />}
                        onConfirm={() => onRemove(skill.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      </div>
    </div>
  )
}

export function Dashboard({ mcpUrl }: { mcpUrl: string }) {
  const router = useRouter()

  const [view, setView] = useState<View>("library")
  const [skills, setSkills] = useState<Skill[]>([])
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const closeAdding = useCallback(() => setAdding(false), [])

  useEffect(() => {
    const sync = () => setView(window.location.hash === "#connections" || window.location.hash === "#api-keys" ? "connections" : "library")
    sync()
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [])

  useEffect(() => {
    let active = true
    void fetch("/api/skills", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) { router.replace("/login?next=/dashboard"); return }
        const data = await response.json() as { skills?: Skill[]; error?: string }
        if (!response.ok) throw new Error(data.error ?? "Unable to load your skill library.")
        if (active) setSkills(data.skills ?? [])
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load your skill library.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [router])

  function go(next: View) {
    setView(next)
    window.history.replaceState(null, "", next === "library" ? window.location.pathname : `#${next}`)
    window.scrollTo({ top: 0 })
  }

  async function addSkill(skillMd: string) {
    const response = await fetch("/api/skills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skillMd }) })
    const data = await response.json() as { skill?: Skill; error?: string }
    if (!response.ok || !data.skill) throw new Error(data.error ?? "Unable to save the skill.")
    setSkills((current) => [data.skill!, ...current])
  }

  async function removeSkill(id: string) {
    setError("")
    const response = await fetch(`/api/skills/${id}`, { method: "DELETE" })
    if (!response.ok) { setError("Unable to delete this skill."); return }
    setSkills((current) => current.filter((skill) => skill.id !== id))
  }

  const nav = (mobile: boolean) => NAV.map((item) => {
    const active = view === item.id
    return (
      <button
        key={item.id}
        type="button"
        data-slot="sidebar-menu-item"
        aria-current={active ? "page" : undefined}
        onClick={() => go(item.id)}
        className={cn(
          "flex items-center gap-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
          mobile ? "h-9 flex-1 justify-center px-3" : "h-10 px-3 text-left",
          active ? "bg-brand-soft text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <item.icon className={cn("size-4", active && "text-brand-ink")} stroke={1.75} aria-hidden="true" />
        {item.label}
      </button>
    )
  })

  return (
    <div className="flex min-h-[100dvh] bg-canvas">
      <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col gap-6 border-r border-border bg-card p-4 lg:flex">
        <SnapLogo className="h-9 px-2" />
        <nav aria-label="Dashboard" className="flex flex-col gap-1">{nav(false)}</nav>
        <div className="mt-auto rounded-xl border border-border bg-canvas p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs text-muted-foreground">Library capacity</p>
            <p className="text-xs font-medium text-foreground tabular-nums">{skills.length} / {MAX_SKILLS}</p>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full origin-left rounded-full bg-brand transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${String(Math.min(1, skills.length / MAX_SKILLS))})` }} />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <SnapLogo className="lg:hidden" />
          <div className="hidden items-center gap-2 text-sm lg:flex"><span className="text-muted-foreground">Workspace</span><span className="text-border">/</span><span className="font-medium text-foreground">{view === "library" ? "Library" : "Connections"}</span></div>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <UserMenu />
          </div>
        </header>

        <nav aria-label="Dashboard" className="flex gap-1 border-b border-border bg-card px-4 py-2 sm:px-6 lg:hidden">{nav(true)}</nav>

        <main className="mx-auto w-full max-w-[1600px] min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {view === "library" ? (
            <Library
              skills={skills}
              loading={loading}
              error={error}
              onAddClick={() => setAdding(true)}
              onRemove={(id) => { void removeSkill(id) }}
              onOpenConnections={() => go("connections")}
            />
          ) : (
            <ApiKeys endpoint={mcpUrl} />
          )}
        </main>
      </div>

      {adding ? <AddSkill full={skills.length >= MAX_SKILLS} onClose={closeAdding} onAdd={addSkill} /> : null}
    </div>
  )
}
