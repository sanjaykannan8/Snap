import { NextRequest } from "next/server"

import { readSession, SESSION_COOKIE } from "@/lib/auth"

export async function requireSession(request: NextRequest) {
  return readSession(request.cookies.get(SESSION_COOKIE)?.value)
}
