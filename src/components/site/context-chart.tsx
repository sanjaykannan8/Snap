"use client"

import { useMemo, useState } from "react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Illustrative model, not a benchmark: a SKILL.md averages TOKENS_PER_SKILL tokens,
// loading every skill costs N of those, Snap costs its tool schema plus one skill.
const TOKENS_PER_SKILL = 1800
const TOOL_SCHEMA = 140

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n)
}

export function ContextChart() {
  const [skills, setSkills] = useState(32)

  const data = useMemo(
    () =>
      Array.from({ length: 64 }, (_, i) => {
        const n = i + 1
        return { n, all: n * TOKENS_PER_SKILL, snap: TOOL_SCHEMA + TOKENS_PER_SKILL }
      }),
    [],
  )

  const all = skills * TOKENS_PER_SKILL
  const snap = TOOL_SCHEMA + TOKENS_PER_SKILL
  const saved = Math.max(0, 1 - snap / all)

  return (
    <div className="flex h-full flex-col gap-5 rounded-3xl border border-border bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#52524C]">Context spent on skills</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
            {fmt(snap)} <span className="text-base font-normal text-[#52524C]">vs</span>{" "}
            <span className="text-[#52524C] line-through decoration-[#52524C]/40">{fmt(all)}</span>{" "}
            <span className="text-base font-normal text-[#52524C]">tokens</span>
          </p>
        </div>
        <div className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-ink tabular-nums">
          {Math.round(saved * 100)}% less context
        </div>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="allFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F0F0E" stopOpacity={0.14} />
                <stop offset="100%" stopColor="#0F0F0E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="snapFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#76b900" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#76b900" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#ececE8" strokeDasharray="3 4" />
            <XAxis
              dataKey="n"
              tickLine={false}
              axisLine={false}
              ticks={[1, 8, 16, 24, 32, 40, 48, 56, 64]}
              tick={{ fill: "#52524C", fontSize: 12 }}
            />
            <YAxis tickLine={false} axisLine={false} tickFormatter={fmt} tick={{ fill: "#52524C", fontSize: 12 }} width={48} />
            <Tooltip
              cursor={{ stroke: "#0F0F0E", strokeOpacity: 0.15 }}
              contentStyle={{ borderRadius: 12, border: "1px solid #e8e8e4", fontSize: 12, boxShadow: "0 8px 24px -8px rgb(0 0 0 / .15)" }}
              labelFormatter={(n) => `${String(n)} skills`}
              formatter={(v, name) => [`${Number(v).toLocaleString()} tokens`, name === "all" ? "Load every skill" : "Snap"]}
            />
            <Area type="monotone" dataKey="all" stroke="#0F0F0E" strokeWidth={1.75} fill="url(#allFill)" isAnimationActive />
            <Area type="monotone" dataKey="snap" stroke="#76b900" strokeWidth={2.5} fill="url(#snapFill)" isAnimationActive />
            <ReferenceLine x={skills} stroke="#76b900" strokeDasharray="4 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <label className="flex flex-col gap-2">
        <span className="flex justify-between text-sm text-[#52524C]">
          <span>Skills in your library</span>
          <span className="font-semibold text-foreground tabular-nums">{skills}</span>
        </span>
        <input
          type="range"
          min={1}
          max={64}
          value={skills}
          aria-valuenow={skills}
          onChange={(e) => setSkills(Number(e.target.value))}
          className="w-full accent-[#76b900]"
        />
      </label>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#52524C]">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-foreground" />Load every skill</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-1 w-4 rounded bg-brand" />Snap: tool schema + one skill</span>
        <span className="ml-auto">Illustrative · assumes ~1.8k tokens per SKILL.md</span>
      </div>
    </div>
  )
}
