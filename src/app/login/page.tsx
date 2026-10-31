"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, Suspense, useEffect, useState } from "react"

import { SnapLogo } from "@/components/site/logo"
import { useSession } from "@/components/auth/session-provider"
import { cn } from "@/lib/utils"

type Mode = "login" | "register"

/** Only allow same-origin paths, so `next` can never send someone to another site. */
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/dashboard"
}

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/40 px-3.5 text-sm font-normal outline-none transition-[border-color,background-color] placeholder:text-muted-foreground/70 focus:border-brand focus:bg-card focus:ring-3 focus:ring-brand/20 aria-invalid:border-destructive"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, loading, refresh } = useSession()
  const next = safeNext(params.get("next"))
  const [mode, setMode] = useState<Mode>(params.get("mode") === "register" ? "register" : "login")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  // A verified session means there is nothing to do here: go straight to the destination.
  useEffect(() => {
    if (!loading && user) router.replace(next)
  }, [loading, user, next, router])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true); setError("")
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password"), name: form.get("name") }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) { setError(data.error ?? "Something went wrong."); return }
      await refresh()
      router.replace(next)
    } catch {
      setError("Could not reach the server. Check your connection and try again.")
    } finally {
      setPending(false)
    }
  }

  const redirecting = !loading && Boolean(user)
  const register = mode === "register"

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-canvas p-5">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-7 sm:p-8">
        <SnapLogo />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">{register ? "Create your Snap library" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {redirecting ? "You are signed in. Taking you to your dashboard." : register ? "Start with a secure, cookie-based session." : "Log in to manage the skills your agents can discover."}
        </p>

        <form onSubmit={(event) => { void submit(event) }} className={cn("mt-6 space-y-4", redirecting && "pointer-events-none opacity-50")} aria-busy={pending}>
          {register ? (
            <label className="block text-sm font-medium">
              Name
              <input name="name" autoComplete="name" maxLength={80} className={inputClass} />
            </label>
          ) : null}
          <label className="block text-sm font-medium">
            Email
            <input name="email" type="email" autoComplete="email" required className={inputClass} />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={12} required aria-describedby={register ? "password-hint" : undefined} className={inputClass} />
            {register ? <span id="password-hint" className="mt-1.5 block text-xs font-normal text-muted-foreground">Use at least 12 characters.</span> : null}
          </label>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <button
            disabled={pending || redirecting}
            className="h-11 w-full rounded-xl bg-foreground text-sm font-medium text-background transition-[background-color,transform] hover:bg-foreground/90 active:scale-[0.98] focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
          >
            {pending ? "Please wait" : register ? "Create account" : "Log in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setMode(register ? "login" : "register"); setError("") }}
          className="mt-5 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          {register ? "Already have an account? Log in" : "Need an account? Create one"}
        </button>
        <p className="mt-7 text-xs text-muted-foreground"><Link href="/" className="underline underline-offset-4 hover:text-foreground">Back to Snap</Link></p>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
