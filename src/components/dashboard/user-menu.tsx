"use client"

import { IconLoader2, IconLogout } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"

import { useSession } from "@/components/auth/session-provider"
import { cn } from "@/lib/utils"

function initials(name: string, email: string) {
  const source = name.trim() || email
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[1][0] : "")).toUpperCase()
}

export function UserMenu() {
  const router = useRouter()
  const { user, logout } = useSession()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus() }
    }
    const onPointer = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointer)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer)
    }
  }, [open])

  async function signOut() {
    setPending(true)
    try {
      await logout()
      router.replace("/login")
      router.refresh()
    } finally {
      setPending(false)
      setOpen(false)
    }
  }

  const name = user?.name?.trim() || "Your account"
  const email = user?.email ?? ""

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex size-9 items-center justify-center rounded-full bg-brand-soft text-xs font-medium text-brand-ink ring-1 ring-brand/30 transition-[box-shadow,transform] hover:ring-brand/60 active:scale-[0.96] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          open && "ring-brand/60",
        )}
      >
        {user ? initials(user.name, user.email) : <span className="size-3 rounded-full bg-brand/40" />}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 origin-top-right rounded-xl border border-border bg-card p-1.5 shadow-[0_12px_32px_-12px_rgb(15_15_14/0.25)] animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none"
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            {email ? <p className="truncate text-xs text-muted-foreground">{email}</p> : null}
          </div>
          <div role="separator" className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            autoFocus
            disabled={pending}
            onClick={() => { void signOut() }}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:opacity-60"
          >
            {pending ? <IconLoader2 className="size-4 animate-spin text-muted-foreground motion-reduce:animate-none" stroke={1.75} aria-hidden="true" /> : <IconLogout className="size-4 text-muted-foreground" stroke={1.75} aria-hidden="true" />}
            {pending ? "Logging out" : "Log out"}
          </button>
        </div>
      ) : null}
    </div>
  )
}
