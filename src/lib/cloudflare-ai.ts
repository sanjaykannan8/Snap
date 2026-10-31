import type { StoredSkill } from "@/lib/db"

const DEFAULT_MODEL = "@cf/cloudflare/clef-flash"
const DEFAULT_THRESHOLD = 0.42

type ClefAnswer = { choice?: string; confidence?: number; probabilities?: Record<string, number> }
type ClefResponse = { answers?: { skill?: ClefAnswer } }

export async function selectSkill(problem: string, skills: StoredSkill[]) {
  if (skills.length === 0) return { skill: null, confidence: 0, model: process.env.CLOUDFLARE_CLEF_MODEL ?? DEFAULT_MODEL }
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_API_TOKEN
  if (!accountId || !token) throw new Error("Cloudflare Workers AI is not configured")

  const model = process.env.CLOUDFLARE_CLEF_MODEL ?? DEFAULT_MODEL
  const configuredThreshold = Number.parseFloat(process.env.SKILL_MATCH_THRESHOLD ?? String(DEFAULT_THRESHOLD))
  const threshold = Number.isFinite(configuredThreshold) ? configuredThreshold : DEFAULT_THRESHOLD
  const criteria = Object.fromEntries(skills.map((skill) => [skill.id, `${skill.name}: ${skill.description}`]))
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model.endsWith("clef") ? "clef" : "clef-flash",
      state: problem,
      questions: {
        skill: {
          type: "choice",
          instructions: "Which skill best solves this task? Select only when it is a strong fit.",
          criteria,
        },
      },
    }),
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`Workers AI failed with ${response.status}`)
  const payload = (await response.json()) as { result?: ClefResponse } & ClefResponse
  const answer = (payload.result ?? payload).answers?.skill
  const confidence = answer?.confidence ?? answer?.probabilities?.[answer?.choice ?? ""] ?? 0
  const selected = skills.find((item) => item.id === answer?.choice) ?? null
  return { skill: confidence >= threshold ? selected : null, confidence, model }
}
