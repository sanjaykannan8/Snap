import { NextRequest, NextResponse } from "next/server"
import { revokeApiKey } from "@/lib/db"
import { hasValidOrigin, requireSession } from "@/lib/request-auth"

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireSession(request)
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  const { id } = await context.params
  if (!await revokeApiKey(user.email, id)) return NextResponse.json({ error: "Key not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
