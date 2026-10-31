import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/lib/request-auth"

export async function GET(request: NextRequest) {
  if (!await requireSession(request)) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  const bindAddress = process.env.MCP_BIND_ADDRESS ?? "127.0.0.1"
  const networkExposed = !["127.0.0.1", "localhost", "::1", "[::1]"].includes(bindAddress.toLowerCase())
  return NextResponse.json({ url: process.env.MCP_PUBLIC_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:3100/mcp"), networkExposed }, { headers: { "Cache-Control": "no-store" } })
}
