import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@shopify/remix-oxygen';
import type {ReactElement} from 'react';

import {useLoaderData} from '@remix-run/react';
import polarisCss from '@shopify/polaris/build/esm/styles.css?url';
import {lazy, Suspense} from 'react';

import {ClientOnly} from '~/components/client-only';

import studioStyles from './studio.css?url';

/**
 * Provide a consistent fallback to prevent hydration mismatch errors.
 */
function SanityStudioFallback(): ReactElement {
  return <></>;
}

/**
 * If server-side rendering, then return the fallback instead of the heavy dependency.
 * @see https://remix.run/docs/en/1.14.3/guides/constraints#browser-only-code-on-the-server
 */
const SanityStudio =
  typeof document === 'undefined'
    ? SanityStudioFallback
    : lazy(
        () =>
          /**
           * `lazy` expects the component as the default export
           * @see https://react.dev/reference/react/lazy
           */
          import('./sanity-studio.client'),
      );

export const meta: MetaFunction = () => [
  {
    content: 'width=device-width,initial-scale=1,viewport-fit=cover',
    name: 'viewport',
  },
  {
    content: 'same-origin',
    name: 'referrer',
  },
  {
    content: 'noindex',
    name: 'robots',
  },
];

export function headers(): HeadersInit {
  return {
    'Cache-Control': 'no-store',
  };
}

export const links: LinksFunction = () => {
  return [
    {href: studioStyles, rel: 'stylesheet'},
    {href: polarisCss, rel: 'stylesheet'},
    // The Studio's own favicon. It needs declaring here rather than inheriting
    // the storefront's: this route defines `meta`, and a Remix v2 route's meta
    // replaces its ancestors' instead of merging, so the root's favicon links
    // never reach /cms — the tab has been falling back to a default.
    // .ico first for anything that only looks for one; PNGs after so modern
    // browsers pick the size they actually want.
    {href: '/cms-favicon.ico', rel: 'icon', type: 'image/x-icon'},
    {href: '/cms-favicon-16.png', rel: 'icon', sizes: '16x16', type: 'image/png'},
    {href: '/cms-favicon-32.png', rel: 'icon', sizes: '32x32', type: 'image/png'},
    {href: '/cms-favicon-48.png', rel: 'icon', sizes: '48x48', type: 'image/png'},
    {href: '/cms-favicon-180.png', rel: 'apple-touch-icon', sizes: '180x180'},
  ];
};

export function loader({context}: LoaderFunctionArgs) {
  const {env} = context;
  const projectId = env.PUBLIC_SANITY_STUDIO_PROJECT_ID;
  const dataset = env.PUBLIC_SANITY_STUDIO_DATASET;
  const shopifyStoreDomain = env.PUBLIC_STORE_DOMAIN;

  return {
    dataset,
    projectId,
    shopifyStoreDomain,
  };
}

export default function Studio() {
  const {dataset, projectId, shopifyStoreDomain} =
    useLoaderData<typeof loader>();

  return (
    <ClientOnly>
      {() => (
        <Suspense>
          <SanityStudio
            dataset={dataset}
            projectId={projectId}
            shopifyStoreDomain={shopifyStoreDomain}
          />
        </Suspense>
      )}
    </ClientOnly>
  );
}
