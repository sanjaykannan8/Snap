# Connect your agent


The dashboard's connection panel produces configurations for Claude Code, Codex, Cursor, and VS Code with your endpoint and new key. OpenCode can use the example below. A key is shown once; copy it before dismissing the panel. Keep populated configurations private and merge entries into existing settings instead of overwriting them.

**OpenCode** — add to your OpenCode configuration (for example, `~/.config/opencode/opencode.json`):

```json
{
  "mcp": {
    "snap": {
      "type": "remote",
      "url": "http://192.168.1.20:3100/mcp",
      "enabled": true,
      "headers": { "X-Snap-API-Key": "YOUR_API_KEY" }
    }
  }
}
```

Replace the example IP with the Snap host's IP, or use `http://127.0.0.1:3100/mcp` when OpenCode runs on the Snap host. Merge `snap` into an existing `mcp` object, keep the key private, and do not commit a file containing it. Restart OpenCode and check `opencode mcp list`. See [OpenCode's MCP documentation](https://opencode.ai/docs/en/mcp-servers/) for its configuration options.

**Claude Code** — add to your project's `.mcp.json` (do not commit a file containing your key):

```json
{
  "mcpServers": {
    "snap": {
      "type": "http",
      "url": "http://127.0.0.1:3100/mcp",
      "headers": { "X-Snap-API-Key": "YOUR_API_KEY" }
    }
  }
}
```

**Codex** — add to `~/.codex/config.toml`:

```toml
[mcp_servers.snap]
url = "http://127.0.0.1:3100/mcp"
http_headers = { "X-Snap-API-Key" = "YOUR_API_KEY" }
```

**Cursor** — add to your personal `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "snap": {
      "url": "http://127.0.0.1:3100/mcp",
      "headers": { "X-Snap-API-Key": "YOUR_API_KEY" }
    }
  }
}
```

**VS Code** — use **MCP: Open User Configuration** and add:

```json
{
  "servers": {
    "snap": {
      "type": "http",
      "url": "http://127.0.0.1:3100/mcp",
      "headers": { "X-Snap-API-Key": "YOUR_API_KEY" }
    }
  }
}
```

Restart the client or start a new session after saving. The agent decides when to call the tool; a useful instruction for its configuration is: “At the start of a substantive task, call `get_skill` with a short description of the task. Read the returned content field if there is a match.”


For remote clients, see [network setup](network.md).
