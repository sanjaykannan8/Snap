import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

import { SignJWT, jwtVerify } from "jose"

import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth-constants"

const scrypt = promisify(scryptCallback)

export { SESSION_COOKIE }

export type Session = { email: string; name: string }

function jwtKey() {
  const configured = process.env.JWT_SECRET
  if (configured) return new TextEncoder().encode(configured)
  if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET must be configured in production")
  return new TextEncoder().encode("development-only-secret-change-before-production")
}

export async function createSession(session: Session) {
  return new SignJWT({ name: session.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(jwtKey())
}

export async function readSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, jwtKey(), { algorithms: ["HS256"] })
    if (typeof payload.sub !== "string" || typeof payload.name !== "string") return null
    return { email: payload.sub, name: payload.name }
  } catch {
    return null
  }
}

export const sessionCookie = (value: string) => ({
  name: SESSION_COOKIE,
  value,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
})

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derived = (await scrypt(password, salt, 64)) as Buffer
  return `${salt}:${derived.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const supplied = (await scrypt(password, salt, 64)) as Buffer
  const expected = Buffer.from(hash, "hex")
  return expected.length === supplied.length && timingSafeEqual(expected, supplied)
}

export function passwordIsValid(password: string) {
  return password.length >= 12 && password.length <= 256
}

export function emailKey(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex")
}
