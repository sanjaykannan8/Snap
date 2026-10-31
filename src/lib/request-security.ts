/** Compare against the externally visible host, not Next.js's internal listen address. */
export function isAllowedOrigin(origin: string | null, host: string | null, protocol: string, configuredOrigin?: string): boolean {
  if (!origin) return false
  try {
    const actual = new URL(origin)
    if (actual.origin !== origin || !["http:", "https:"].includes(actual.protocol)) return false
    if (configuredOrigin) {
      const configured = new URL(configuredOrigin)
      return configured.origin === configuredOrigin && actual.origin === configured.origin
    }
    if (!host || /[\s/@\\,?#]/.test(host) || !["http:", "https:"].includes(protocol)) return false
    const expected = new URL(`${protocol}//${host}`)
    return actual.origin === expected.origin
  } catch {
    return false
  }
}

export function secureSessionCookie(setting: string | undefined, nodeEnv: string | undefined): boolean {
  if (setting === "true") return true
  if (setting === "false") return false
  if (setting) throw new Error("SESSION_COOKIE_SECURE must be true or false")
  return nodeEnv === "production"
}
