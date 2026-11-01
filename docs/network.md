# Expose Snap on your network


Follow these steps on the computer running Snap **after completing the [quick start](../README.md#quickstart)**. This makes Snap reachable by another computer on a trusted LAN. The example uses `192.168.1.20` as the Snap host's address; substitute your actual address everywhere it appears. The other computer is called the *agent machine* below.

### 1. Find the Snap host's IP

By default, `127.0.0.1` means **the current machine**, so it cannot be used by an agent on another computer. Find the Snap host's LAN IP (not the agent's IP):

- **Linux:** run `hostname -I` and select the address on your LAN.
- **macOS:** run `ipconfig getifaddr en0` for Wi-Fi, or find the active interface's address in System Settings → Network.
- **Windows:** run `ipconfig` in PowerShell and find the IPv4 address of the active network adapter.

### 2. Configure the host

On the **Snap host**, open the `.env` file in the repository root. Use `notepad .env` in Windows PowerShell, or `nano .env` on Linux or macOS. Change the existing lines below (do not add a second copy of the same variable). Replace `192.168.1.20` with the IP you found:

```env
WEB_BIND_ADDRESS=0.0.0.0
MCP_BIND_ADDRESS=0.0.0.0
S3_BIND_ADDRESS=0.0.0.0
MCP_PUBLIC_URL=http://192.168.1.20:3100/mcp
S3_PUBLIC_ENDPOINT=http://192.168.1.20:9000
SESSION_COOKIE_SECURE=false
```

`0.0.0.0` is a listening address; do not paste it into an agent configuration. The advertised URLs must use an address reachable from the other machine. You may leave `WEB_BIND_ADDRESS=127.0.0.1` if only the Snap host needs the dashboard. `S3_BIND_ADDRESS=0.0.0.0` exposes the storage port; `S3_PUBLIC_ENDPOINT` advertises its address. See [skill content and signed downloads](#skill-content-and-signed-downloads). DynamoDB and the MinIO console remain localhost-bound.

Save `.env`. If running Next.js outside Compose, copy the relevant `MCP_PUBLIC_URL` and `MCP_BIND_ADDRESS` settings to `.env.local` too. `MCP_HOST` in `.env` does not control the Compose port binding; use `MCP_BIND_ADDRESS` above.

### 3. Restart and check published ports

On the **Snap host**, from the repository root, recreate the containers:

```bash
docker compose up -d --build
docker compose ps -a
```

If you chose the local-frontend workflow, use `docker compose up -d --build mcp` instead of the first command so Compose does not also start the web container on port 3000.

In `docker compose ps -a`, check that `mcp` is running and its published port is `0.0.0.0:3100->3100/tcp`. The web and MinIO ports should similarly show `0.0.0.0:3000` and `0.0.0.0:9000` when enabled. An `init` container that exited successfully is expected. If startup fails, inspect `docker compose logs init mcp`.

### 4. Allow access on your LAN

Allow inbound TCP **3100** on the Snap host for MCP. Allow **3000** if you want to open the dashboard from the agent machine, and **9000** only if you want to use the signed download URL. Restrict access to your trusted network or known clients.

- **Windows:** If Windows Defender Firewall blocks access, add inbound TCP port rules for the required ports on the private network profile. See [Microsoft's firewall guidance](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/rules).
- **macOS:** Check macOS firewall and network security settings for Docker Desktop. Docker Desktop forwards published container ports through its backend process; see [Docker Desktop networking](https://docs.docker.com/desktop/features/networking/).
- **Linux:** Check Docker's published-port firewall configuration and any upstream firewall. Docker-managed port rules can bypass UFW rules; see [Docker's firewall documentation](https://docs.docker.com/engine/network/packet-filtering-firewalls/).

Binding `0.0.0.0` can make a port reachable on **all** network interfaces, including public interfaces. Use a specific LAN bind address or restrict access at the firewall/router as appropriate. For internet-facing access, use HTTPS and deployment-specific secrets.

### 5. Test from the agent machine

From the **agent machine**, open `http://192.168.1.20:3000` if the dashboard is exposed, or configure its MCP client with `http://192.168.1.20:3100/mcp` and the generated `X-Snap-API-Key`. A successful MCP connection and a reachable download endpoint are separate checks.

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

The response should contain `"status":"ok"`. This checks connectivity only; MCP calls also need a valid key.

## Skill content and signed downloads

For object-backed skills, `get_skill` returns JSON with `name`, `description`, `confidence`, `content`, `url`, and `expiresInSeconds`. Read `content` directly. The optional `url` is a signed HTTP download that expires after 300 seconds; it is not an MCP resource. Legacy DynamoDB-only skills return inline Markdown instead.

Revoking an MCP key prevents subsequent MCP calls but does not invalidate a download URL that was already issued; it remains usable until expiry.

The agent must be able to reach the exact `S3_PUBLIC_ENDPOINT` used for signing. If a URL shows `127.0.0.1` for a remote agent, set `S3_PUBLIC_ENDPOINT` in the Snap host's Compose `.env` to a reachable storage address, recreate the MCP container, and call `get_skill` again. Do not change the hostname in an existing signed URL: the host is part of the signature.

For internet-facing access, use HTTPS, strong credentials and suitable firewall rules. Browser MCP clients also need their origin in `MCP_ALLOWED_ORIGINS`.

The Compose example defaults to `SESSION_COOKIE_SECURE=false` so login works over local HTTP, including a LAN IP. When serving the dashboard over HTTPS, set `SESSION_COOKIE_SECURE=true`. If a reverse proxy changes the host or terminates TLS, set `APP_ORIGIN` to the exact browser-facing dashboard origin, for example `https://snap.example.com` (no path or trailing slash). Without it, Snap checks the request's Host and protocol. Configure your proxy to reject unexpected hosts and strip untrusted forwarded headers. A browser client that sends an Origin to MCP must separately be included in `MCP_ALLOWED_ORIGINS`; a non-browser MCP client can omit Origin.


[Back to quick start](../README.md#quickstart)
