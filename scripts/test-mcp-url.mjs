import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import ts from "typescript"

const source = await readFile(new URL("../src/lib/mcp-url.ts", import.meta.url), "utf8")
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { resolveMcpUrl } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`)

test("uses the browser host when a local default is network-exposed", () => {
  assert.equal(resolveMcpUrl("http://127.0.0.1:3100/mcp", true, "192.168.1.20"), "http://192.168.1.20:3100/mcp")
  assert.equal(resolveMcpUrl("http://localhost:3100/mcp", true, "[2001:db8::1]"), "http://[2001:db8::1]:3100/mcp")
})

test("preserves localhost-only and explicitly configured public URLs", () => {
  assert.equal(resolveMcpUrl("http://127.0.0.1:3100/mcp", false, "192.168.1.20"), "http://127.0.0.1:3100/mcp")
  assert.equal(resolveMcpUrl("http://127.0.0.1:3100/mcp", true, "localhost"), "http://127.0.0.1:3100/mcp")
  assert.equal(resolveMcpUrl("https://mcp.example.com/mcp", true, "192.168.1.20"), "https://mcp.example.com/mcp")
})
