/**
 * Send email through the store's own Google Workspace (Gmail API) from the
 * server, using the existing Google service account with domain-wide
 * delegation. No third-party mail vendor, no public key in the browser.
 *
 * Requirements (Google Admin → Security → API controls → Domain-wide
 * delegation): the service account's client ID must be granted the
 * `https://www.googleapis.com/auth/gmail.send` scope. The `from` address must
 * be a real Workspace user mailbox (the account we impersonate).
 *
 * Runs on Oxygen (workerd): Web Crypto only, no Node APIs.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const GMAIL_SEND_URL =
  'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

export type ServiceAccountKey = {
  client_email: string;
  private_key: string;
};

export class GmailSendError extends Error {
  constructor(
    message: string,
    readonly stage: 'config' | 'token' | 'send',
    readonly status?: number,
  ) {
    super(message);
    this.name = 'GmailSendError';
  }
}

export function parseServiceAccountKey(b64: string | undefined): ServiceAccountKey {
  if (!b64) {
    throw new GmailSendError('GMAIL_SA_KEY_B64 is not set', 'config');
  }
  let parsed: Partial<ServiceAccountKey>;
  try {
    parsed = JSON.parse(atob(b64.trim())) as Partial<ServiceAccountKey>;
  } catch {
    throw new GmailSendError('GMAIL_SA_KEY_B64 is not valid base64 JSON', 'config');
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new GmailSendError('Service account key is missing fields', 'config');
  }
  return parsed as ServiceAccountKey;
}

const encoder = new TextEncoder();

function base64url(input: ArrayBuffer | Uint8Array | string): string {
  const bytes =
    typeof input === 'string'
      ? encoder.encode(input)
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

// One token per (service account, impersonated user) for its lifetime, so a
// burst of submissions doesn't mint a token each time.
const tokenCache = new Map<string, {token: string; expiresAt: number}>();

/**
 * Mint an OAuth access token for the Gmail send scope, acting as `sub`
 * (the mailbox that will appear as the sender).
 */
export async function getSendToken(
  key: ServiceAccountKey,
  sub: string,
): Promise<string> {
  const cacheKey = `${key.client_email}|${sub}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({alg: 'RS256', typ: 'JWT'}));
  const claims = base64url(
    JSON.stringify({
      iss: key.client_email,
      sub,
      scope: SEND_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 600,
    }),
  );
  const unsigned = `${header}.${claims}`;

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(key.private_key),
    {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'},
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsigned),
  );
  const assertion = `${unsigned}.${base64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    // "unauthorized_client" = the gmail.send scope isn't delegated to this
    // service account yet; "invalid_grant" = `sub` isn't a Workspace user.
    throw new GmailSendError(
      `Google token request failed: ${data.error ?? res.status} ${data.error_description ?? ''}`.trim(),
      'token',
      res.status,
    );
  }
  tokenCache.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  });
  return data.access_token;
}

// RFC 2047 so subjects/names with accents or emoji survive.
function encodeHeaderWord(value: string): string {
  return /^[\x20-\x7e]*$/.test(value)
    ? value
    : `=?UTF-8?B?${btoa(unescape(encodeURIComponent(value)))}?=`;
}

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * "Display Name <addr>" done safely. An unquoted comma in a name
 * ("Harrison, n") reads as TWO addresses in a header, which made Gmail's
 * Reply bounce with "Your message was not sent". Quote the name (escaping
 * quotes/backslashes), RFC 2047-encode it if it has non-ASCII characters,
 * and fall back to the bare address if there's no usable name.
 */
export function formatMailbox(name: string | undefined, address: string): string {
  const addr = sanitizeHeader(address).replace(/[<>"\s]/g, '');
  const cleanName = sanitizeHeader(name ?? '').replace(/["\\]/g, '');
  if (!cleanName) return addr;
  const display = /^[\x20-\x7e]*$/.test(cleanName)
    ? `"${cleanName}"`
    : encodeHeaderWord(cleanName);
  return `${display} <${addr}>`;
}

export type OutgoingMail = {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
};

/** Build the raw RFC 2822 message Gmail expects (base64url-encoded). */
export function buildRawMessage(mail: OutgoingMail): string {
  const lines = [
    `From: ${sanitizeHeader(mail.from)}`,
    `To: ${sanitizeHeader(mail.to)}`,
    mail.replyTo ? `Reply-To: ${sanitizeHeader(mail.replyTo)}` : null,
    `Subject: ${encodeHeaderWord(sanitizeHeader(mail.subject))}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(mail.text))),
  ].filter((l): l is string => l !== null);
  return base64url(lines.join('\r\n'));
}

/** Send `mail` as the impersonated `mail.from` mailbox. */
export async function sendGmail(
  key: ServiceAccountKey,
  mail: OutgoingMail,
): Promise<{id: string}> {
  const token = await getSendToken(key, mail.from);
  const res = await fetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({raw: buildRawMessage(mail)}),
  });
  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    error?: {message?: string};
  };
  if (!res.ok || !data.id) {
    throw new GmailSendError(
      `Gmail send failed: ${res.status} ${data.error?.message ?? ''}`.trim(),
      'send',
      res.status,
    );
  }
  return {id: data.id};
}
