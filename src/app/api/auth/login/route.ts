import { NextRequest, NextResponse } from "next/server"

import { createSession, sessionCookie, verifyPassword } from "@/lib/auth"
import { getUser } from "@/lib/db"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body?.password === "string" ? body.password : ""
  const user = email ? await getUser(email) : undefined
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
  }

  const session = { email: user.email, name: user.name }
  const response = NextResponse.json({ user: session })
  response.cookies.set(sessionCookie(await createSession(session)))
  return response
}
