"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

type User = { email: string; name: string }
type SessionContextValue = { user: User | null; loading: boolean; refresh: () => Promise<void>; logout: () => Promise<void> }
const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const refresh = async () => {
    const response = await fetch("/api/auth/me", { cache: "no-store" })
    setUser(response.ok ? (await response.json() as { user: User }).user : null)
    setLoading(false)
  }
  useEffect(() => {
    let active = true
    void fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        const result = response.ok ? (await response.json() as { user: User }).user : null
        if (active) setUser(result)
      })
      .catch(() => { if (active) setUser(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const value = useMemo(() => ({
    user,
    loading,
    refresh,
    logout: async () => { await fetch("/api/auth/logout", { method: "POST" }); setUser(null) },
  }), [user, loading])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error("useSession must be rendered inside SessionProvider")
  return value
}
