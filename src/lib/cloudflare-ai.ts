import type { StoredSkill } from "@/lib/db"

const DEFAULT_MODEL = "@cf/cloudflare/clef-flash"
const DEFAULT_THRESHOLD = 0.42

type ClefAnswer = { choice?: string; confidence?: number; probabilities?: Record<string, number> }
type ClefResponse = { answers?: { skill?: ClefAnswer } }

export async function selectSkill(problem: string, skills: StoredSkill[]) {
  const provider = (process.env.ROUTING_PROVIDER ?? "cloudflare").trim().toLowerCase()
  if (provider !== "cloudflare" && provider !== "local") throw new Error("ROUTING_PROVIDER must be cloudflare or local")
  const model = provider === "local" ? process.env.LOCAL_SYSTEMONE_MODEL || "Cloudflare/clef-flash" : process.env.CLOUDFLARE_CLEF_MODEL || DEFAULT_MODEL
  if (skills.length === 0) return { skill: null, confidence: 0, model }
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = provider === "local" ? process.env.LOCAL_SYSTEMONE_API_KEY : process.env.CLOUDFLARE_API_TOKEN
  if (provider === "cloudflare" && (!accountId || !token)) throw new Error("Cloudflare Workers AI is not configured")
  if (provider === "cloudflare" && model !== "@cf/cloudflare/clef" && model !== "@cf/cloudflare/clef-flash") throw new Error("Unsupported Clef model")
  const url = provider === "local" ? process.env.LOCAL_SYSTEMONE_URL?.trim() : `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`
  if (!url) throw new Error("LOCAL_SYSTEMONE_URL is not configured")
  const configuredThreshold = Number.parseFloat(process.env.SKILL_MATCH_THRESHOLD ?? String(DEFAULT_THRESHOLD))
  const threshold = Number.isFinite(configuredThreshold) ? configuredThreshold : DEFAULT_THRESHOLD
  const criteria = Object.fromEntries(skills.map((skill) => [skill.id, `${skill.name}: ${skill.description}`]))
  const response = await fetch(url, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" },
    body: JSON.stringify({
      model: provider === "local" ? model : model.endsWith("clef") ? "clef" : "clef-flash",
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
  if (!response.ok) throw new Error(`Decision model request failed with ${response.status}`)
  const payload = (await response.json()) as { result?: ClefResponse } & ClefResponse
  const answer = (payload.result ?? payload).answers?.skill
  const confidence = answer?.confidence ?? answer?.probabilities?.[answer?.choice ?? ""] ?? 0
  const selected = skills.find((item) => item.id === answer?.choice) ?? null
  return { skill: confidence >= threshold ? selected : null, confidence, model }
}
