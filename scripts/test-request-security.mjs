import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import ts from "typescript"

// Load the pure TypeScript helpers without starting the app or accessing real credentials.
const source = await readFile(new URL("../src/lib/request-security.ts", import.meta.url), "utf8")
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { isAllowedOrigin, secureSessionCookie } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`)

test("accepts the browser's local host and rejects different origins", () => {
  assert.equal(isAllowedOrigin("http://192.168.1.20:3000", "192.168.1.20:3000", "http:"), true)
  assert.equal(isAllowedOrigin("http://localhost:3000", "localhost:3000", "http:"), true)
  assert.equal(isAllowedOrigin("http://attacker.example", "192.168.1.20:3000", "http:"), false)
  assert.equal(isAllowedOrigin("http://192.168.1.20:3000", "192.168.1.20:3000", "https:"), false)
  assert.equal(isAllowedOrigin(null, "localhost:3000", "http:"), false)
  assert.equal(isAllowedOrigin("null", "localhost:3000", "http:"), false)
})

test("uses the configured external origin behind a proxy", () => {
  assert.equal(isAllowedOrigin("https://snap.example.com", "internal:3000", "http:", "https://snap.example.com"), true)
  assert.equal(isAllowedOrigin("https://attacker.example", "internal:3000", "http:", "https://snap.example.com"), false)
})

test("cookie security defaults to production and permits explicit local HTTP", () => {
  assert.equal(secureSessionCookie(undefined, "production"), true)
  assert.equal(secureSessionCookie(undefined, "development"), false)
  assert.equal(secureSessionCookie("false", "production"), false)
  assert.equal(secureSessionCookie("true", "production"), true)
  assert.throws(() => secureSessionCookie("invalid", "production"))
})
