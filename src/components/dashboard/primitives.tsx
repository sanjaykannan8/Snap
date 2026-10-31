"use client"

import { IconCheck, IconX } from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn("flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-5 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)} />
}

/** Two-step destructive action that stays in place: trigger, then Cancel and Confirm. */
export function InlineConfirm({
  label,
  confirmLabel,
  ariaLabel,
  icon,
  busy,
  onConfirm,
}: {
  label?: string
  confirmLabel: string
  ariaLabel: string
  icon?: React.ReactNode
  busy?: boolean
  onConfirm: () => void
}) {
  const [armed, setArmed] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!armed) return
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setArmed(false) }
    const onPointer = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setArmed(false) }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointer)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer)
    }
  }, [armed])

  return (
    <div ref={rootRef} className="flex items-center justify-end gap-1">
      {armed ? (
        <>
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => setArmed(false)}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <IconX className="size-3.5" stroke={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">Cancel</span>
          </button>
          <button
            type="button"
            data-variant="destructive"
            disabled={busy}
            onClick={() => { setArmed(false); onConfirm() }}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-destructive px-2.5 text-xs font-medium text-white transition-[filter,transform] hover:brightness-95 active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-destructive/30 focus-visible:outline-none disabled:opacity-50"
          >
            <IconCheck className="size-3.5" stroke={1.75} aria-hidden="true" />
            {confirmLabel}
          </button>
        </>
      ) : (
        <button
          type="button"
          data-variant="destructive"
          aria-label={ariaLabel}
          disabled={busy}
          onClick={() => setArmed(true)}
          className={cn(
            "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-destructive/30 focus-visible:outline-none disabled:opacity-50",
            label ? "px-2.5" : "size-8",
          )}
        >
          {icon}
          {label}
        </button>
      )}
    </div>
  )
}
