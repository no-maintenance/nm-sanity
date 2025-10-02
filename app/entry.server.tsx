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
      'https://*.googletagmanager.com',
      'https://*.google-analytics.com',
      'https://analytics.google.com',
      'https://connect.facebook.net',
      'https://*.facebook.com',
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
    fontSrc: [
      'https://cdn.sanity.io',
      "'self'",
      'https://fonts.gstatic.com',
      'https://static.klaviyo.com',
      'https://static-tracking.klaviyo.com',
      'https://*.doubleclick.net',
      'https://*.cloudinary.com',
      'https://*.shopify.com',
      'https://*.google-analytics.com',
      'https://*.googletagmanager.com',
      'https://*.google.com',
      'https://*.google.ca',
      'https://*.googleadservices.com',
      'https://*.facebook.com',
      'https://connect.facebook.net',
    ],
    frameAncestors: ["'self'"],
    frameSrc: [
      "'self'",
      'https://*.googletagmanager.com',
      'https://*.google.com',
      'https://*.doubleclick.net',
      'https://*.pinterest.com',
      'https://*.facebook.com',
    ],
    imgSrc: [
      '*.sanity.io',
      'https://cdn.shopify.com',
      "'self'",
      'localhost:*',
      'https://lh3.googleusercontent.com',
      '*.mux.com',
      'https://*.facebook.com',
      'https://connect.facebook.net',
      'https://*.google-analytics.com',
      'https://*.googletagmanager.com',
      'https://stats.g.doubleclick.net',
      'https://ct.pinterest.com',
      'https://i.pinimg.com',
      'data:',
      'https://*.google.com',
      'https://*.google.ca',
      'https://*.googleadservices.com',
      'https://cdnjs.cloudflare.com',
    ],
    mediaSrc: ["'self'", '*.mux.com', 'blob:'],
    scriptSrc: [
      "'self'",
      'localhost:*',
      'https://cdn.shopify.com',
      'https://*.gstatic.com',
      'https://*.googletagmanager.com',
      'https://*.google-analytics.com',
      'https://ssl.google-analytics.com',
      'https://connect.facebook.net',
      'https://s.pinimg.com',
      'https://static.klaviyo.com',
      'http://static.klaviyo.com',
      'https://a.klaviyo.com',
      'https://static-tracking.klaviyo.com',
      'https://*.doubleclick.net',
      'https://*.googlesyndication.com',
      'https://*.pinterest.com',
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://cdn.shopify.com',
      'https://fonts.googleapis.com',
      'https://static.klaviyo.com',
      'https://static-tracking.klaviyo.com',
    ],
    workerSrc: ["'self'", 'blob:'],
  };

  return defaultsCSPHeaders;
};
