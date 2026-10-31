/** Replace only a local default when the MCP port is deliberately network-bound. */
export function resolveMcpUrl(configured: string, networkExposed: boolean, browserHostname: string): string {
  if (!networkExposed || !configured || !browserHostname) return configured
  try {
    const url = new URL(configured)
    const localHosts = ["localhost", "127.0.0.1", "[::1]"]
    if (!localHosts.includes(url.hostname.toLowerCase()) || localHosts.includes(browserHostname.toLowerCase())) return configured
    url.hostname = browserHostname
    return url.toString()
  } catch {
    return configured
  }
}
