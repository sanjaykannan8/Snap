"use client"

import { IconArrowRight, IconBrandGithub } from "@tabler/icons-react"
import Link from "next/link"

import { HalftoneDots } from "@/components/ui/halftone-dots"

import { CopyCommand } from "./primitives"

function LiveCall() {
  return (
    <div
      data-halftone-solid
      className="w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-border bg-white/95 p-4 font-mono text-[12px] shadow-[0_12px_40px_-12px_rgb(15_15_14/0.25)] backdrop-blur"
    >
      <div className="mb-3 flex items-center justify-between font-sans text-[11px] font-medium text-[#52524C]">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-brand [animation:snap-pulse_1.6s_ease-in-out_infinite]" />
          MCP · example
        </span>
        <span>get_skill</span>
      </div>
      <p className="text-[#52524C]">
        <span className="text-brand-ink">get_skill</span>(
        <span className="text-foreground">&quot;extract text from a PDF&quot;</span>)
      </p>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-muted px-3 py-2">
        <span className="font-semibold text-foreground">→ pdf-extract</span>
        <span className="text-brand-ink">signed URL</span>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_40%,black_20%,transparent_70%)]" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pt-6 pb-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-8 lg:pb-28">
        <div className="flex min-w-0 flex-col items-start gap-7">
          <h1 className="text-[38px] leading-[1.04] sm:leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-foreground sm:text-6xl lg:text-[68px]">
            Every skill you own.
            <br />
            <span className="text-[#52524C]">One tool to </span>
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">find it.</span>
              <span aria-hidden className="absolute inset-x-0 bottom-[0.08em] z-0 h-[0.3em] rounded-sm bg-brand/70" />
            </span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-pretty text-[#52524C]">
            Snap is a self-hosted skill library for AI agents. Keep your <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">SKILL.md</code> files in one dashboard, then connect your agents to a standalone MCP service that finds a relevant skill when they need it.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-semibold text-foreground shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] transition-transform outline-none hover:brightness-105 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]"
            >
              Open the dashboard
              <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="https://github.com/sanjaykannan8/Snap"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-white px-5 text-[15px] font-medium text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <IconBrandGithub className="size-5" aria-hidden="true" /> View on GitHub
            </a>
          </div>

          <div className="w-full max-w-xl"><p className="mb-2 text-xs text-muted-foreground">From the repository, after configuring your .env file</p><CopyCommand label="$" value="docker compose up --build" className="w-full" /></div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[460px] items-center justify-center">
          <HalftoneDots
            src="/snap-logo.png"
            accent="#76b900"
            gradient={["#76b900", "#3f6300"]}
            className="aspect-square w-full max-w-[400px] text-white"
          />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 sm:-left-4 sm:translate-x-0">
            <LiveCall />
          </div>
        </div>
      </div>
    </section>
  )
}
