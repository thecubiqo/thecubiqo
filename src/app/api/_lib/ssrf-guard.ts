/**
 * SSRF guard for server-side fetches of user-controlled URLs.
 *
 * Any endpoint that fetches a URL the caller supplied (PDF reader, link
 * unfurlers, browser automation) must run the target through assertSafeUrl
 * first, or it becomes a server-side request forgery primitive: an attacker can
 * point it at cloud metadata (169.254.169.254), localhost, or internal RFC1918
 * services and exfiltrate the response.
 *
 * Checks: scheme allowlist (https by default), internal hostnames, IP-literal
 * private ranges, AND a DNS resolution check so a public hostname that resolves
 * to a private address (DNS rebinding) is also rejected.
 */

import { lookup } from 'dns/promises';
import net from 'net';

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;          // this-network, private, loopback
    if (a === 169 && b === 254) return true;                    // link-local incl. 169.254.169.254 metadata
    if (a === 172 && b >= 16 && b <= 31) return true;           // private
    if (a === 192 && b === 168) return true;                    // private
    if (a === 100 && b >= 64 && b <= 127) return true;          // CGNAT
    if (a >= 224) return true;                                  // multicast / reserved
    return false;
  }
  if (net.isIPv6(ip)) {
    const low = ip.toLowerCase();
    if (low === '::1' || low === '::') return true;             // loopback / unspecified
    if (low.startsWith('fe80')) return true;                    // link-local
    if (low.startsWith('fc') || low.startsWith('fd')) return true; // unique-local
    if (low.startsWith('::ffff:')) {                            // IPv4-mapped
      const v4 = low.split(':').pop() || '';
      if (net.isIPv4(v4)) return isPrivateIp(v4);
    }
    return false;
  }
  return false;
}

export type SsrfCheck = { ok: true; url: URL } | { ok: false; reason: string };

export async function assertSafeUrl(raw: string, opts: { allowHttp?: boolean } = {}): Promise<SsrfCheck> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }

  const scheme = url.protocol.toLowerCase();
  if (scheme !== 'https:' && !(opts.allowHttp && scheme === 'http:')) {
    return { ok: false, reason: 'scheme_not_allowed' };
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === 'metadata.google.internal'
  ) {
    return { ok: false, reason: 'internal_host' };
  }

  // IP literal → check directly.
  if (net.isIP(host)) {
    return isPrivateIp(host) ? { ok: false, reason: 'private_ip' } : { ok: true, url };
  }

  // Hostname → resolve and reject if ANY resolved address is private.
  try {
    const results = await lookup(host, { all: true });
    if (!results.length) return { ok: false, reason: 'dns_no_result' };
    for (const r of results) {
      if (isPrivateIp(r.address)) return { ok: false, reason: 'resolves_to_private_ip' };
    }
  } catch {
    return { ok: false, reason: 'dns_failed' };
  }

  return { ok: true, url };
}
