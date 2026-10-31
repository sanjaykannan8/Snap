import { NextRequest, NextResponse } from "next/server"

import { selectSkill } from "@/lib/cloudflare-ai"
import { listSkills } from "@/lib/db"
import { requireSession } from "@/lib/request-auth"
import { readSkillObject } from "@/lib/object-storage"

export async function POST(request: NextRequest) {
  const session = await requireSession(request)
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  const body = await request.json().catch(() => null) as { problem?: unknown } | null
  const problem = typeof body?.problem === "string" ? body.problem.trim() : ""
  if (!problem || problem.length > 12_000) return NextResponse.json({ error: "Provide a problem up to 12,000 characters." }, { status: 400 })

  try {
    const result = await selectSkill(problem, await listSkills(session.email))
    return NextResponse.json({
      skill: result.skill ? { id: result.skill.id, name: result.skill.name, description: result.skill.description, body: result.skill.objectKey ? await readSkillObject(result.skill.objectKey) : result.skill.body } : null,
      confidence: result.confidence,
      model: result.model,
    })
  } catch (error) {
    console.error("Skill routing failed", error)
    return NextResponse.json({ error: "Unable to route the skill right now." }, { status: 502 })
  }
}
