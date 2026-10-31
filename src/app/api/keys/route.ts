import { NextRequest, NextResponse } from "next/server"
import { generateApiKey } from "@/lib/api-keys"
import { createApiKey, listApiKeys } from "@/lib/db"
import { requireSession } from "@/lib/request-auth"

export async function GET(request: NextRequest) {
  const user = await requireSession(request)
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  return NextResponse.json({ keys: await listApiKeys(user.email) }, { headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: NextRequest) {
  const user = await requireSession(request)
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  const body = await request.json().catch(() => null) as { name?: unknown } | null
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  if (!name || name.length > 80) return NextResponse.json({ error: "Name must be between 1 and 80 characters." }, { status: 400 })
  const { secret, hash, info } = generateApiKey(name)
  await createApiKey(user.email, hash, info)
  return NextResponse.json({ key: info, secret }, { status: 201, headers: { "Cache-Control": "no-store" } })
}
