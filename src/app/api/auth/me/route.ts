import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/request-auth"

export async function GET(request: NextRequest) {
  const session = await requireSession(request)
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  return NextResponse.json({ user: session }, { headers: { "Cache-Control": "no-store" } })
}
