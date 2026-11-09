import {redirect} from '@shopify/remix-oxygen';

/**
 * Standalone FW26 "keys" gate — fully self-contained.
 *
 * This is DELIBERATELY independent of the Sanity site-protection system
 * (`requireUnprotectedAccess`, the `protectionConfig` document, password /
 * countdown / per-collection logic). It has exactly one job: when the switch
 * below is on, send every visitor to the keys minigame until they win, then let
 * them into the real site. Nothing here reads Sanity.
 *
 * ── THE SWITCH ───────────────────────────────────────────────────────────────
 * Flip this to turn the gate on/off. Because toggling it ships a deploy, the
 * edge cache is purged on every flip — so turning it on gates cleanly with no
 * stale-page lag, and turning it off restores the normal store immediately.
 */
export const KEYS_GATE_ENABLED = true;

// Path constants live in the client-safe config module (the gate page
// component needs them); re-exported here for server-side callers.
import {KEYS_GATE_PATH, KEYS_GATE_SUCCESS_REDIRECT} from './keys-gate.config';
export {KEYS_GATE_PATH, KEYS_GATE_SUCCESS_REDIRECT};

// Paths that must stay reachable while the gate is up: the gate route itself,
// the Sanity studio, APIs, and static/meta files. Everything else → the game.
const EXEMPT_EXACT = [KEYS_GATE_PATH];
const EXEMPT_PREFIX = ['/cms', '/api', '/_assets', '/favicon', '/robots.txt', '/sitemap.xml'];

/** Strip an optional locale prefix (e.g. `/en-ca/products` → `/products`). */
function stripLocale(pathname: string): string {
  const p = pathname.replace(/^\/[a-z]{2}(-[a-z]{2})?(?=\/|$)/i, '');
  return p === '' ? '/' : p;
}

function isExempt(pathname: string): boolean {
  const p = stripLocale(pathname);
  if (EXEMPT_EXACT.includes(p)) return true;
  return EXEMPT_PREFIX.some((e) => p === e || p.startsWith(e + '/'));
}

/**
 * Gate guard. Call once in the root loader. When the switch is on, redirects
 * any not-yet-unlocked visitor to the keys game (uncacheable), except on the
 * exempt paths above. No-ops entirely when the switch is off.
 */
export async function requireKeysGateUnlock(
  context: any,
  request: Request,
): Promise<void> {
  if (!KEYS_GATE_ENABLED) return;

  const url = new URL(request.url);
  if (isExempt(url.pathname)) return;

  const {passwordSession} = context;
  if (passwordSession.isGloballyAuthenticated()) return;

  // Remember where they were headed (nice-to-have; winners just go home).
  passwordSession.setPendingRedirect(url.pathname + url.search);

  throw redirect(KEYS_GATE_PATH, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Set-Cookie': await passwordSession.commit(),
    },
  });
}
