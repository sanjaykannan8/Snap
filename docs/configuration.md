# Configuration


Compose reads the root `.env`. For local frontend development, also configure `.env.local`. Standalone Python loads process variables, then `mcp-service/.env`, root `.env.local`, and root `.env`, preserving earlier values. See the example files for local defaults.

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


See [provider setup](../README.md#configure-the-model) and [network setup](network.md).
