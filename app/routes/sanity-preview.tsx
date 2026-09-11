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

export async function loader({context, request}: LoaderFunctionArgs) {
  const {env, sanitySession} = context;
  const useStega = env.SANITY_STUDIO_USE_PREVIEW_MODE === 'true';

  if (!sanitySession) {
    throw notFound();
  }

  const {searchParams} = new URL(request.url);

  // Require a secret so only staff (via Sanity Studio's Presentation tool, which
  // appends it) can enable preview mode. Fail closed: if the secret is unset or
  // does not match, do not reveal that this route exists or enable drafts.
  const previewSecret = env.SANITY_STUDIO_PREVIEW_SECRET;
  if (!previewSecret || searchParams.get('secret') !== previewSecret) {
    throw notFound();
  }

  const slug = safeInternalPath(searchParams.get('slug'));
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
