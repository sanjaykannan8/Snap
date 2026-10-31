"use client"

import { IconCheck, IconCopy } from "@tabler/icons-react"
import { useEffect, useRef, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Section eyebrow + title + lede, shared by every landing section. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  className,
  align = "left",
}: {
  eyebrow: string
  title: ReactNode
  lede?: ReactNode
  className?: string
  align?: "left" | "center"
}) {
  return (
    <div className={cn("flex max-w-2xl flex-col gap-3", align === "center" && "mx-auto items-center text-center", className)}>
      <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-brand-ink uppercase">
        <span className="size-1.5 rounded-full bg-brand" />
        {eyebrow}
      </span>
      <h2 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">{title}</h2>
      {lede ? <p className="text-base leading-relaxed text-pretty text-[#52524C] sm:text-lg">{lede}</p> : null}
    </div>
  )
}

/** Words light up as the paragraph scrolls through the viewport (Framer-style "reveal text on scroll"). */
export function ScrollRevealText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [progress, setProgress] = useState(0)
  const words = text.split(" ")

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const box = el.getBoundingClientRect()
      const vh = window.innerHeight
      const start = vh * 0.85
      const end = vh * 0.35
      const p = (start - box.top) / (start - end + box.height * 0.6)
      setProgress(Math.min(1, Math.max(0, p)))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return (
    <p ref={ref} className={cn("flex flex-wrap gap-x-[0.28em] gap-y-1", className)}>
      {words.map((word, i) => {
        const lit = progress * words.length - i
        return (
          <span
            key={`${word}-${String(i)}`}
            className="transition-colors duration-200"
            style={{ color: lit > 0.5 ? "#0F0F0E" : "rgb(15 15 14 / 0.16)" }}
          >
            {word}
          </span>
        )
      })}
    </p>
  )
}

/** Copyable shell/config snippet. data-sound="copy" gives it the copy cue. */
export function CopyCommand({ value, label, className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-white py-1.5 pr-1.5 pl-4 font-mono text-[13px] shadow-[0_1px_2px_rgb(0_0_0/0.04)]",
        className,
      )}
    >
      {label ? <span className="text-brand-ink select-none">{label}</span> : null}
      <span className="min-w-0 flex-1 truncate text-foreground">{value}</span>
      <button
        type="button"
        data-sound="copy"
        aria-label={copied ? "Copied" : "Copy to clipboard"}
        onClick={() => {
          void navigator.clipboard?.writeText(value).catch(() => {})
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1400)
        }}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#52524C] transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {copied ? <IconCheck className="size-4 text-brand-ink" /> : <IconCopy className="size-4" />}
      </button>
    </div>
  )
}

/** Number that counts up the first time it scrolls into view. */
export function CountUp({ to, decimals = 0, suffix = "", className }: { to: number; decimals?: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        io.disconnect()
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setValue(to)
          return
        }
        const t0 = performance.now()
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / 1100)
          setValue(to * (1 - Math.pow(1 - t, 3)))
          if (t < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to])

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {value.toFixed(decimals)}
      {suffix}
    </span>
  )
}
