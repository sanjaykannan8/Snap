import { NextRequest, NextResponse } from "next/server"

import { deleteSkill, getSkill } from "@/lib/db"
import { removeSkillObject } from "@/lib/object-storage"
import { requireSession } from "@/lib/request-auth"

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request)
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  const { id } = await context.params
  try {
    const skill = await getSkill(session.email, id)
    if (!skill) return NextResponse.json({ error: "Skill not found." }, { status: 404 })
    await deleteSkill(session.email, id)
    if (skill.objectKey) await removeSkillObject(skill.objectKey).catch((error) => console.error("Could not remove deleted skill object", error))
    return NextResponse.json({ ok: true })
  } catch (error) {
    if ((error as { name?: string }).name === "ConditionalCheckFailedException") {
      return NextResponse.json({ error: "Skill not found." }, { status: 404 })
    }
    throw error
  }
}
