import { NextRequest } from "next/server"

import { readSession, SESSION_COOKIE } from "@/lib/auth"
import { isAllowedOrigin } from "@/lib/request-security"

export async function requireSession(request: NextRequest) {
  return readSession(request.cookies.get(SESSION_COOKIE)?.value)
}

export function hasValidOrigin(request: NextRequest) {
  return isAllowedOrigin(request.headers.get("origin"), request.headers.get("host"), request.nextUrl.protocol, process.env.APP_ORIGIN)
}
