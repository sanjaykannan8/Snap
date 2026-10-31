import { createHash, randomBytes, randomUUID } from "node:crypto"

export function hashApiKey(key: string) { return createHash("sha256").update(key).digest("hex") }
export function generateApiKey(name: string) {
  const secret = `snap_${randomBytes(32).toString("base64url")}`
  return { secret, hash: hashApiKey(secret), info: { id: randomUUID(), name, prefix: secret.slice(0, 13), createdAt: new Date().toISOString() } }
}
