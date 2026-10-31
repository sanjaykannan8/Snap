"use client"

import { IconArrowRight, IconCircleCheck, IconCircleDashed } from "@tabler/icons-react"
import { useMemo, useState } from "react"
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts"

import { DEFAULT_THRESHOLD, route, SEED_SKILLS, type Route } from "@/lib/router"
import { cn } from "@/lib/utils"

const EXAMPLES = [
  "pull the tables out of this scanned PDF",
  "this postgres query with three joins is slow",
  "our stripe payment webhook fires twice",
  "book me a table for two tonight",
]

const STEPS = [
  { title: "Agent describes the problem", text: "It calls get_skill(problem), the only tool it sees." },
  { title: "Decision model scores every skill", text: "Name + description, one pass, no text generated." },
  { title: "Confidence check", text: "Below the threshold, Snap returns “no skill” and the agent carries on." },
  { title: "Winning skill comes back", text: "The agent receives the skill content and a short-lived download URL." },
]

export function RouterDemo() {
  const [problem, setProblem] = useState(EXAMPLES[0]!)
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD)
  const [result, setResult] = useState<Route>(() => route(EXAMPLES[0]!, SEED_SKILLS, DEFAULT_THRESHOLD))
  const [submitted, setSubmitted] = useState(0)

  const run = (text: string, t = threshold) => {
    setProblem(text)
    setResult(route(text, SEED_SKILLS, t))
    setSubmitted((n) => n + 1)
  }

  const chart = useMemo(
    () =>
      result.scores.map((s) => ({
        name: s.skill.name,
        p: Math.round(s.p * 1000) / 10,
      })),
    [result],
  )

  const winner = result.winner

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <ol className="flex flex-col gap-1">
        {STEPS.map((step, i) => {
          const active = i < 3 || winner
          return (
            <li key={step.title} className="relative flex gap-4 rounded-2xl p-4">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  i === 3 && !winner ? "bg-muted text-[#52524C]" : "bg-brand text-foreground",
                )}
              >
                {i + 1}
              </span>
              <div className={cn("transition-opacity", !active && "opacity-50")}>
                <p className="font-medium text-foreground">{step.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-[#52524C]">{step.text}</p>
              </div>
            </li>
          )
        })}
        <p className="mt-2 px-4 text-xs leading-relaxed text-[#52524C]">
          This demo scores skills in your browser with a lightweight stand-in so you can feel the flow. The hosted
          service uses your configured Cloudflare or local model; scores and timings shown here are illustrative.
        </p>
      </ol>

      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-white p-4 sm:p-6">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            run(problem)
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 font-mono text-[13px] focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/20">
            <span className="shrink-0 text-brand-ink">get_skill(</span>
            <input
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              aria-label="Describe the problem"
              placeholder="describe the task…"
              className="h-11 min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-[#52524C]/60"
            />
            <span className="shrink-0 text-brand-ink">)</span>
          </div>
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-foreground px-4 text-sm font-medium text-white outline-none hover:bg-foreground/90 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]"
          >
            Route <IconArrowRight className="size-4" />
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              data-slot="toggle-group-item"
              aria-pressed={ex === problem}
              onClick={() => run(ex)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                ex === problem ? "border-brand bg-brand-soft text-foreground" : "border-border text-[#52524C] hover:text-foreground",
              )}
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }} barCategoryGap={6}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={132}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#52524C", fontSize: 12, fontFamily: "var(--font-geist-mono)" }}
              />
              <ReferenceLine
                x={threshold * 100}
                stroke="#0F0F0E"
                strokeDasharray="4 3"
                label={{ value: `threshold ${String(Math.round(threshold * 100))}%`, position: "insideTopRight", fill: "#52524C", fontSize: 11 }}
              />
              <Bar dataKey="p" radius={[0, 6, 6, 0]} background={{ fill: "#f5f5f3", radius: 6 }} animationDuration={500}>
                {chart.map((row, i) => (
                  <Cell key={row.name} fill={i === 0 && winner ? "#76b900" : "#d4d4cf"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <label className="flex items-center gap-3 text-sm text-[#52524C]">
          <span className="shrink-0">Confidence threshold</span>
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.01}
            value={threshold}
            aria-valuenow={threshold}
            onChange={(e) => {
              const t = Number(e.target.value)
              setThreshold(t)
              setResult(route(problem, SEED_SKILLS, t))
            }}
            className="flex-1 accent-[#76b900]"
          />
          <span className="w-10 text-right font-semibold text-foreground tabular-nums">{Math.round(threshold * 100)}%</span>
        </label>

        <div
          key={submitted}
          data-success={winner && submitted > 0 ? "true" : undefined}
          className={cn(
            "rounded-2xl border p-4 animate-in fade-in slide-in-from-bottom-1 duration-300",
            winner ? "border-brand/40 bg-brand-soft" : "border-border bg-muted/60",
          )}
        >
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              {winner ? <IconCircleCheck className="size-4 text-brand-ink" /> : <IconCircleDashed className="size-4 text-[#52524C]" />}
              {winner ? `Returned ${winner.name}` : "No skill · agent continues normally"}
            </span>
            <span className="font-mono text-xs text-[#52524C] tabular-nums">
              top p={result.top.toFixed(2)} · {result.latencyMs} ms
            </span>
          </div>
          {winner ? (
            <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-foreground">
              {`---\nname: ${winner.name}\ndescription: ${winner.description}\n---\n${winner.body}`}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  )
}
