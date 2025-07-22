import type {AppLoadContext, EntryContext} from '@shopify/remix-oxygen';

import {RemixServer} from '@remix-run/react';
import {createContentSecurityPolicy} from '@shopify/hydrogen';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  context: AppLoadContext,
) {
  const {header, nonce, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    ...createCspHeaders({
      projectId: context.env.PUBLIC_SANITY_STUDIO_PROJECT_ID,
    }),
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <RemixServer context={remixContext} nonce={nonce} url={request.url} />
    </NonceProvider>,
    {
      nonce,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
      signal: request.signal,
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

export const createCspHeaders = ({projectId}: {projectId: string}) => {
  // Default CSP headers, will be used as a base for all environments
  const defaultsCSPHeaders = {
    connectSrc: [
      "'self'",
      `https://${projectId}.api.sanity.io`,
      `wss://${projectId}.api.sanity.io`,
      'https://cdn.sanity.io',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://analytics.google.com',
      'https://connect.facebook.net',
      'https://www.facebook.com',
      'https://s.pinimg.com',
      'https://ct.pinterest.com',
      'https://api.pinterest.com',
      'https://a.klaviyo.com',
      'https://static.klaviyo.com',
      'https://vitals.vercel-insights.com',
      'https://monorail-edge.shopifysvc.com',
      'https://checkout.shopifycs.com',
      '*',
    ],
    fontSrc: ['https://cdn.sanity.io', "'self'"],
    frameAncestors: ["'self'"],
    frameSrc: ["'self'"],
    imgSrc: [
      '*.sanity.io',
      'https://cdn.shopify.com',
      "'self'",
      'localhost:*',
      'https://lh3.googleusercontent.com',
      '*.mux.com',
      'https://www.facebook.com',
      'https://connect.facebook.net',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://stats.g.doubleclick.net',
      'https://ct.pinterest.com',
      'https://i.pinimg.com',
      'data:',
    ],
    mediaSrc: ["'self'", '*.mux.com', 'blob:'],
    scriptSrc: [
      "'self'",
      'localhost:*',
      'https://cdn.shopify.com',
      'https://www.gstatic.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://ssl.google-analytics.com',
      'https://connect.facebook.net',
      'https://s.pinimg.com',
      'https://static.klaviyo.com',
      'https://a.klaviyo.com',
    ],
  };

  return defaultsCSPHeaders;
};
