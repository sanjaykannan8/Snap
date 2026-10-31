import { NextRequest, NextResponse } from "next/server"

import { createSession, hashPassword, passwordIsValid, sessionCookie } from "@/lib/auth"
import { createUser } from "@/lib/db"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: unknown; name?: unknown; password?: unknown } | null
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  const password = typeof body?.password === "string" ? body.password : ""
  if (!/^\S+@\S+\.\S+$/.test(email) || !passwordIsValid(password)) {
    return NextResponse.json({ error: "Use a valid email and a password with at least 12 characters." }, { status: 400 })
  }

  try {
    const session = await createUser({ email, name, passwordHash: await hashPassword(password) })
    const response = NextResponse.json({ user: session }, { status: 201 })
    response.cookies.set(sessionCookie(await createSession(session)))
    return response
  } catch (error) {
    if ((error as { name?: string }).name === "ConditionalCheckFailedException") {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 })
    }
    console.error("Registration failed", error)
    return NextResponse.json({ error: "Unable to create your account." }, { status: 500 })
  }
}
