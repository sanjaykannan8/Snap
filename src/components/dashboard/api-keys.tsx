"use client"

import { IconAlertTriangle, IconCheck, IconCopy, IconKey, IconPlus, IconX } from "@tabler/icons-react"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"

import { InlineConfirm, PageHeader, Panel, Skeleton } from "@/components/dashboard/primitives"
import { resolveMcpUrl } from "@/lib/mcp-url"
import { cn } from "@/lib/utils"

type Key = { id: string; name: string; prefix: string; createdAt: string }
type Client = "claude" | "codex" | "cursor" | "vscode"
type CopyTarget = "config" | "key" | "url" | "prompt"

const clients: { id: Client; label: string; file: string; detail: string }[] = [
  { id: "claude", label: "Claude Code", file: ".mcp.json in your project", detail: "Add Snap to your project MCP configuration." },
  { id: "codex", label: "Codex", file: "~/.codex/config.toml", detail: "Add this block to your Codex configuration file." },
  { id: "cursor", label: "Cursor", file: "~/.cursor/mcp.json", detail: "Add Snap to your personal Cursor MCP configuration." },
  { id: "vscode", label: "VS Code", file: "VS Code user profile mcp.json", detail: "Open the Command Palette and run MCP: Open User Configuration." },
]

function configuration(client: Client, endpoint: string, key: string) {
  const url = endpoint || "YOUR_MCP_URL"
  const token = key || "YOUR_API_KEY"
  if (client === "codex") {
    return `[mcp_servers.snap]\nurl = ${JSON.stringify(url)}\nhttp_headers = { "X-Snap-API-Key" = ${JSON.stringify(token)} }`
  }
  const server = { url, headers: { "X-Snap-API-Key": token } }
  return JSON.stringify(client === "cursor" || client === "claude"
    ? { mcpServers: { snap: client === "claude" ? { type: "http", ...server } : server } }
    : { servers: { snap: { type: "http", ...server } } }, null, 2)
}

function setupPrompt(client: Client, endpoint: string) {
  const selected = clients.find((item) => item.id === client)!
  return `Help me connect Snap to ${selected.label} using its remote MCP server.\n\nServer URL: ${endpoint || "YOUR_MCP_URL"}\nTransport: streamable HTTP\nAuthentication header: X-Snap-API-Key\n\nUse the appropriate ${selected.label} MCP configuration (${selected.file}). Preserve all existing settings and servers. Ask me for my Snap API key through a private channel; do not print it, commit it, or include it in logs. Insert it as the header value using the client's supported configuration. If the configuration is shared or tracked, use a supported secret or environment variable instead of committing the key.\n\nUse this configuration shape as a guide:\n${configuration(client, endpoint, "YOUR_API_KEY")}\n\nAfter setup, tell me how to restart or reconnect ${selected.label} and verify that the get_skill tool is available. Do not claim the connection works unless you can verify it. For substantive tasks, call get_skill with a concise description and read the returned skill when there is a match.`
}

function ClientMark({ client }: { client: Client }) {
  return <Image src={`/agents/${client}.${client === "cursor" ? "png" : "svg"}`} alt="" width={28} height={28} className="size-7 shrink-0 rounded-md object-contain" />
}

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })

function CopyButton({ copied, failed, disabled, label, onClick, className }: { copied: boolean; failed?: boolean; disabled?: boolean; label: string; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-[background-color,transform] hover:bg-muted active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
    >
      {copied ? <IconCheck className="size-3.5 text-brand-ink" stroke={1.75} aria-hidden="true" /> : <IconCopy className="size-3.5" stroke={1.75} aria-hidden="true" />}
      <span role="status" aria-live="polite">{failed ? "Could not copy" : copied ? "Copied" : label}</span>
    </button>
  )
}

