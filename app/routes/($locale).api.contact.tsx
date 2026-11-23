import type {ActionFunctionArgs, LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {json} from '@shopify/remix-oxygen';

import {
  GmailSendError,
  getSendToken,
  parseServiceAccountKey,
  sendGmail,
} from '~/lib/gmail-send.server';

/**
 * Contact + appointment form delivery. The browser posts the form here; the
 * server emails it to the support inbox through the store's own Google
 * Workspace (see gmail-send.server.ts). Replaces the client-side EmailJS
 * send, whose public key and 200/month quota were being burned by bots.
 *
 * Env: GMAIL_SA_KEY_B64 (service account JSON, base64), CONTACT_FROM
 * (Workspace mailbox to send as), CONTACT_TO (inbox). Optional:
 * SANITY_EDITOR_KEY (editor-role Sanity token) to also keep a copy of every
 * submission in Sanity.
 */

const DEFAULT_MAILBOX = 'support@nomaintenance.us';
const MAX_FIELD = 1000;
const MAX_MESSAGE = 5000;

export type ContactKind = 'contact' | 'appointment';

export type ContactResponse =
  | {status: 'ok'}
  | {status: 'error'; code: 'invalid' | 'unavailable'; message: string};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: FormDataEntryValue | null, max = MAX_FIELD): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function addresses(env: Env) {
  return {
    from: env.CONTACT_FROM?.trim() || DEFAULT_MAILBOX,
    to: env.CONTACT_TO?.trim() || DEFAULT_MAILBOX,
  };
}

/**
 * GET /api/contact — readiness check (no email sent): can we mint a send
 * token as the configured mailbox? Handy after changing Google Admin.
 */
export async function loader({context}: LoaderFunctionArgs) {
  const {from, to} = addresses(context.env);
  try {
    const key = parseServiceAccountKey(context.env.GMAIL_SA_KEY_B64);
    await getSendToken(key, from);
    return json({ready: true, from, to});
  } catch (error) {
    const e = error as GmailSendError;
    return json({ready: false, from, to, stage: e.stage ?? 'unknown', reason: e.message});
  }
}

export async function action({context, request}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json<ContactResponse>(
      {status: 'error', code: 'invalid', message: 'Method not allowed'},
      {status: 405},
    );
  }
  const form = await request.formData();
  const kind: ContactKind =
    clean(form.get('kind')) === 'appointment' ? 'appointment' : 'contact';

  // Honeypot: people never see the "website" field; bots fill it. Pretend
  // success so they don't learn anything, and send nothing.
  if (clean(form.get('website'))) return json<ContactResponse>({status: 'ok'});

  const name = clean(form.get('name'));
  const email = clean(form.get('contact'));
  const message = clean(form.get('message'), MAX_MESSAGE);
  if (!name || !EMAIL_RE.test(email) || (kind === 'contact' && !message)) {
    return json<ContactResponse>(
      {
        status: 'error',
        code: 'invalid',
        message: 'Please fill in your name, a valid email and a message.',
      },
      {status: 400},
    );
  }

  const fields: Array<[string, string]> =
    kind === 'appointment'
      ? [
          ['Name', name],
          ['Email', email],
          ['Phone', clean(form.get('phone'))],
          ['Party size', clean(form.get('party_size'))],
          ['Requested time', clean(form.get('unformatted_requested_time'))],
          ['Message', message],
        ]
      : [
          ['Name', name],
          ['Email', email],
          ['Order number', clean(form.get('order_number'))],
          ['Subject', clean(form.get('subject'))],
          ['Message', message],
        ];

  const subjectLine =
    kind === 'appointment'
      ? `Appointment request from ${name}`
      : `Contact form: ${clean(form.get('subject')) || 'New message'} — ${name}`;

  const text = [
    kind === 'appointment'
      ? 'New appointment request from nomaintenance.us'
      : 'New message from the nomaintenance.us contact form',
    '',
    ...fields.map(([label, value]) => `${label}: ${value || '—'}`),
    '',
    `Reply to this email to answer ${name} directly.`,
  ].join('\n');

  const {from, to} = addresses(context.env);

  try {
    const key = parseServiceAccountKey(context.env.GMAIL_SA_KEY_B64);
    await sendGmail(key, {from, to, replyTo: `${name} <${email}>`, subject: subjectLine, text});
  } catch (error) {
    console.error('[api.contact] send failed:', error);
    return json<ContactResponse>(
      {
        status: 'error',
        code: 'unavailable',
        message: 'We could not send your message right now.',
      },
      {status: 502},
    );
  }

  // Best-effort copy in Sanity (only when the editor token is configured).
  await saveCopyInSanity(context.env, {kind, name, email, fields, message});

  return json<ContactResponse>({status: 'ok'});
}

async function saveCopyInSanity(
  env: Env,
  data: {
    kind: ContactKind;
    name: string;
    email: string;
    fields: Array<[string, string]>;
    message: string;
  },
) {
  const token = env.SANITY_EDITOR_KEY;
  const projectId = env.PUBLIC_SANITY_STUDIO_PROJECT_ID;
  const dataset = env.PUBLIC_SANITY_STUDIO_DATASET;
  if (!token || !projectId || !dataset) return;
  try {
    const res = await fetch(
      `https://${projectId}.api.sanity.io/v2024-01-01/data/mutate/${dataset}`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          mutations: [
            {
              create: {
                _type: 'contactRequest',
                kind: data.kind,
                name: data.name,
                email: data.email,
                details: data.fields
                  .filter(([label]) => !['Name', 'Email', 'Message'].includes(label))
                  .map(([label, value]) => `${label}: ${value || '—'}`)
                  .join('\n'),
                message: data.message,
                receivedAt: new Date().toISOString(),
              },
            },
          ],
        }),
      },
    );
    if (!res.ok) console.error('[api.contact] Sanity copy failed:', res.status);
  } catch (error) {
    console.error('[api.contact] Sanity copy failed:', error);
  }
}
