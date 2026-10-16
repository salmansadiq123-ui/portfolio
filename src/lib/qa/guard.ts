import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { timingSafeEqual } from "node:crypto";

// The tool is passcode-gated so strangers can't burn the LLM quota or use it to probe other sites.
export function checkPasscode(given: unknown): string | null {
  const expected = process.env.QA_TOOL_PASSCODE;
  if (!expected) return "QA Lab is not configured yet (QA_TOOL_PASSCODE is not set on the server).";
  if (typeof given !== "string" || !given) return "Passcode required.";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "Wrong passcode.";
  return null;
}

const allowPrivate = () => process.env.QA_ALLOW_PRIVATE === "1";

export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

// Cheap per-request check (no DNS): blocks obvious internal hosts during the run.
export function isBlockedHost(hostname: string): boolean {
  if (allowPrivate()) return false;
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  return isIP(h) !== 0 && isPrivateAddress(h);
}

/** Validates the target URL and resolves it to make sure it points at the public internet. */
export async function validateTarget(raw: unknown): Promise<{ url: URL } | { error: string }> {
  if (typeof raw !== "string" || !raw.trim()) return { error: "Enter a website URL." };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);
  } catch {
    return { error: "That doesn't look like a valid URL." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { error: "Only http(s) URLs can be tested." };
  if (url.username || url.password) return { error: "Put credentials in the credential fields, not in the URL." };
  if (isBlockedHost(url.hostname)) return { error: "Private and local addresses can't be tested." };
  if (!allowPrivate()) {
    try {
      const addrs = await lookup(url.hostname, { all: true });
      if (addrs.some((a) => isPrivateAddress(a.address))) return { error: "That host resolves to a private address." };
    } catch {
      return { error: `Couldn't resolve ${url.hostname}.` };
    }
  }
  return { url };
}
