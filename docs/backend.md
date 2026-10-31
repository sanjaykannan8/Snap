# Snap backend

Snap is a stateless web application: a signed JWT is issued after login and kept in an `HttpOnly`, `Secure` (in production), `SameSite=Lax` cookie. The browser cannot read the token. API routes verify it independently, so no server-side session store is required.

## Local development

1. Copy `.env.example` to `.env.local` for the dashboard and `mcp-service/.env.example` to `mcp-service/.env` for MCP. Replace `JWT_SECRET` and configure Workers AI in the MCP file.
2. Run `docker compose up -d dynamodb minio`.
3. Run `npm run db:init` and `npm run storage:init`.
4. Run `npm run dev` for the dashboard. In another terminal run `cd mcp-service`, `uv sync`, and `uv run python server.py`. Create an account at `/login`, then open `/dashboard`.

The local DynamoDB single-table layout is intentionally small:

| Entity | PK | SK |
| --- | --- | --- |
| User profile | `USER#email` | `PROFILE` |
| Skill | `USER#email` | `SKILL#uuid` |

## Production boundaries

- The Next.js server owns JWT verification, DynamoDB calls, and routing-provider credentials.
- `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, and `/api/auth/me` manage authentication.
- `/api/skills` persists uploaded `SKILL.md` records.
- `/api/route` loads the signed-in user’s skills then asks Workers AI to choose one. `SKILL_MATCH_THRESHOLD` prevents a weak model choice from returning a skill.
- The independent MCP service exposes `/mcp` using stateless Streamable HTTP. Generate and revoke per-client keys in the dashboard. Configure the MCP client with the full HTTPS URL ending in `/mcp` and send the key in the `X-Snap-API-Key` header on every request. The key is shown once and only its SHA-256 hash is stored. Revocation applies to subsequent requests.
- The default model is `@cf/cloudflare/clef-flash`; set `CLOUDFLARE_CLEF_MODEL=@cf/cloudflare/clef` when higher decision accuracy matters more than latency.

Workers AI receives the task as `state` and each skill's name/description as a typed `choice` criterion. The Cloudflare token must have Workers AI inference permission and must never be exposed with a `NEXT_PUBLIC_` prefix.

New skills are stored in local MinIO and the MCP tool returns a five-minute presigned URL. A previously issued URL remains usable until it expires, even after its API key is revoked. Skills saved before object storage was introduced remain readable from DynamoDB and are returned directly. The larger-Clef fallback shown in the diagrams is not implemented yet. Remote clients need a deployed HTTPS MCP endpoint and an HTTPS-accessible object-storage endpoint; `127.0.0.1:9000` works only for clients on the same machine. Configure `S3_PUBLIC_ENDPOINT` to the externally reachable MinIO URL when testing remotely, and configure MinIO credentials consistently with the compose environment. Do not expose the default development credentials to the internet.

For clients accepting JSON configuration, the connection looks like:

```json
{ "mcpServers": { "snap": { "url": "https://your-host.example/mcp", "headers": { "X-Snap-API-Key": "YOUR_GENERATED_KEY" } } } }
```

Run `uv run pytest` in `mcp-service` to test the MCP protocol and authentication with mocked storage.

## Independent MCP deployment

Run `uv run python server.py` from `mcp-service`; it listens on `127.0.0.1:3100` by default. `/health` is its process health endpoint. Set `MCP_PUBLIC_URL` on the web app to the public HTTPS MCP URL shown in the dashboard. Deploy `mcp-service/Dockerfile` independently and scale replicas behind an HTTPS load balancer. Every replica must use the same DynamoDB table, routing-provider settings, bucket and externally reachable `S3_PUBLIC_ENDPOINT`. Key revocations are checked against DynamoDB on each call. `MCP_ALLOWED_ORIGINS` is a comma-separated allowlist for browser clients that send an Origin header; non-browser MCP clients can omit Origin. Configure network access and secrets on each deployment. See the README for provider selection and network binding settings.

## Product diagrams

- [Skill publishing flow](./skill-publishing.svg)
- [Skill discovery flow](./skill-discovery.svg)
