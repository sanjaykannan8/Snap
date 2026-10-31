# Snap

One skill library for all your AI agents, with on-demand skill discovery.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

<!-- TODO: add 60-90s demo GIF -->

## Why Snap

- **Publish once, use in every agent.** Keep your skills in one library and connect MCP clients to it.
- **Keep skill context focused.** Native skill metadata can grow with a library; Snap returns at most one matched skill per call. No general break-even point has been established.
- **Choose the decision model endpoint.** Use Cloudflare Workers AI or a locally hosted System One-compatible endpoint. The selected endpoint receives the task and skill names and descriptions.

## How it works

1. Publish a `SKILL.md` through the dashboard and create an API key for your agent.
2. Connect an MCP client to the standalone service using the `X-Snap-API-Key` header.
3. The agent calls `get_skill` with a short description of its task.
4. Snap loads that user's skill metadata from DynamoDB and asks the configured decision model endpoint to select a match.
5. If the match meets the confidence threshold, Snap returns the skill content and a five-minute signed HTTP URL. Otherwise, the agent continues without one.

Clef-flash is Cloudflare's 9B open-weight decision model: it returns probabilities for typed questions rather than generating text. Snap uses it by default; Clef is configurable. Older skills stored directly in DynamoDB are returned inline instead of by URL.

```mermaid
flowchart LR
    U[User] --> W[Next.js dashboard]
    W --> D[(DynamoDB)]
    W --> S[(MinIO / S3-compatible storage)]
    A[Agent / MCP client] -->|API key + get_skill| M[Standalone MCP service]
    M --> D
    M --> C[Cloudflare Workers AI or local System One]
    M -->|Skill content and signed URL| A
```

## Quickstart

Run these commands on the machine that will host Snap. Both workflows work on **Linux, macOS, and Windows**. Install Git and Docker with the Compose plugin first; Docker Desktop is the usual choice on macOS and Windows. Start Docker before running the commands. For the frontend-only development workflow, also install Node.js 22 and npm.

Get the repository, then run all setup commands from its root directory:

```bash
git clone https://github.com/sanjaykannan8/Snap.git
cd Snap
```

