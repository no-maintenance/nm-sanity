import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from '@shopify/remix-oxygen';

import {redirectDocument} from '@shopify/remix-oxygen';

import {notFound} from '~/lib/utils';

const ROOT_PATH = '/' as const;

/**
 * Only allow root-relative internal paths. Rejects absolute URLs
 * ("https://evil.com") and protocol-relative paths ("//evil.com",
 * "/\evil.com") that browsers treat as external origins. Prevents the
 * preview route from being used as an open-redirect gadget.
 */
function safeInternalPath(slug: null | string): string {
  if (!slug || !slug.startsWith('/')) return ROOT_PATH;
  if (slug[1] === '/' || slug[1] === '\\') return ROOT_PATH;
  return slug;
}

export async function action({context, request}: ActionFunctionArgs) {
  const {sanitySession} = context;

  if (!(request.method === 'POST' && sanitySession)) {
    return {message: 'Method not allowed'};
  }

  const body = await request.formData();
  const slug = safeInternalPath(body.get('slug') as string);
  const redirectTo = slug;

  return redirectDocument(redirectTo, {
    headers: {
      'Set-Cookie': await sanitySession.destroy(),
    },
  });
}

/**
 * Sanity's Presentation tool mints a single-use secret document
 * (`sanity.previewUrlSecret`) and appends it as `sanity-preview-secret`, with
 * the target path as `sanity-preview-pathname`. Validate the token against
 * that document rather than against a shared constant: the Studio bundle is
 * publicly downloadable at /cms, so any secret baked into it would not be
 * secret. Secrets are short-lived — treat anything older than an hour as
 * expired, matching @sanity/preview-url-secret.
 */
const PREVIEW_SECRET_TTL_MS = 60 * 60 * 1000;

async function sanitySecretIsValid(
  env: Env,
  secret: string,
): Promise<boolean> {
  const projectId = env.PUBLIC_SANITY_STUDIO_PROJECT_ID;
  const dataset = env.PUBLIC_SANITY_STUDIO_DATASET;
  // The secret document lives as a draft, so reading it needs a token; a
  // public (token-less) read would always come back empty.
  const token = env.SANITY_STUDIO_TOKEN;
  if (!projectId || !dataset || !token) return false;

  const query =
    '*[_type == "sanity.previewUrlSecret" && secret == $secret][0]{_updatedAt}';
  const url =
    `https://${projectId}.api.sanity.io/v2021-10-21/data/query/${dataset}` +
    `?query=${encodeURIComponent(query)}` +
    `&$secret=${encodeURIComponent(JSON.stringify(secret))}` +
    `&perspective=raw`;

  try {
    const response = await fetch(url, {
      headers: {Authorization: `Bearer ${token}`},
    });
    if (!response.ok) return false;
    const {result} = (await response.json()) as {
      result?: {_updatedAt?: string} | null;
    };
    if (!result?._updatedAt) return false;
    const age = Date.now() - new Date(result._updatedAt).getTime();
    return age >= 0 && age < PREVIEW_SECRET_TTL_MS;
  } catch {
    return false;
  }
}

export async function loader({context, request}: LoaderFunctionArgs) {
  const {env, sanitySession} = context;
  const useStega = env.SANITY_STUDIO_USE_PREVIEW_MODE === 'true';

  if (!sanitySession) {
    throw notFound();
  }

  const {searchParams} = new URL(request.url);

  // Two accepted ways in, both fail closed so the route stays invisible to
  // anyone without a valid token:
  //  1. Presentation's minted secret (the normal path).
  //  2. A shared SANITY_STUDIO_PREVIEW_SECRET, kept for any link that still
  //     uses it. Note the Studio cannot produce this itself — Vite only exposes
  //     VITE_-prefixed vars to the browser, so `import.meta.env
  //     .SANITY_STUDIO_PREVIEW_SECRET` is always undefined in the bundle.
  const sanitySecret = searchParams.get('sanity-preview-secret');
  const sharedSecret = env.SANITY_STUDIO_PREVIEW_SECRET;
  const legacySecret = searchParams.get('secret');

  const authorized = sanitySecret
    ? await sanitySecretIsValid(env, sanitySecret)
    : Boolean(sharedSecret) && legacySecret === sharedSecret;

  if (!authorized) {
    throw notFound();
  }

  const slug = safeInternalPath(
    searchParams.get('sanity-preview-pathname') ?? searchParams.get('slug'),
  );
  const redirectTo = slug + '?reload=true';

  sanitySession.set('previewMode', true);

  const headers = {
    'Set-Cookie': useStega ? await sanitySession.commit() : '',
  };

  return redirectDocument(redirectTo, {
    headers,
    status: 307,
  });
}
