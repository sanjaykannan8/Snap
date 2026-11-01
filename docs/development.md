# Frontend development


This is useful for frontend development. It requires Node.js 22+ and npm in addition to Docker; Python and uv are not required on the host.

1. Copy the example configuration for Next.js and Compose. Skip copying a file that already exists so you don't overwrite its settings.

Linux or macOS:

```bash
cp -n .env.example .env.local
cp -n .env.example .env
```

Windows PowerShell:

```powershell
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
if (!(Test-Path .env)) { Copy-Item .env.example .env }
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

Open the dashboard, create an account, add a skill, and generate a connection key. In **Connections**, copy the setup for your agent; it uses `X-Snap-API-Key` for authentication. Localhost URLs work only from the same machine. For remote hosting, configure HTTPS and public MCP and storage URLs as described in [deployment notes](backend.md).

### Choose a routing provider

Set these server-side variables in `.env` for Compose, and in `.env.local` as well when running Next.js locally:

- Cloudflare: `ROUTING_PROVIDER=cloudflare`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and optionally `CLOUDFLARE_CLEF_MODEL`.
- Local: `ROUTING_PROVIDER=local`, `LOCAL_SYSTEMONE_URL` (the complete URL ending in `/v1/systemone`), `LOCAL_SYSTEMONE_MODEL`, and optionally `LOCAL_SYSTEMONE_API_KEY`. The endpoint must implement the System One request and response format; this does not start a model server.

For a model server running on the Docker host, use `http://host.docker.internal:30000/v1/systemone` in Compose. A Next.js process running directly on the host may instead need `http://127.0.0.1:30000/v1/systemone`. A model on another machine needs that machine's reachable address. Restart the services after changing these settings. Do not use a real key with an untrusted endpoint.


[Back to quick start](../README.md#quickstart)