Choose **one** of the workflows below. By default, the dashboard is at [localhost:3000](http://localhost:3000) and MCP is at `http://127.0.0.1:3100/mcp`. To connect from another computer, follow [Connect from another machine](#connect-from-another-machine) before starting the stack.

### Option 1: Run everything with Docker Compose

1. Create `.env` from the template. If `.env` already exists, edit it instead of overwriting it.

Linux or macOS (terminal):

```bash
cp .env.example .env
```

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

2. Open `.env` in a text editor. Replace `JWT_SECRET` with a random secret and choose **one** model provider:

```env
# Cloudflare option: set these three values.
ROUTING_PROVIDER=cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_workers_ai_token
```

Or use an already running System One-compatible server:

```env
ROUTING_PROVIDER=local
LOCAL_SYSTEMONE_URL=http://YOUR_MODEL_HOST:30000/v1/systemone
LOCAL_SYSTEMONE_MODEL=Cloudflare/clef-flash
LOCAL_SYSTEMONE_API_KEY=local
```

Replace `YOUR_MODEL_HOST` with the model server's reachable IP or hostname. This option does not start a model server. If it runs on the Docker host, use `host.docker.internal` instead of `localhost` in the Compose `.env` file. Set the API key only if the model server expects one.

To generate a `JWT_SECRET`, Linux and macOS users can run `openssl rand -hex 32`. In Windows PowerShell, run:

```powershell
$snapBytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($snapBytes)
-join ($snapBytes | ForEach-Object { $_.ToString('x2') })
```

Paste the generated value into `.env` and keep the file private.

3. Start the full stack (the same command works on all three operating systems):

```bash
docker compose up --build
```

Compose builds the Next.js frontend and standalone Python MCP images, starts DynamoDB Local and MinIO, and initializes the table and bucket. Leave it running, open [localhost:3000](http://localhost:3000), create an account, add a skill, and generate an agent key in **Connections**. The first build needs network access. Stop the stack with `docker compose down`; named volumes are retained.

### Option 2: Run the frontend locally, then start the MCP stack with Docker

This is useful for frontend development. It requires Node.js 22+ and npm in addition to Docker; Python and uv are not required on the host.

1. Copy the example configuration for Next.js and Compose. Skip copying a file that already exists so you don't overwrite its settings.

Linux or macOS:

```bash
cp .env.example .env.local
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
Copy-Item .env.example .env
```

2. Set a strong `JWT_SECRET` in `.env.local`. Configure the same routing provider in `.env.local` and `.env` (Compose reads `.env`; Next.js reads `.env.local`). Leave the example local database, storage, and MCP URLs unchanged unless you have configured alternatives.

3. In the first terminal, install dependencies and start the frontend:

```powershell
npm ci
npm run dev
```

4. In a second terminal at the repository root, start the MCP service and its dependencies:

```powershell
docker compose up -d --build mcp
```

Compose builds the Python MCP image and an initialization image, starts DynamoDB Local and MinIO, and creates the required table and bucket. It does not start the Dockerized web service, so the local frontend can use port 3000. The frontend may show connection errors until initialization completes. Check `docker compose ps` and `docker compose logs mcp` if needed; stop the containers with `docker compose down` when finished.

For either option, open the dashboard, create an account, add a skill, and generate a connection key. In **Connections**, copy the setup for your agent; it uses `X-Snap-API-Key` for authentication. Localhost URLs work only from the same machine. For remote hosting, configure HTTPS and public MCP and storage URLs as described in [deployment notes](docs/backend.md).

### Choose a routing provider

Set these server-side variables in `.env` for Compose, and in `.env.local` as well when running Next.js locally:

- Cloudflare: `ROUTING_PROVIDER=cloudflare`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and optionally `CLOUDFLARE_CLEF_MODEL`.
- Local: `ROUTING_PROVIDER=local`, `LOCAL_SYSTEMONE_URL` (the complete URL ending in `/v1/systemone`), `LOCAL_SYSTEMONE_MODEL`, and optionally `LOCAL_SYSTEMONE_API_KEY`. The endpoint must implement the System One request and response format; this does not start a model server.

For a model server running on the Docker host, use `http://host.docker.internal:30000/v1/systemone` in Compose. A Next.js process running directly on the host may instead need `http://127.0.0.1:30000/v1/systemone`. A model on another machine needs that machine's reachable address. Restart the services after changing these settings. Do not use a real key with an untrusted endpoint.

### Connect from another machine

By default, `127.0.0.1` means **the current machine**, so it cannot be used by an agent on another computer. Find the Snap host's LAN IP (not the agent's IP):

- **Linux:** run `hostname -I` and select the address on your LAN.
- **macOS:** run `ipconfig getifaddr en0` for Wi-Fi, or find the active interface's address in System Settings → Network.
- **Windows:** run `ipconfig` in PowerShell and find the IPv4 address of the active network adapter.

On the Snap host, edit `.env`. This example assumes its LAN IP is `192.168.1.20`; replace that address with **your** Snap host's IP:

```env
WEB_BIND_ADDRESS=0.0.0.0
MCP_BIND_ADDRESS=0.0.0.0
S3_BIND_ADDRESS=0.0.0.0
MCP_PUBLIC_URL=http://192.168.1.20:3100/mcp
S3_PUBLIC_ENDPOINT=http://192.168.1.20:9000
SESSION_COOKIE_SECURE=false
```

`0.0.0.0` is a listening address; do not paste it into an agent configuration. The advertised URLs must use an address reachable from the other machine. You may leave `WEB_BIND_ADDRESS=127.0.0.1` if only the Snap host needs the dashboard. `S3_BIND_ADDRESS=0.0.0.0` and `S3_PUBLIC_ENDPOINT` are needed for clients to use the optional signed download URL; the MCP response also contains the skill content directly. DynamoDB and the MinIO console remain localhost-bound.

If running Next.js outside Compose, copy the relevant `MCP_PUBLIC_URL` and `MCP_BIND_ADDRESS` settings to `.env.local` too. After changing `.env`, recreate the containers on the Snap host:

```bash
docker compose up -d --build
docker compose ps
```

If you chose the local-frontend workflow, use `docker compose up -d --build mcp` instead of the first command so Compose does not also start the web container on port 3000.

From the agent machine, open `http://192.168.1.20:3000` if the dashboard is exposed, or configure its MCP client with `http://192.168.1.20:3100/mcp` and the generated `X-Snap-API-Key`. Allow ports 3000 and 3100 through the host firewall as needed; port 9000 is needed only for signed downloads. A successful MCP connection and a reachable download endpoint are separate checks.

For Compose, MinIO credentials are set by `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` in `.env`; Compose passes those values to the web and MCP containers. The `S3_ACCESS_KEY` and `S3_SECRET_KEY` settings in the example are for processes started outside Compose. Use matching values when mixing local and containerized processes.

To check the MCP service from another machine, replace the example IP and run one of these commands:

```bash
# Linux or macOS
curl http://192.168.1.20:3100/health
```

```powershell
# Windows PowerShell
Invoke-RestMethod http://192.168.1.20:3100/health
```

The response should contain `"status":"ok"`. This checks connectivity only; the MCP client also needs a valid key. In OpenCode, `opencode mcp list` shows whether the configured server connected. If a signed URL shows `127.0.0.1`, check `S3_PUBLIC_ENDPOINT` in the **Compose `.env` on the Snap host**, recreate the MCP container, and ask for the skill again. Do not replace the hostname in an already signed URL: the host is part of the signature. Read the `content` field returned by `get_skill`; an HTTP URL is not an MCP resource.

For access beyond a trusted local network, place the dashboard, MCP service, and object storage behind HTTPS and configure firewall rules and strong credentials. Clients using the optional signed HTTP URL must be able to reach the exact `S3_PUBLIC_ENDPOINT` used to sign it; it must not be `127.0.0.1` for an agent on another machine. Read the returned `content` field directly; the signed URL is not an MCP resource. Browser clients also need their origin in `MCP_ALLOWED_ORIGINS`.

The Compose example defaults to `SESSION_COOKIE_SECURE=false` so login works over local HTTP, including a LAN IP. When serving the dashboard over HTTPS, set `SESSION_COOKIE_SECURE=true`. If a reverse proxy changes the host or terminates TLS, set `APP_ORIGIN` to the exact browser-facing dashboard origin, for example `https://snap.example.com` (no path or trailing slash). Without it, Snap checks the request's Host and protocol. Configure your proxy to reject unexpected hosts and strip untrusted forwarded headers. A browser client that sends an Origin to MCP must separately be included in `MCP_ALLOWED_ORIGINS`; a non-browser MCP client can omit Origin.

## Connect your agent

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

## Skill format

Snap currently accepts one `SKILL.md` file with `name` and `description` frontmatter:

```markdown
---
name: api-review
description: Review API endpoints for consistency and error handling.
---

# API review

Check request validation, response shapes, and error handling.
```

## Configuration

Use `.env.local` for the dashboard and `mcp-service/.env` for the Python service. See the example files for local defaults.

| Variable | Purpose |
| --- | --- |
| `DYNAMODB_ENDPOINT` | Local DynamoDB endpoint; omit for AWS DynamoDB. |
| `DYNAMODB_REGION`, `DYNAMODB_TABLE` | Shared DynamoDB region and table. |
| `S3_ENDPOINT` | Object-storage endpoint used for uploads and reads. |
| `S3_PUBLIC_ENDPOINT` | Endpoint used to sign URLs; it must be reachable by the agent. |
| `S3_REGION`, `S3_BUCKET` | Object-storage region and shared bucket. |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Server-side object-storage credentials. |
| `JWT_SECRET` | Dashboard session signing secret. |
| `SESSION_COOKIE_SECURE` | `false` for local HTTP; set `true` for HTTPS. Outside Compose, defaults to true in production. |
| `APP_ORIGIN` | Optional exact browser-facing dashboard origin for reverse-proxy deployments. |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Workers AI credentials for the MCP service; also needed by the web app's routing API if used. |
| `CLOUDFLARE_CLEF_MODEL` | Clef model identifier; defaults to `@cf/cloudflare/clef-flash`. |
| `ROUTING_PROVIDER` | `cloudflare` (default) or `local`. |
| `LOCAL_SYSTEMONE_URL`, `LOCAL_SYSTEMONE_MODEL`, `LOCAL_SYSTEMONE_API_KEY` | Local System One endpoint, model name, and optional bearer token. |
| `WEB_BIND_ADDRESS`, `MCP_BIND_ADDRESS`, `S3_BIND_ADDRESS` | Compose host bind addresses; default to `127.0.0.1`. |
| `SKILL_MATCH_THRESHOLD` | Minimum confidence for a match; defaults to `0.42`. |
| `MCP_HOST`, `MCP_PORT` | Address and port for the MCP service. |
| `MCP_ALLOWED_ORIGINS` | Comma-separated browser Origin allowlist; clients without an Origin header can omit it. |
| `MCP_PUBLIC_URL` | Full MCP URL displayed by the dashboard. |

## Security model

The dashboard uses signed JWTs in `HttpOnly`, `SameSite=Lax` cookies. Set `SESSION_COOKIE_SECURE=true` for HTTPS; Compose defaults to false for local HTTP. MCP keys are account-scoped; Snap stores their SHA-256 hashes and checks them on requests. Skill download URLs expire after five minutes. Revoking a key prevents later MCP calls, but does not invalidate URLs already issued.

Skills contain instructions consumed by agents. Only publish and use skills you trust, and review them before applying their instructions.

## Limitations and roadmap

- Skills are single files; associated scripts and assets are not bundled.
- Matching skills are returned inline with an optional signed URL; legacy DynamoDB-only skills are returned inline.
- The current choice compares skills without an explicit “no skill applies” option. A confidence threshold is a weak no-match signal; an explicit option is a possible improvement.
- Automatic fallback to larger Clef and an R2 deployment are not implemented.
- The dashboard uses a 64-skill capacity. Clef's limits on options within a single choice need verification before promising larger libraries.
- Context savings depend on the client, skill library, and frequency of calls; they have not been established across real deployments.

## When NOT to use Snap

If you use one agent with a handful of skills and native skill loading already works for you, the extra service and storage may not be worthwhile.

## Deployment

Build `mcp-service/Dockerfile` from the `mcp-service` directory and run replicas behind HTTPS. Set `MCP_PUBLIC_URL` for the dashboard and make both the MCP endpoint and signed object-storage URL reachable by remote agents. Configure shared DynamoDB, storage, and secrets on each replica. See [docs/backend.md](docs/backend.md) for details.

## Contributing

Run the checks relevant to your change:

```powershell
npm run lint
cd mcp-service
uv run pytest
```

## License

[MIT](LICENSE) © 2026 Kannan K
