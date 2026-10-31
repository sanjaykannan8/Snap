import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/request-auth"

export async function GET(request: NextRequest) {
  if (!await requireSession(request)) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  return NextResponse.json({ url: process.env.MCP_PUBLIC_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:3100/mcp") }, { headers: { "Cache-Control": "no-store" } })
}
