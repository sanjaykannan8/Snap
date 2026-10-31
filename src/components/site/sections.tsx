"use client"

import { IconCheck, IconMinus, IconPlus, IconUser, IconUsersGroup } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { cn } from "@/lib/utils"

const ROWS: { label: string; local: string | boolean; snap: string | boolean }[] = [
  { label: "Where skills live", local: "Depends on the agent", snap: "Your database and object store" },
  { label: "Multiple agents", local: "Depends on the agent", snap: "Connect agents to one account" },
  { label: "Skill discovery", local: "Depends on the agent", snap: "One: get_skill" },
  { label: "Matching", local: "Depends on the agent", snap: "Cloudflare or local model" },
  { label: "No-match handling", local: "Depends on the agent", snap: "Confidence threshold; imperfect" },
]

function Mark({ value }: { value: string | boolean }) {
  if (value === true) return <IconCheck className="size-4 text-brand-ink" aria-label="Yes" />
  if (value === false) return <IconMinus className="size-4 text-[#52524C]/50" aria-label="No" />
  return <span>{value}</span>
}

export function Comparison() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white">
      <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-border bg-muted/50 text-sm font-medium">
        <div className="p-4 text-[#52524C]" />
        <div className="p-4 text-[#52524C]">Local-folder routers</div>
        <div className="flex items-center gap-2 bg-brand-soft p-4 text-foreground">
          <Image src="/snap-logo.svg" alt="" width={18} height={18} className="rounded" /> Snap
        </div>
      </div>
      {ROWS.map((row) => (
        <div key={row.label} className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-border text-sm last:border-b-0">
          <div className="p-4 font-medium text-foreground">{row.label}</div>
          <div className="flex items-center p-4 text-[#52524C]"><Mark value={row.local} /></div>
          <div className="flex items-center bg-brand-soft/50 p-4 text-foreground"><Mark value={row.snap} /></div>
        </div>
      ))}
    </div>
  )
}

export function Audience() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {[
        {
          icon: IconUser,
          title: "Individuals with big collections",
          text: "Keep a personal library in one place and give each of your coding agents access to it.",
          points: ["Upload individual SKILL.md files", "Connect supported remote MCP clients", "Revoke keys from the dashboard"],
        },
        {
          icon: IconUsersGroup,
          title: "Self-hosters and builders",
          text: "Run the dashboard and MCP service on your own infrastructure with the storage you configure.",
          points: ["Docker Compose for local setup", "Standalone Python MCP service", "DynamoDB and S3-compatible storage"],
        },
      ].map((card) => (
        <div key={card.title} className="flex flex-col gap-4 rounded-3xl border border-border bg-white p-6 sm:p-8">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
            <card.icon className="size-5" />
          </span>
          <h3 className="text-xl font-semibold tracking-tight">{card.title}</h3>
          <p className="text-[#52524C]">{card.text}</p>
          <ul className="mt-auto flex flex-col gap-2 pt-2">
            {card.points.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-foreground">
                <IconCheck className="size-4 text-brand-ink" /> {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

const FAQ = [
  {
    q: "How many skills can one library hold?",
    a: "The dashboard currently limits each account to 64 skills. The model's option limits need further verification before supporting larger libraries.",
  },
  {
    q: "What happens when no skill fits?",
    a: "If the top probability is under the confidence threshold, get_skill returns “no skill”. The threshold is imperfect and can still return a skill for an unrelated task.",
  },
  {
    q: "What does the router actually read?",
    a: "The task and each skill's name and description are sent to your configured Cloudflare or local decision model endpoint. For a match, the agent receives a short-lived URL to download the skill file.",
  },
  {
    q: "Which agents can use it?",
    a: "MCP clients that support remote Streamable HTTP with custom headers. The dashboard provides setup for Claude Code, Codex, Cursor, and VS Code.",
  },
  {
    q: "Can I run it myself?",
    a: "Yes. Docker Compose starts the dashboard, standalone Python MCP service, DynamoDB Local, and MinIO. Configure routing to use Cloudflare Workers AI or an existing local System One-compatible endpoint.",
  },
]

export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <div className="divide-y divide-border rounded-3xl border border-border bg-white">
      {FAQ.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={item.q}>
            <button
              type="button"
              data-slot="accordion-trigger"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left font-medium text-foreground outline-none focus-visible:bg-muted/60 sm:px-6"
            >
              {item.q}
              <IconPlus className={cn("size-4 shrink-0 text-[#52524C] transition-transform duration-200", isOpen && "rotate-45")} />
            </button>
            <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <p className="overflow-hidden px-5 text-[#52524C] sm:px-6">
                <span className="block pb-5">{item.a}</span>
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function FinalCta() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-brand px-6 py-14 text-center sm:px-12 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,#0F0F0E_1px,transparent_0)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black_80%)]" />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
        <h2 className="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
          Give your agent every skill. Load one.
        </h2>
        <p className="text-lg text-foreground/75">Run Snap locally, add your first SKILL.md, and connect your agent.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-[15px] font-semibold text-white outline-none hover:bg-foreground/90 focus-visible:ring-3 focus-visible:ring-white/60 active:scale-[0.97]"
          >
            Open dashboard
          </Link>
          <a
            href="https://github.com/sanjaykannan8/Snap"
            className="inline-flex h-11 items-center rounded-full border border-foreground/20 bg-white/30 px-6 text-[15px] font-medium text-foreground outline-none hover:bg-white/50 focus-visible:ring-3 focus-visible:ring-white/60"
          >
            Get Snap on GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
