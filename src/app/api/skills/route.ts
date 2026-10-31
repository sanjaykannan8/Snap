import { randomUUID } from "node:crypto"

import { NextRequest, NextResponse } from "next/server"

import { listSkills, saveSkill } from "@/lib/db"
import { requireSession } from "@/lib/request-auth"
import { parseSkillMd } from "@/lib/router"
import { removeSkillObject, uploadSkill } from "@/lib/object-storage"

export async function GET(request: NextRequest) {
  const session = await requireSession(request)
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  return NextResponse.json({ skills: await listSkills(session.email) }, { headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request)
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  const body = await request.json().catch(() => null) as { skillMd?: unknown } | null
  const parsed = typeof body?.skillMd === "string" ? parseSkillMd(body.skillMd) : null
  if (!parsed) return NextResponse.json({ error: "Expected a SKILL.md with name and description frontmatter." }, { status: 400 })
  const id = randomUUID()
  const objectKey = `skills/${id}/SKILL.md`
  const skill = { id, name: parsed.name, description: parsed.description, objectKey, createdAt: new Date().toISOString() }
  await uploadSkill(objectKey, body!.skillMd as string)
  try { await saveSkill(session.email, skill) }
  catch (error) { await removeSkillObject(objectKey).catch(() => undefined); throw error }
  return NextResponse.json({ skill }, { status: 201 })
}
