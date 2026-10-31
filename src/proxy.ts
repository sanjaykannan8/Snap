import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE } from "@/lib/auth-constants"

// An optimistic navigation guard only. Every API route verifies the signed JWT itself.
// Signed-in visitors are redirected away from /login on the client, after the session is verified,
// so an expired cookie can never cause a redirect loop.
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const login = new URL("/login", request.url)
    const { pathname, search } = request.nextUrl
    login.searchParams.set("next", `${pathname}${search}`)
    return NextResponse.redirect(login)
  }
  return NextResponse.next()
}

export const config = { matcher: ["/dashboard/:path*"] }