export function ApiKeys({ endpoint: initialEndpoint }: { endpoint: string }) {
  const [endpoint, setEndpoint] = useState(initialEndpoint)
  const [keys, setKeys] = useState<Key[]>([])
  const [name, setName] = useState("")
  const [secret, setSecret] = useState("")
  const [createdName, setCreatedName] = useState("")
  const [client, setClient] = useState<Client>("claude")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<CopyTarget | null>(null)
  const [copyFailed, setCopyFailed] = useState<CopyTarget | null>(null)
  const copyTimer = useRef<number | undefined>(undefined)
  const currentClient = clients.find((item) => item.id === client)!
  const snippet = useMemo(() => configuration(client, endpoint, secret), [client, endpoint, secret])
  const prompt = useMemo(() => setupPrompt(client, endpoint), [client, endpoint])

  useEffect(() => {
    let active = true
    fetch("/api/mcp-config", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Could not load server address.")
      const data = await response.json() as { url: string; networkExposed: boolean }
      if (active) setEndpoint(resolveMcpUrl(data.url, data.networkExposed, window.location.hostname))
    }).catch(() => { if (active) setError("Could not load the server address. Refresh to try again.") })
    fetch("/api/keys", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Could not load your connections.")
      const data = await response.json() as { keys: Key[] }
      if (active) setKeys(data.keys)
    }).catch(() => { if (active) setError("Could not load your connections. Refresh to try again.") }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(""); setCopied(null)
    try {
      const response = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) })
      const data = await response.json() as { key: Key; secret: string; error?: string }
      if (!response.ok) throw new Error(data.error ?? "Could not create your connection.")
      setKeys((current) => [data.key, ...current])
      setCreatedName(data.key.name)
      setSecret(data.secret)
      setName("")
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create your connection.") }
    finally { setBusy(false) }
  }

  async function revoke(key: Key) {
    setBusy(true); setError("")
    try {
      const response = await fetch(`/api/keys/${key.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Could not revoke this key.")
      setKeys((current) => current.filter((item) => item.id !== key.id))
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not revoke this key.") }
    finally { setBusy(false) }
  }

  async function copy(value: string, target: CopyTarget) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
        const field = document.createElement("textarea")
        field.value = value
        field.setAttribute("readonly", "")
        field.style.position = "fixed"
        field.style.opacity = "0"
        document.body.appendChild(field)
        field.select()
        try { if (!document.execCommand("copy")) throw new Error("Copy unavailable") }
        finally { field.remove(); previous?.focus() }
      }
      setCopyFailed(null)
      setCopied(target)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(null), 2000)
    } catch { setCopyFailed(target); setError("Copy failed. Select the text and copy it manually.") }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Connections" description="Give each agent its own key. Snap returns the right skill whenever an agent asks for one." />

      {error ? <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p> : null}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.35fr)]">
        <Panel
          title="Your keys"
          description="One key for each agent or device."
          action={<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground tabular-nums">{loading ? "Loading" : `${String(keys.length)} ${keys.length === 1 ? "key" : "keys"}`}</span>}
          bodyClassName="flex flex-col gap-5"
        >
          <form onSubmit={(event) => { void create(event) }}>
            <label htmlFor="connection-name" className="text-xs font-medium text-foreground">Key name</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="connection-name"
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={Boolean(secret)}
                placeholder="Cursor on my laptop"
                className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-muted/40 px-3.5 text-sm transition-[border-color,background-color] outline-none placeholder:text-muted-foreground/70 focus:border-brand focus:bg-card focus:ring-3 focus:ring-brand/20 disabled:opacity-50"
              />
              <button
                disabled={busy || Boolean(secret)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-[background-color,transform] hover:bg-foreground/90 active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
              >
                <IconPlus className="size-4" stroke={1.75} aria-hidden="true" />
                {busy ? "Creating" : "Create key"}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {secret ? "Save your new key below before creating another." : "A descriptive name makes access easy to manage later."}
            </p>
          </form>

          {secret ? (
            <div role="status" className="rounded-xl border border-brand/30 bg-brand-soft p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-brand-ink" stroke={1.75} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Copy the key for {createdName} now</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">It is included in the setup snippet and will not be shown again.</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss key"
                  onClick={() => { setSecret(""); setCopied(null) }}
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  <IconX className="size-4" stroke={1.75} aria-hidden="true" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-foreground select-all">{secret}</code>
                <CopyButton copied={copied === "key"} failed={copyFailed === "key"} label="Copy key" onClick={() => { void copy(secret, "key") }} className="h-9" />
              </div>
            </div>
          ) : null}

          <div className="min-h-0 flex-1">
            {loading ? (
              <div aria-busy="true" className="divide-y divide-border rounded-xl border border-border">
                {[0, 1].map((row) => (
                  <div key={row} className="flex items-center gap-3 p-3.5">
                    <Skeleton className="size-9 rounded-lg" />
                    <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-1/4" /></div>
                  </div>
                ))}
              </div>
            ) : keys.length ? (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {keys.map((key) => (
                  <li key={key.id} className="flex items-center gap-3 px-3.5 py-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <IconKey className="size-4" stroke={1.75} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{key.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        <span className="font-mono">{key.prefix}…</span>
                        <span aria-hidden="true"> · </span>
                        {dateFormat.format(new Date(key.createdAt))}
                      </p>
                    </div>
                    <InlineConfirm label="Revoke" confirmLabel="Revoke" ariaLabel={`Revoke ${key.name}`} busy={busy} onConfirm={() => { void revoke(key) }} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex h-full min-h-32 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border px-4 py-6 text-center">
                <IconKey className="size-5 text-muted-foreground" stroke={1.5} aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">No keys yet</p>
                <p className="text-xs text-muted-foreground">Create a key to connect your first agent.</p>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Set up your agent" description="Copy the server address and a ready-made configuration." bodyClassName="flex flex-col gap-4">
          <div className="rounded-xl border border-brand/25 bg-brand-soft p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Let your agent set it up</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Choose your agent below, then paste this prompt into its chat. It includes the server address and asks for your key separately.</p>
              </div>
              <CopyButton copied={copied === "prompt"} failed={copyFailed === "prompt"} disabled={!endpoint} label="Copy setup prompt" onClick={() => { void copy(prompt, "prompt") }} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Server address</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-foreground select-all">{endpoint || "No server address configured"}</code>
              <CopyButton copied={copied === "url"} failed={copyFailed === "url"} disabled={!endpoint} label="Copy" onClick={() => { void copy(endpoint, "url") }} className="h-9" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Streamable HTTP. Send your key in the <span className="font-mono">X-Snap-API-Key</span> header.</p>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-border">
            <div role="tablist" aria-label="Choose an MCP client" className="grid grid-cols-2 gap-2 border-b border-border bg-muted/40 p-3 2xl:grid-cols-4">
              {clients.map((item) => (
                <button
                  key={item.id}
                  id={`client-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={client === item.id}
                  aria-controls="client-panel"
                  tabIndex={client === item.id ? 0 : -1}
                  onClick={() => { setClient(item.id); setCopied(null) }}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
                    const index = clients.findIndex((entry) => entry.id === client)
                    const next = clients[(index + (event.key === "ArrowRight" ? 1 : clients.length - 1)) % clients.length]
                    setClient(next.id); setCopied(null)
                    document.getElementById(`client-tab-${next.id}`)?.focus()
                  }}
                  className={cn(
                    "flex min-h-12 items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium whitespace-nowrap transition-[background-color,color,box-shadow] focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                    client === item.id ? "bg-card text-foreground shadow-[0_0_0_1px_var(--border)]" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <ClientMark client={item.id} />{item.label}
                </button>
              ))}
            </div>
            <div id="client-panel" role="tabpanel" aria-labelledby={`client-tab-${client}`} className="flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{currentClient.detail}</p>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{currentClient.file}</p>
                </div>
                <CopyButton copied={copied === "config"} failed={copyFailed === "config"} disabled={!endpoint} label={secret ? "Copy configuration" : "Copy template"} onClick={() => { void copy(snippet, "config") }} />
              </div>
              <pre className="overflow-x-auto bg-[#20251d] p-4 font-mono text-xs leading-6 text-[#d8e6cd]"><code>{snippet}</code></pre>
            </div>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            {secret ? "This configuration contains your key, so keep it private. " : "Create a key, then replace YOUR_API_KEY with it. "}
            {client === "codex" ? "Merge the block into your existing settings. " : "If the file already lists servers, add the snap entry to the existing object. "}
            {client === "claude" ? "Keep a populated .mcp.json out of version control. " : ""}
            Restart your agent after saving.
          </p>
          {!secret ? <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">Existing keys cannot be revealed again. Create a new key if you no longer have yours; revoke the old one when your agent is connected.</p> : null}
          {!endpoint ? <p role="alert" className="text-xs text-destructive">Set MCP_PUBLIC_URL on the server before copying this configuration.</p> : null}
        </Panel>
      </div>
    </div>
  )
}
